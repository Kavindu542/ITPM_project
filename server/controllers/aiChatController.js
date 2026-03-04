const { GoogleGenerativeAI } = require("@google/generative-ai");
const StudyMaterial = require("../models/StudyMaterial");

const MAX_CONTEXT_MATERIALS = 30;
const CACHE_TTL_MS = 2 * 60 * 1000;
const _cache = new Map();

const getGenAI = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set in environment");
  return new GoogleGenerativeAI(key);
};

const SYSTEM_PROMPT = `You are CampusCore Study Assistant, an AI helper for university students.
Your job is to help students find relevant study materials from the available database.

When recommending materials, always format your response like this:
1. Start with a brief helpful message addressing the student's query.
2. List the recommended materials using this EXACT format for each match:

📄 **[Title]**
- Module: [moduleCode] | Subject: [subject]
- Semester: [semester] | Category: [category]
- Description: [description]
- Material ID: [id]

3. End with a helpful tip or suggestion.

If no materials match, politely say so and suggest what the student could search for instead.
Be conversational, friendly, and helpful. Use emojis sparingly for warmth.
Always analyze ALL provided materials carefully before responding.
Match materials based on module codes, subjects, titles, descriptions, and any relevant keywords.
For example, if someone asks about "PAF", look for materials with moduleCode, subject, or title containing "PAF" or related terms.`;

// Simple delay helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalize = (s) => String(s || "").toLowerCase();

const extractModuleCodes = (q) => {
  const text = String(q || "").toUpperCase();
  const matches = text.match(/\b[A-Z]{2,4}\d{3,4}\b/g) || [];
  return Array.from(new Set(matches));
};

