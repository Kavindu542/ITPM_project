const { GoogleGenerativeAI } = require("@google/generative-ai");

let disabledUntilMs = 0;
let lastDisableReason = "";
let lastErrorAtMs = 0;
let lastErrorMessage = "";
let lastTriedModel = "";
let lastQuotaRetrySeconds = null;
let lastQuotaHint = "";

const getModelCandidates = () => {
  const modelOverride = String(process.env.GEMINI_MODEL || "").trim();
  return [
    modelOverride,
    // Common Gemini model IDs across API versions
    // Prefer "Flash"-style models first to reduce free-tier pressure.
    // (Some IDs may not exist for every account; we try in order.)
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro-latest",
    "gemini-2.5-pro",
    "gemini-pro",
    "gemini-1.0-pro",
  ].filter(Boolean);
};

const setCooldownFromErrorMessage = (msg) => {
  const m = String(msg || "");
  if (/quota|too many requests|429/i.test(m)) {
    const isLikelyDailyFreeTier =
      /free[_ -]?tier/i.test(m) ||
      /free[_ -]?tier_request/i.test(m) ||
      /per\s*day|daily/i.test(m);

    const retry = m.match(/retry in\s+([0-9.]+)s/i);
    const seconds = retry ? Number(retry[1]) : NaN;

    lastQuotaRetrySeconds = Number.isFinite(seconds) ? seconds : null;
    lastQuotaHint = isLikelyDailyFreeTier ? "daily" : "rate";

    // If the API provides a retry-after, respect it.
    // If it looks like a daily free-tier cap, avoid hammering the API; cool down longer.
    const cooldownMs = Number.isFinite(seconds)
      ? Math.ceil((seconds + 2) * 1000)
      : isLikelyDailyFreeTier
        ? 10 * 60_000
        : 60_000;
    disabledUntilMs = Date.now() + cooldownMs;
    lastDisableReason = "quota";
    return true;
  }
  if (/api key|unauthorized|permission|403|401/i.test(m)) {
    disabledUntilMs = Date.now() + 10 * 60_000;
    lastDisableReason = "auth";
    lastQuotaRetrySeconds = null;
    lastQuotaHint = "";
    return true;
  }
  return false;
};

const recordGeminiError = ({ modelName, message }) => {
  lastErrorAtMs = Date.now();
  lastTriedModel = String(modelName || "");
  lastErrorMessage = String(message || "").slice(0, 500);
};

const getGeminiDebugStatus = () => {
  const apiKeyPresent = !!String(process.env.GEMINI_API_KEY || "").trim();
  return {
    apiKeyPresent,
    disabledUntilMs,
    disabledForMs: Math.max(0, disabledUntilMs - Date.now()),
    lastDisableReason: lastDisableReason || "",
    lastQuotaHint: lastQuotaHint || "",
    lastQuotaRetrySeconds,
    lastErrorAtMs,
    lastErrorMessage: lastErrorMessage || "",
    lastTriedModel: lastTriedModel || "",
  };
};

const generateTextWithGemini = async (parts) => {
  const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) return null;
  if (Date.now() < disabledUntilMs) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const candidates = getModelCandidates();
  if (!candidates.length) return null;

  for (const modelName of candidates) {
    try {
      lastTriedModel = String(modelName || "");
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(parts);
      const text = result?.response?.text?.() || "";
      const cleaned = String(text || "").trim();
      if (cleaned) return cleaned;
      return null;
    } catch (err) {
      const msg = String(err?.message || "");
      recordGeminiError({ modelName, message: msg });

      // Log a short warning to help debug env/quota/model issues (no secrets)
      console.warn(
        `[gemini] failed model=${String(modelName)} reason=${msg.slice(0, 160)}`,
      );

      // If model is missing/unsupported, try next candidate.
      if (/not found|is not found|not supported|404/i.test(msg)) {
        continue;
      }

      // Quota/auth: set cooldown and stop trying.
      if (setCooldownFromErrorMessage(msg)) {
        return null;
      }

      // Other errors: stop and fall back.
      return null;
    }
  }

  return null;
};

const extractJsonObject = (text) => {
  const s = String(text || "").trim();
  if (!s) return null;

  // Try direct JSON first
  try {
    return JSON.parse(s);
  } catch {
    // ignore
  }

  // Try fenced code block
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence && fence[1]) {
    try {
      return JSON.parse(fence[1]);
    } catch {
      // ignore
    }
  }

  // Try first {...} object span
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const candidate = s.slice(start, end + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  }

  return null;
};

const normalizeCategory = (value) => {
  const v = String(value || "")
    .trim()
    .toLowerCase();
  if (!v) return "";
  if (["notes", "tutes", "papers", "links", "other"].includes(v)) return v;
  return "";
};

const normalizeModuleCode = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const m = raw.match(/\b([A-Za-z]{2,6})\s*([0-9]{3,4})\b/);
  if (!m) return "";
  return `${String(m[1]).toUpperCase()}${String(m[2])}`;
};

