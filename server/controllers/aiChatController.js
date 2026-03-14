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

// Model fallback list: ordered by lowest friction / most likely to be enabled.
// Note: the API returns names like "models/gemini-flash-latest", but the SDK typically
// accepts the short name (without the "models/" prefix).
const DEFAULT_GEMINI_MODELS = [
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
  "gemini-2.0-flash-lite-001",
  "gemini-2.0-flash-lite",
  "gemini-pro-latest",
  "gemini-2.0-flash",
];

// Simple delay helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalize = (s) => String(s || "").toLowerCase();

const escapeRegExp = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// For very short tokens (acronyms like "ndm"), avoid substring matches inside other words.
// Example: token "ndm" should match "NDM" or "(ndm)" but not "random".
const containsToken = (haystack, token) => {
  const h = String(haystack || "");
  const t = String(token || "").trim();
  if (!h || !t) return false;

  // Word-boundary style match for short alphanumeric tokens.
  if (/^[a-z0-9]+$/.test(t) && t.length <= 4) {
    const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(t)}([^a-z0-9]|$)`);
    return re.test(h);
  }

  return h.includes(t);
};

const extractModuleCodes = (q) => {
  const text = String(q || "").toUpperCase();
  const matches = text.match(/\b[A-Z]{2,4}\d{3,4}\b/g) || [];
  return Array.from(new Set(matches));
};

const inferModuleCodeFromMaterial = (material) => {
  const direct = String(material?.moduleCode || "")
    .trim()
    .toUpperCase();
  if (direct) return direct;

  const extracted = Array.isArray(material?.extractedModuleCodes)
    ? material.extractedModuleCodes
        .map((c) => String(c).trim().toUpperCase())
        .filter(Boolean)
    : [];
  if (extracted.length) return extracted[0];

  const titleCodes = extractModuleCodes(material?.title);
  if (titleCodes.length) return titleCodes[0];

  const subjectCodes = extractModuleCodes(material?.subject);
  if (subjectCodes.length) return subjectCodes[0];

  const versionNames = Array.isArray(material?.versions)
    ? material.versions.map((v) => v?.originalName).filter(Boolean)
    : [];
  for (const name of versionNames) {
    const codes = extractModuleCodes(name);
    if (codes.length) return codes[0];
  }

  return "";
};

const extractSemesters = (q) => {
  const text = normalize(q);
  const semesters = new Set();
  const re = /\b(?:sem|semester)\s*(\d{1,2})\b/g;
  let m;
  while ((m = re.exec(text))) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n >= 1 && n <= 12) semesters.add(n);
  }
  return Array.from(semesters);
};

const extractCategoryHints = (q) => {
  const text = normalize(q);
  const hints = new Set();
  const add = (c) => hints.add(c);

  if (/\bnote(s)?\b/.test(text)) add("notes");
  if (/\b(tute|tutes|tutorial|tutorials)\b/.test(text)) add("tutes");
  if (/\b(past\s*paper|past\s*papers|paper|papers|exam)\b/.test(text))
    add("papers");
  if (/\b(link|links|url|website|resource)\b/.test(text)) add("links");

  return Array.from(hints);
};

const tokenize = (q) => {
  const cleaned = normalize(q)
    .replace(/[^a-z0-9\s\.\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const base = cleaned ? cleaned.split(" ").filter(Boolean) : [];

  // Remove very common filler words that otherwise hurt matching.
  const stop = new Set([
    "give",
    "show",
    "find",
    "need",
    "want",
    "please",
    "can",
    "you",
    "me",
    "i",
    "my",
    "for",
    "about",
    "any",
    "some",
    "the",
    "a",
    "an",
    "to",
    "of",
    "in",
    "on",
    "with",
    "materials",
    "material",
    "document",
    "documents",
    "notes",
    "tutes",
    "tutorial",
    "tutorials",
    "papers",
    "paper",
    "past",
    "exam",
    "link",
    "links",
  ]);

  const tokens = base.filter((t) => t && !stop.has(t));

  // Add acronym token based on leading letters of meaningful words.
  // Example: "Network Design & Management" -> "ndm"
  const wordsForAcronym = base.filter(
    (t) => /^[a-z]+$/.test(t) && t.length >= 3 && !stop.has(t),
  );
  const acronym = wordsForAcronym.map((w) => w[0]).join("");
  if (acronym && acronym.length >= 2 && acronym.length <= 10) {
    if (!tokens.includes(acronym)) tokens.push(acronym);
  }

  return tokens;
};

const scoreMaterial = (
  material,
  queryTokens,
  moduleCodes,
  semesters,
  categoryHints,
) => {
  const title = normalize(material.title);
  const description = normalize(material.description);
  const subject = normalize(material.subject);
  const moduleCode = String(material.moduleCode || "").toUpperCase();
  const semester =
    material.semester === null || material.semester === undefined
      ? null
      : Number(material.semester);
  const category = normalize(material.category);

  const versionNames = Array.isArray(material.versions)
    ? material.versions.map((v) => normalize(v?.originalName || ""))
    : [];

  const extractedModuleCodes = Array.isArray(material.extractedModuleCodes)
    ? material.extractedModuleCodes
        .map((c) => String(c).trim().toUpperCase())
        .filter(Boolean)
    : [];

  const extractedText = normalize(material.extractedText);

  let score = 0;

  if (moduleCodes.length > 0) {
    const moduleCodeEvidence = [
      String(material?.moduleCode || ""),
      String(material?.title || ""),
      String(material?.subject || ""),
      extractedModuleCodes.join(" "),
      String(material?.extractedText || ""),
      ...(Array.isArray(material?.versions)
        ? material.versions.map((v) => String(v?.originalName || ""))
        : []),
    ]
      .join(" ")
      .toUpperCase();

    const isModuleMatch = moduleCodes.some((code) => {
      if (!code) return false;
      if (moduleCode === code || moduleCode.includes(code)) return true;
      return moduleCodeEvidence.includes(code);
    });
    if (!isModuleMatch) return 0;

    for (const code of moduleCodes) {
      if (moduleCode === code) score += 50;
      else if (moduleCode.includes(code)) score += 25;
    }
  }

  for (const t of queryTokens) {
    if (t.length < 2) continue;
    if (containsToken(title, t)) score += 6;
    if (containsToken(subject, t)) score += 4;
    if (containsToken(description, t)) score += 2;
    if (versionNames.some((n) => n && containsToken(n, t))) score += 1;
    if (extractedText && containsToken(extractedText, t)) score += 1;
  }

  if (Array.isArray(semesters) && semesters.length > 0 && semester !== null) {
    if (semesters.includes(semester)) score += 15;
  }

  if (Array.isArray(categoryHints) && categoryHints.length > 0 && category) {
    if (categoryHints.includes(category)) score += 10;
  }

  return score;
};

const pickTopMaterials = (materials, userMessage, limit) => {
  const moduleCodes = extractModuleCodes(userMessage);
  const tokens = tokenize(userMessage);
  const semesters = extractSemesters(userMessage);
  const categoryHints = extractCategoryHints(userMessage);

  // If the prompt has no usable signals, avoid returning noisy matches.
  if (
    moduleCodes.length === 0 &&
    tokens.length === 0 &&
    semesters.length === 0 &&
    categoryHints.length === 0
  ) {
    return [];
  }

  // Minimum score required to consider a material "matched".
  // - If module codes exist, scoreMaterial already enforces module evidence.
  // - Otherwise, require a stronger match to reduce false positives.
  const minScore = moduleCodes.length > 0 ? 1 : 6;

  const scored = materials
    .map((m) => ({
      m,
      s: scoreMaterial(m, tokens, moduleCodes, semesters, categoryHints),
    }))
    .filter((x) => x.s >= minScore)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.m);

  // Important: if nothing scores, return an empty list (UI will show request button).
  return scored;
};

const buildRequestSuggestion = (userMessage) => {
  const moduleCodes = extractModuleCodes(userMessage);
  const moduleCode = moduleCodes[0] || "";

  const title = moduleCode
    ? `Study materials for ${moduleCode}`
    : "Missing study material";

  const description = `I searched for: "${String(userMessage || "").trim()}"\n\nPlease add relevant notes, tutorials, past papers, or links for this topic/module.`;

  return { title, description, moduleCode };
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

const extractTextFromGeminiResponse = (result) => {
  const response = result?.response;
  const text =
    typeof response?.text === "function" ? response.text() : response?.text;
  return String(text || "").trim();
};

const isRateLimitOrQuotaError = (msg) => {
  const s = String(msg || "");
  return (
    s.includes("429") ||
    s.includes("RESOURCE_EXHAUSTED") ||
    s.toLowerCase().includes("quota") ||
    s.toLowerCase().includes("rate")
  );
};

const isOverloadedOrTransientError = (msg) => {
  const s = String(msg || "");
  return (
    s.includes("503") ||
    s.toLowerCase().includes("overloaded") ||
    s.toLowerCase().includes("unavailable") ||
    s.toLowerCase().includes("timeout")
  );
};

const isInvalidModelError = (msg) => {
  const s = String(msg || "").toLowerCase();
  return (
    s.includes("not found") ||
    (s.includes("model") &&
      (s.includes("invalid") || s.includes("does not exist")))
  );
};

const getCandidateModels = () => {
  const configured = String(process.env.GEMINI_MODEL || "").trim();
  if (configured)
    return [
      configured,
      ...DEFAULT_GEMINI_MODELS.filter((m) => m !== configured),
    ];
  return DEFAULT_GEMINI_MODELS;
};

// Try a small set of models to avoid getting stuck on a zero-quota model.
// - For 429/quota: switch models immediately (don't wait long).
// - For transient (503): a couple quick retries per model.
const generateWithModelFallback = async (prompt) => {
  const genAI = getGenAI();
  const candidates = getCandidateModels();
  let lastErr = null;

  for (const modelName of candidates) {
    const model = genAI.getGenerativeModel({ model: modelName });

    // Quick retries for transient failures (but not for quota issues).
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const text = extractTextFromGeminiResponse(result);
        if (text) return { text, modelName };
        // Empty response is treated as failure so we can try another model.
        throw new Error("Empty Gemini response");
      } catch (err) {
        lastErr = err;
        const msg = String(err?.message || "");

        if (isRateLimitOrQuotaError(msg) || isInvalidModelError(msg)) {
          // Switch models immediately.
          break;
        }

        if (isOverloadedOrTransientError(msg) && attempt < 2) {
          await sleep(800 * attempt);
          continue;
        }

        // Non-transient errors: move to the next model.
        break;
      }
    }
  }

  throw lastErr || new Error("Unable to generate AI response");
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

    // Fetch all published study materials (we will score *all* of them)
    const materials = await StudyMaterial.find({ status: "published" })
      .select(
        "title description category moduleCode subject semester fileType downloadCount versions currentVersionId extractedModuleCodes extractedText",
      )
      .lean();

    // Compute ONLY matching materials. This is what the UI will show.
    const matchedAll = pickTopMaterials(
      materials,
      userMessage,
      materials.length,
    );
    const matchedForUi = matchedAll.slice(0, 50);

    if (matchedForUi.length === 0) {
      const payload = {
        reply: `I couldn't find any study materials matching your prompt: "${userMessage}".\n\nTry including the module code (e.g., IT3060) or the module name/keywords from the material title.`,
        matchedMaterials: [],
        totalMaterialsSearched: materials.length,
        totalMatches: 0,
        noMatches: true,
        requestSuggestion: buildRequestSuggestion(userMessage),
        rateLimited: false,
      };

      _cache.set(cacheKey, { ts: Date.now(), payload });
      return res.json(payload);
    }

    const pickedMaterials = matchedForUi.slice(0, MAX_CONTEXT_MATERIALS);
    const promptModuleCodes = extractModuleCodes(userMessage).map((c) =>
      String(c).trim().toUpperCase(),
    );

    // Build context with only the relevant materials info (keeps prompt small)
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
  Only matching materials are included below (showing ${pickedMaterials.length} of ${matchedAll.length} matches):
  ${materialContext || "No materials currently available in the database."}

