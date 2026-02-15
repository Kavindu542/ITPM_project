const https = require("https");
const StudyMaterial = require("../models/StudyMaterial");

const callGemini = (prompt) =>
  new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) return resolve("");
    const data = JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const options = {
      hostname: "generativelanguage.googleapis.com",
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    };
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          const text =
            json?.candidates?.[0]?.content?.parts?.[0]?.text ||
            json?.candidates?.[0]?.output ||
            "";
          resolve(String(text || ""));
        } catch (e) {
          resolve("");
        }
      });
    });
    req.on("error", () => resolve(""));
    req.write(data);
    req.end();
  });

const aiChat = async (req, res) => {
  const q = String(req.body?.message || req.query?.q || "").trim();
  const reqLimit =
    parseInt(req.body?.limit || req.query?.limit, 10) || (q ? 100 : 12);
  const limit = Math.max(1, Math.min(200, reqLimit));
  const semester = req.user?.semester || null;
  const modules = Array.isArray(req.user?.enrolledModules)
    ? req.user.enrolledModules.filter(Boolean)
    : [];

  // First try by semester; if nothing matches, fall back to all published
  const baseQuery = { status: "published" };
  const bySemesterQuery = semester ? { ...baseQuery, semester } : baseQuery;
  let items = await StudyMaterial.find(bySemesterQuery)
    .sort({ downloadCount: -1 })
    .limit(100)
    .select(
      "_id title description category moduleCode semester downloadCount currentVersionId versions",
    )
    .lean();
  if (!items.length) {
    items = await StudyMaterial.find(baseQuery)
      .sort({ downloadCount: -1 })
      .limit(100)
      .select(
        "_id title description category moduleCode semester downloadCount currentVersionId versions",
      )
      .lean();
  }

  if (modules.length) {
    const priority = new Set(modules.map((m) => String(m).toUpperCase()));
    items = items.sort((a, b) => {
      const am = priority.has(String(a.moduleCode || "").toUpperCase()) ? 1 : 0;
      const bm = priority.has(String(b.moduleCode || "").toUpperCase()) ? 1 : 0;
      if (am !== bm) return bm - am;
      return (b.downloadCount || 0) - (a.downloadCount || 0);
    });
  }

  const filtered = q
    ? items.filter((m) => {
        const t = `${m.title} ${m.description} ${m.moduleCode} ${m.category}`.toLowerCase();
        return t.includes(q.toLowerCase());
      })
    : items;

  const total = filtered.length;
  const top = q ? filtered.slice(0, limit) : items.slice(0, limit);
  const previewForLLM = top.slice(0, 12);
  const promptList = previewForLLM
    .map(
      (m, i) =>
        `${i + 1}. ${m.title} • ${m.moduleCode || "-"} • ${m.category} • Semester ${m.semester || "-"} • Downloads ${m.downloadCount || 0}`,
    )
    .join("\n");
  const sys =
    "You are a campus study helper. Based on the student's query and the provided materials list, suggest up to 8 most relevant items and give a short guidance. Keep it concise and helpful.";
  const userPart = `Student semester: ${semester || "unknown"}\nEnrolled modules: ${
    modules.length ? modules.join(", ") : "unknown"
  }\nQuery: ${q || "(no query)"}\nMaterials:\n${promptList}`;
  const text = await callGemini(`${sys}\n\n${userPart}`);

  const mapped = top.map((m) => {
    const current = (m.versions || []).find(
      (v) => String(v._id) === String(m.currentVersionId),
    );
    return {
      id: m._id,
      title: m.title,
      description: m.description || "",
      moduleCode: m.moduleCode || "",
      semester: m.semester,
      category: m.category,
      downloadCount: m.downloadCount || 0,
      currentVersionId: current?._id || null,
    };
  });

  return res.json({
    text: text || "Here are some materials that match your context.",
    items: mapped,
    total,
    hasMore: total > top.length,
  });
};

module.exports = { aiChat };