const normalizeSemester = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const normalizeSemesterString = (value) => {
  if (value === null || value === undefined) return "";
  const s = String(value).trim();
  if (!s) return "";
  const m = s.match(/\b([1-4]\.[12])\b/);
  if (m) return m[1];
  // If Gemini returns a number like 3.2
  const n = Number(s);
  if (Number.isFinite(n)) {
    const ns = String(n);
    const m2 = ns.match(/\b([1-4]\.[12])\b/);
    return m2 ? m2[1] : "";
  }
  return "";
};

const normalizeDescription = (value) => {
  const s = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  return s.slice(0, 280);
};

const normalizeTitle = (value) => {
  const s = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  return s.slice(0, 180);
};

const normalizeSearchText = (value) => {
  const s = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  return s.slice(0, 160);
};

const inferSearchIntentWithGemini = async (prompt) => {
  const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) return null;

  if (Date.now() < disabledUntilMs) {
    return null;
  }

  const system =
    "You convert a user search prompt into JSON intent for a university study materials search. " +
    "Return ONLY a JSON object with keys: searchText, moduleCode, semester, category. " +
    "Rules: moduleCode like IT3020/SE3020 (uppercase, no spaces) or empty string. " +
    "semester is a number like 3.2 or null. " +
    "category must be one of: notes,tutes,papers,links,other or empty string. " +
    "searchText should be the best short keyword query for finding relevant documents.";

  const user = `Prompt: ${String(prompt || "").trim()}`;

  const text = await generateTextWithGemini([system, user]);
  if (!text) return null;
  const obj = extractJsonObject(text);
  if (!obj || typeof obj !== "object") return null;

  const normalized = {
    searchText: normalizeSearchText(obj.searchText || ""),
    moduleCode: normalizeModuleCode(obj.moduleCode || ""),
    semester: normalizeSemester(obj.semester),
    category: normalizeCategory(obj.category || ""),
  };

  // If Gemini didn't provide anything meaningful, ignore.
  const hasAny =
    !!normalized.searchText ||
    !!normalized.moduleCode ||
    normalized.semester !== null ||
    !!normalized.category;

  return hasAny ? normalized : null;
};

const inferMaterialAutofillWithGemini = async ({ fileName, extractedText }) => {
  const name = String(fileName || "").slice(0, 180);
  const snippet = String(extractedText || "")
    .replace(/\u0000/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);

  // If we have no useful content, Gemini can't infer reliably.
  if (!name && !snippet) return null;

  const system =
    "You extract study material metadata from a document snippet. " +
    "Return ONLY a JSON object with keys: title, moduleCode, semester, category, description. " +
    "Rules: moduleCode like IT3020/SE3020 (uppercase, no spaces) or empty string. " +
    "semester must be like 1.1, 1.2, ..., 4.2 or empty string. " +
    "category must be one of: notes,tutes,papers,links,other or empty string. " +
    "description should be a short 1-2 sentence summary (max 240 chars), or empty string if unknown. " +
    "Do NOT hallucinate: if unsure, return empty string for that field.";

  const user = `File name: ${name}\n` + `Document snippet:\n${snippet}`;

  const text = await generateTextWithGemini([system, user]);
  if (!text) return null;

  const obj = extractJsonObject(text);
  if (!obj || typeof obj !== "object") return null;

  const normalized = {
    title: normalizeTitle(obj.title || ""),
    moduleCode: normalizeModuleCode(obj.moduleCode || ""),
    semester: normalizeSemesterString(obj.semester),
    category: normalizeCategory(obj.category || ""),
    description: normalizeDescription(obj.description || ""),
  };

  const hasAny =
    !!normalized.title ||
    !!normalized.moduleCode ||
    !!normalized.semester ||
    !!normalized.category ||
    !!normalized.description;

  return hasAny ? normalized : null;
};

const generateAiSearchMessageWithGemini = async ({
  prompt,
  interpreted,
  results,
}) => {
  const p = String(prompt || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
  const safeResults = Array.isArray(results) ? results.slice(0, 6) : [];
  const compact = safeResults.map((r) => ({
    title: String(r?.title || "").slice(0, 140),
    moduleCode: String(r?.moduleCode || "").slice(0, 20),
    semester: r?.semester ?? null,
    category: String(r?.category || "").slice(0, 20),
    matchedIn: String(r?.matchedIn || "").slice(0, 20),
  }));

  const system =
    "You are an assistant for a university study material search. " +
    "Write a concise message (max 220 chars) telling the user what you found. " +
    "Do not fabricate documents. Mention the most relevant 1-3 titles if available. " +
    "Return ONLY plain text (no JSON, no markdown).";

  const user =
    `User prompt: ${p}\n` +
    `Interpreted filters: ${JSON.stringify(interpreted || {})}\n` +
    `Top results: ${JSON.stringify(compact)}`;

  const text = await generateTextWithGemini([system, user]);
  if (!text) return null;
  const msg = String(text).replace(/\s+/g, " ").trim();
  return msg ? msg.slice(0, 220) : null;
};

module.exports = {
  inferSearchIntentWithGemini,
  inferMaterialAutofillWithGemini,
  generateAiSearchMessageWithGemini,
  getGeminiDebugStatus,
};