Student's question: "${userMessage}"

Please analyze ONLY the materials provided and provide helpful recommendations. Do NOT mention any material IDs that are not included in the context. If the student's question implies a module name/code, prioritize those matches. Be thorough in your search - check titles, module codes, subjects, descriptions, and filenames for matches.`;

    let aiReply = "";
    let usedFallback = false;
    let modelUsed = "";

    try {
      const out = await generateWithModelFallback(fullPrompt);
      aiReply = out.text;
      modelUsed = out.modelName;
    } catch (err2) {
      console.error(
        "Gemini generation failed (falling back):",
        err2?.message || err2,
      );
      usedFallback = true;
      aiReply = buildLocalReply(userMessage, pickedMaterials);
    }

    // Build matched materials list for frontend cards (ONLY matching materials)
    const matchedMaterials = matchedForUi
      .map((m) => {
        const currentVersion = (m.versions || []).find(
          (v) => String(v._id) === String(m.currentVersionId),
        );

        const extractedCodes = Array.isArray(m.extractedModuleCodes)
          ? m.extractedModuleCodes
              .map((c) => String(c).trim().toUpperCase())
              .filter(Boolean)
          : [];

        const inferredModuleCode = inferModuleCodeFromMaterial({
          moduleCode: m.moduleCode,
          title: m.title,
          subject: m.subject,
          versions: m.versions,
          extractedModuleCodes: m.extractedModuleCodes,
          extractedText: m.extractedText,
        });

        const moduleCodeForUi = (() => {
          const stored = String(m.moduleCode || "")
            .trim()
            .toUpperCase();
          for (const c of promptModuleCodes) {
            if (!c) continue;
            if (stored === c || stored.includes(c)) return c;
            if (extractedCodes.includes(c)) return c;
          }

          if (
            extractedCodes.length === 1 &&
            extractedCodes[0] &&
            extractedCodes[0] !== stored
          ) {
            return extractedCodes[0];
          }

          // Prefer a 4-digit module code from extracted codes when multiple were found
          // (helps avoid picking student IDs like IT23421226 -> IT234).
          const extracted4 = extractedCodes.find((c) =>
            /\b[A-Z]{2,4}\d{4}\b/.test(c),
          );
          if (extracted4 && extracted4 !== stored) return extracted4;

          return stored || inferredModuleCode;
        })();

        return {
          id: m._id,
          title: m.title,
          description: m.description,
          moduleCode: moduleCodeForUi,
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
      totalMatches: matchedAll.length,
      noMatches: matchedAll.length === 0,
      rateLimited: usedFallback,
    };

    if (process.env.NODE_ENV === "development") {
      payload.aiModelUsed = modelUsed || (usedFallback ? "fallback" : "");
    }

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