const tokenize = (q) => {
  const cleaned = normalize(q)
    .replace(/[^a-z0-9\s\.\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned ? cleaned.split(" ").filter(Boolean) : [];
};

const scoreMaterial = (material, queryTokens, moduleCodes) => {
  const title = normalize(material.title);
  const description = normalize(material.description);
  const subject = normalize(material.subject);
  const moduleCode = String(material.moduleCode || "").toUpperCase();

  let score = 0;

  if (moduleCodes.length > 0) {
    for (const code of moduleCodes) {
      if (moduleCode === code) score += 50;
      else if (moduleCode.includes(code)) score += 25;
    }
  }

  for (const t of queryTokens) {
    if (t.length < 2) continue;
    if (title.includes(t)) score += 6;
    if (subject.includes(t)) score += 4;
    if (description.includes(t)) score += 2;
  }

  return score;
};

const pickTopMaterials = (materials, userMessage, limit) => {
  const moduleCodes = extractModuleCodes(userMessage);
  const tokens = tokenize(userMessage);

  const scored = materials
    .map((m) => ({ m, s: scoreMaterial(m, tokens, moduleCodes) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.m);

  // If nothing scores, still include a small slice for Gemini context/fallback.
  if (scored.length === 0)
    return materials.slice(0, Math.min(limit, materials.length));
  return scored;
};

const buildLocalReply = (userMessage, picked) => {
  if (!picked || picked.length === 0) {
    return `I couldn't find any published study materials right now. Try searching by module code (e.g., IT3060) or keywords from the title/description.`;
  }

  const lines = [];
  lines.push(
    `I’m having trouble reaching the AI service right now, but I can still help you find materials. Here are the closest matches for: "${userMessage}"`,
  );
  lines.push("");

  const shown = picked.slice(0, Math.min(10, picked.length));
  shown.forEach((m) => {
    lines.push(`📄 **${m.title || "Untitled"}**`);
    lines.push(
      `- Module: ${m.moduleCode || "N/A"} | Subject: ${m.subject || "N/A"}`,
    );
    lines.push(
      `- Semester: ${m.semester || "N/A"} | Category: ${m.category || "N/A"}`,
    );
    lines.push(`- Description: ${m.description || "No description"}`);
    lines.push(`- Material ID: ${String(m._id)}`);
    lines.push("");
  });

  lines.push(
    "Tip: If you tell me your module code + semester, I can narrow it down faster.",
  );
  return lines.join("\n").trim();
};

// Call Gemini with retry for rate-limit errors
const callGeminiWithRetry = async (model, prompt, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text =
        typeof response.text === "function" ? response.text() : response.text;
      return text;
    } catch (err) {
      const msg = String(err.message || "");
      const isRetryable =
        msg.includes("429") ||
        msg.includes("503") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("retry") ||
        msg.includes("RetryInfo") ||
        msg.includes("overloaded");

      if (isRetryable && attempt < maxRetries) {
        const delayMs = attempt * 3000; // 3s, 6s, 9s
        console.log(
          `Gemini rate-limited. Retry ${attempt}/${maxRetries} in ${delayMs}ms...`,
        );
        await sleep(delayMs);
        continue;
      }
      throw err;
    }
  }
};

const aiChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const userMessage = String(message).trim();

    // Short TTL cache (prevents rapid re-sends from spamming Gemini)
    const userId = req.user?._id || req.user?.id || "anon";
    const cacheKey = `${String(userId)}::${normalize(userMessage)}`;
    const cached = _cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return res.json(cached.payload);
    }

    // Fetch all published study materials
    const materials = await StudyMaterial.find({ status: "published" })
      .select(
        "title description category moduleCode subject semester fileType downloadCount versions currentVersionId",
      )
      .lean();

    const pickedMaterials = pickTopMaterials(
      materials,
      userMessage,
      MAX_CONTEXT_MATERIALS,
    );

    // Build context with only the most relevant materials info (keeps prompt small)
    const materialContext = pickedMaterials
      .map((m, i) => {
        const currentVersion = (m.versions || []).find(
          (v) => String(v._id) === String(m.currentVersionId),
        );
        return `[${i + 1}] ID: ${m._id} | Title: "${m.title}" | Module: "${m.moduleCode || "N/A"}" | Subject: "${m.subject || "N/A"}" | Semester: ${m.semester || "N/A"} | Category: ${m.category || "N/A"} | Description: "${m.description || "No description"}" | File: "${currentVersion?.originalName || "N/A"}" | Downloads: ${m.downloadCount || 0}`;
      })
      .join("\n");

    const fullPrompt = `${SYSTEM_PROMPT}

  Total published study materials in DB: ${materials.length}
  Here are the most relevant materials to search within (showing ${pickedMaterials.length}):
  ${materialContext || "No materials currently available in the database."}

Student's question: "${userMessage}"

Please analyze the materials and provide helpful recommendations. If the student asks about a specific subject or module, find all matching materials. Be thorough in your search - check titles, module codes, subjects, descriptions, and filenames for matches.`;

    let aiReply = "";
    let usedFallback = false;

    try {
      const genAI = getGenAI();
      const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
      const model = genAI.getGenerativeModel({ model: modelName });
      aiReply = await callGeminiWithRetry(model, fullPrompt);
    } catch (err2) {
      const msg2 = String(err2?.message || "");
      const isRateLimit =
        msg2.includes("429") ||
        msg2.includes("RESOURCE_EXHAUSTED") ||
        msg2.includes("retry") ||
        msg2.includes("overloaded") ||
        msg2.includes("GEMINI_API_KEY is not set");

      if (!isRateLimit) throw err2;

      usedFallback = true;
      aiReply = buildLocalReply(userMessage, pickedMaterials);
    }

    // Extract material IDs mentioned in the response (prefer picked subset)
    const mentionedIds = [];
    for (const mat of pickedMaterials) {
      const id = String(mat._id);
      if (aiReply.includes(id)) mentionedIds.push(id);
    }

    // If fallback didn't mention IDs, just show picked materials
    if (usedFallback && mentionedIds.length === 0) {
      mentionedIds.push(
        ...pickedMaterials.slice(0, 10).map((m) => String(m._id)),
      );
    }

    // Build matched materials list for frontend cards
    const matchedMaterials = mentionedIds
      .map((id) => {
        const m = materials.find((mat) => String(mat._id) === id);
        if (!m) return null;
        const currentVersion = (m.versions || []).find(
          (v) => String(v._id) === String(m.currentVersionId),
        );
        return {
          id: m._id,
          title: m.title,
          description: m.description,
          moduleCode: m.moduleCode,
          subject: m.subject,
          semester: m.semester,
          category: m.category,
          fileType: m.fileType,
          downloadCount: m.downloadCount || 0,
          currentVersion: currentVersion
            ? {
                id: currentVersion._id,
                originalName: currentVersion.originalName,
                mimeType: currentVersion.mimeType,
                sizeBytes: currentVersion.sizeBytes,
              }
            : null,
        };
      })
      .filter(Boolean);

    const payload = {
      reply: aiReply,
      matchedMaterials,
      totalMaterialsSearched: materials.length,
      rateLimited: usedFallback,
    };

    _cache.set(cacheKey, { ts: Date.now(), payload });
    res.json(payload);
  } catch (err) {
    console.error("AI Chat error:", err.message || err);

    res.status(500).json({
      error: "Failed to get AI response. Please try again.",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

module.exports = { aiChat };
