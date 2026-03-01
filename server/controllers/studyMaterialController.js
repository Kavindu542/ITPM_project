const fs = require("fs");
const path = require("path");
const pdfParseLib = require("pdf-parse");
const mammoth = require("mammoth");
const StudyMaterial = require("../models/StudyMaterial");
const StudyMaterialDownload = require("../models/StudyMaterialDownload");
const StudyMaterialBookmark = require("../models/StudyMaterialBookmark");
const StudyMaterialReview = require("../models/StudyMaterialReview");
const User = require("../models/User");
const { sendBulkEmail } = require("../utils/email");
const {
  inferSearchIntentWithGemini,
  inferMaterialAutofillWithGemini,
  getGeminiDebugStatus,
} = require("../utils/geminiSearchIntent");

const UPLOAD_ROOT = path.join(__dirname, "..", "uploads", "study-materials");

const ensureUploadDir = () => {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
};

const normalizeStringArray = (value) => {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  // Accept comma-separated values
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

const normalizeNumberArray = (value) => {
  const strings = normalizeStringArray(value);
  const nums = strings.map((s) => Number(s)).filter((n) => Number.isFinite(n));
  return Array.from(new Set(nums));
};

const isAdmin = (req) => req.auth?.module === "study-material";

const matchesAccess = (user, material) => {
  // Official/admin uploads should be visible to all students.
  // (Student contributions use the access rules when present.)
  if (material && material.suggested === false) return true;
  if (!material?.access) return true;

  const role = String(user?.role || "student").trim();

  const allowedRoles = Array.isArray(material.access.allowedRoles)
    ? material.access.allowedRoles.filter(Boolean)
    : [];
  if (allowedRoles.length && !allowedRoles.includes(role)) return false;

  const allowedSemesters = Array.isArray(material.access.allowedSemesters)
    ? material.access.allowedSemesters
    : [];
  if (allowedSemesters.length) {
    const sem = user?.semester;
    if (!Number.isFinite(sem)) return false;
    if (!allowedSemesters.includes(sem)) return false;
  }

  const allowedModules = Array.isArray(material.access.allowedModules)
    ? material.access.allowedModules.filter(Boolean)
    : [];
  if (allowedModules.length) {
    const enrolled = Array.isArray(user?.enrolledModules)
      ? user.enrolledModules.map((m) => String(m).trim())
      : [];
    if (!enrolled.length) return false;
    const ok = allowedModules.some((m) => enrolled.includes(m));
    if (!ok) return false;
  }

  return true;
};

const getSafeFileName = (originalName) => {
  const base = String(originalName || "file").replace(/[^a-zA-Z0-9._-]+/g, "_");
  return base.slice(0, 120) || "file";
};

const escapeRegExp = (value) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const exactCaseInsensitive = (value) =>
  new RegExp(`^${escapeRegExp(String(value || "").trim())}$`, "i");

const EXTRACT_MAX_BYTES = 25 * 1024 * 1024; // 25MB
const EXTRACT_MAX_CHARS = 140_000;

const normalizeExtractedText = (value) =>
  String(value || "")
    .replace(/\u0000/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildKeywordRegex = (prompt) => {
  const words = String(prompt || "")
    .toLowerCase()
    .split(/[^a-z0-9.+]+/i)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3)
    .slice(0, 8);
  if (!words.length) return null;
  const pattern = words.map(escapeRegExp).join("|");
  return new RegExp(pattern, "i");
};

const extractTextFromUploadedFile = async (file) => {
  try {
    if (!file?.path) return "";
    const abs = path.isAbsolute(file.path)
      ? file.path
      : path.join(__dirname, "..", file.path);
    if (!fs.existsSync(abs)) return "";

    const stat = fs.statSync(abs);
    if (!stat?.size || stat.size <= 0) return "";
    if (stat.size > EXTRACT_MAX_BYTES) return "";

    const originalName = String(file.originalname || "");
    const mimeType = String(file.mimetype || "").toLowerCase();
    const ext = path.extname(originalName).toLowerCase();

    // PDF
    if (mimeType === "application/pdf" || ext === ".pdf") {
      // Newer pdf-parse versions expose a PDFParse class API.
      if (typeof pdfParseLib?.PDFParse === "function") {
        const parser = new pdfParseLib.PDFParse({ url: abs });
        await parser.load();
        const out = await parser.getText();
        await parser.destroy();
        const text = normalizeExtractedText(out?.text || "");
        return text.slice(0, EXTRACT_MAX_CHARS);
      }

      // Older pdf-parse versions export a function that accepts a buffer.
      const pdfParse =
        typeof pdfParseLib === "function" ? pdfParseLib : pdfParseLib?.default;
      if (typeof pdfParse !== "function") return "";
      const buf = fs.readFileSync(abs);
      const parsed = await pdfParse(buf);
      const text = normalizeExtractedText(parsed?.text || "");
      return text.slice(0, EXTRACT_MAX_CHARS);
    }

    // DOCX
    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      ext === ".docx"
    ) {
      const buf = fs.readFileSync(abs);
      const parsed = await mammoth.extractRawText({ buffer: buf });
      const text = normalizeExtractedText(parsed?.value || "");
      return text.slice(0, EXTRACT_MAX_CHARS);
    }

    // Plain text
    if (mimeType.startsWith("text/") || ext === ".txt" || ext === ".md") {
      const buf = fs.readFileSync(abs);
      const text = normalizeExtractedText(buf.toString("utf8"));
      return text.slice(0, EXTRACT_MAX_CHARS);
    }

    return "";
  } catch {
    return "";
  }
};

const cleanTitleFromName = (originalName) => {
  const base = path.basename(
    String(originalName || ""),
    path.extname(String(originalName || "")),
  );
  return base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);
};

const inferCategoryFromText = (text) => {
  const t = String(text || "");
  if (
    /\b(past\s*papers?|papers?|mid\s*exam|final\s*exam|exam(\s*paper)?|quiz)\b/i.test(
      t,
    )
  ) {
    return "papers";
  }
  if (/\b(tutorials?|tutes?|tutorial\s*sheets?)\b/i.test(t)) return "tutes";
  if (/\b(lecture\s*notes?|notes?)\b/i.test(t)) return "notes";
  if (/\b(links?|urls?)\b/i.test(t)) return "links";
  return "";
};

const inferSemesterFromText = (text) => {
  const raw = String(text || "");
  const m = raw.match(/\b([1-4]\.[12])\b/);
  if (m) return m[1];
  const m2 = raw.match(/\bsemester\s*([1-4])\s*([12])\b/i);
  if (m2) return `${m2[1]}.${m2[2]}`;
  const m3 = raw.match(/\byear\s*([1-4])\s*semester\s*([12])\b/i);
  if (m3) return `${m3[1]}.${m3[2]}`;
  return "";
};

const inferModuleCodeFromText = (text) => {
  const raw = String(text || "");
  const moduleMatch = raw.match(/\b([a-z]{2,6})\s*([0-9]{3,4})\b/i);
  if (!moduleMatch) return "";
  return `${String(moduleMatch[1] || "").toUpperCase()}${String(moduleMatch[2] || "")}`;
};

const snippetFromExtractedText = (text) => {
  const t = normalizeExtractedText(text);
  if (!t || t.length < 40) return "";
  return t.slice(0, 280);
};

const scanSuggestionAutofill = async (req, res) => {
  ensureUploadDir();

  if (!req.file) {
    return res.status(400).json({ message: "file is required" });
  }

  const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    // Cleanup scanned file (the user will upload again on submit)
    try {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch {
      // ignore
    }
    return res.status(503).json({
      message:
        "Gemini is required for document scanning/autofill. Configure GEMINI_API_KEY in server/.env.",
    });
  }

  let extractedText = "";
  try {
    extractedText = await extractTextFromUploadedFile(req.file);

    const gemini = await inferMaterialAutofillWithGemini({
      fileName: req.file.originalname,
      extractedText,
    });

    if (!gemini) {
      const st = getGeminiDebugStatus ? getGeminiDebugStatus() : null;
      const retrySec = st?.disabledForMs
        ? Math.max(1, Math.ceil(st.disabledForMs / 1000))
        : null;

      const quotaHelp =
        "Gemini free-tier quota exceeded. Try a Flash model (set GEMINI_MODEL to gemini-2.5-flash if available, or gemini-2.0-flash / gemini-1.5-flash), or enable billing. Free-tier quotas often reset daily (UTC).";
      const extra =
        st?.lastDisableReason === "quota"
          ? st?.lastQuotaHint === "daily"
            ? " (free-tier quota)"
            : retrySec
              ? ` (rate limited — retry in ~${retrySec}s)`
              : " (rate limited)"
          : st?.lastDisableReason
            ? ` (${st.lastDisableReason})`
            : "";

      return res.status(503).json({
        message:
          st?.lastDisableReason === "quota"
            ? `${quotaHelp}${extra ? ` ${extra}` : ""}`
            : `Gemini is required for document scanning/autofill, but it is currently unavailable${extra}.`,
      });
    }

    return res.json({
      title: gemini.title || "",
      moduleCode: gemini.moduleCode || "",
      semester: gemini.semester || "",
      category: gemini.category || "",
      description: gemini.description || "",
    });
  } catch {
    return res.status(503).json({
      message:
        "Gemini is required for document scanning/autofill, but the request failed.",
    });
  } finally {
    // Cleanup scanned file (the user will upload again on submit)
    try {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch {
      // ignore
    }
  }
};

const parseAiSearchPrompt = (prompt) => {
  const raw = String(prompt || "").trim();
  const lowered = raw.toLowerCase();

  const moduleMatch = raw.match(/\b([a-z]{2,6})\s*([0-9]{3,4})\b/i);
  const moduleCode = moduleMatch
    ? `${String(moduleMatch[1] || "").toUpperCase()}${String(
        moduleMatch[2] || "",
      )}`
    : "";

  const semesterMatch = raw.match(/\b([1-4]\.[12])\b/);
  const semester = semesterMatch ? Number(semesterMatch[1]) : null;

  const category = (() => {
    if (/\b(past\s*papers?|papers?|mid\s*exam|final\s*exam)\b/i.test(raw)) {
      return "papers";
    }
    if (/\b(tutes?|tutorials?)\b/i.test(raw)) return "tutes";
    // Only treat as "notes" when user explicitly says "notes" or "lecture notes".
    // (Many users say "give me a note" meaning "a document"; that should NOT force category filtering.)
    if (/\b(lecture\s*notes?|notes)\b/i.test(raw)) return "notes";
    if (/\b(links?|urls?)\b/i.test(raw)) return "links";
    if (/\b(other|misc)\b/i.test(raw)) return "other";
    return "";
  })();

  // Keep the original prompt for $text search; it already captures intent well.
  // (We still apply structured filters when detected.)
  const searchText = raw;

  return {
    raw,
    lowered,
    moduleCode,
    semester: Number.isFinite(semester) ? semester : null,
    category,
    searchText,
  };
};

const findDuplicateMaterial = async ({
  title,
  moduleCode,
  semester,
  category,
  originalName,
}) => {
  const semValue = Number.isFinite(semester) ? semester : null;
  const normalizedTitle = String(title || "").trim();
  const normalizedModuleCode = String(moduleCode || "").trim();
  const normalizedCategory = String(category || "notes").trim() || "notes";
  const normalizedOriginalName = String(originalName || "").trim();

  if (!normalizedTitle && !normalizedOriginalName) return null;

  return StudyMaterial.findOne({
    status: { $ne: "archived" },
    $or: [
      {
        title: exactCaseInsensitive(normalizedTitle),
        moduleCode: exactCaseInsensitive(normalizedModuleCode),
        semester: semValue,
        category: normalizedCategory,
      },
      {
        "versions.originalName": exactCaseInsensitive(normalizedOriginalName),
        moduleCode: exactCaseInsensitive(normalizedModuleCode),
        semester: semValue,
      },
    ],
  })
    .select("_id title status")
    .lean();
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const notifyStudentsAboutNewMaterials = (titles = []) => {
  const cleanTitles = Array.from(
    new Set(
      (Array.isArray(titles) ? titles : [])
        .map((t) => String(t || "").trim())
        .filter(Boolean),
    ),
  );

  if (!cleanTitles.length) return;

  setImmediate(async () => {
    try {
      const students = await User.find({ role: "student" })
        .select("email")
        .lean();

      const emails = Array.from(
        new Set(
          (students || [])
            .map((u) =>
              String(u?.email || "")
                .trim()
                .toLowerCase(),
            )
            .filter(Boolean),
        ),
      );

      if (!emails.length) return;

      const appName = process.env.APP_NAME || "CampusCore";
      const subject = `${appName} - New Study Materials Added`;

      const listText = cleanTitles.map((t) => `- ${t}`).join("\n");
      const listHtml = cleanTitles
        .map((t) => `<li>${escapeHtml(t)}</li>`)
        .join("");

      const text = `New study materials have been added to ${appName}.\n\n${listText}`;
      const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.5">
          <h2 style="margin:0 0 12px 0">New study materials added</h2>
          <p style="margin:0 0 12px 0">The following materials were added:</p>
          <ul style="margin:0 0 12px 18px;padding:0">${listHtml}</ul>
          <p style="margin:0;color:#555;font-size:12px">This is an automated notification.</p>
        </div>
      `;

      await sendBulkEmail({ subject, text, html, bcc: emails, chunkSize: 50 });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        "Study material email notification failed:",
        err?.message || err,
      );
    }
  });
};

const listMaterials = async (req, res) => {
  const q = String(req.query.q || "").trim();
  const category = String(req.query.category || "").trim();
  const moduleCode = String(
    req.query.moduleCode || req.query.module || "",
  ).trim();
  const semester =
    req.query.semester !== undefined ? Number(req.query.semester) : null;

  const suggestedParam =
    req.query.suggested !== undefined ? String(req.query.suggested) : undefined;

  const uploaderRoleRaw =
    isAdmin(req) && req.query.uploaderRole !== undefined
      ? String(req.query.uploaderRole).trim()
      : "";
  const uploaderRole = uploaderRoleRaw ? uploaderRoleRaw.toLowerCase() : "";
  const sortBy = String(req.query.sortBy || "")
    .trim()
    .toLowerCase();

  const query = {};

  if (isAdmin(req)) {
    if (req.query.status) query.status = String(req.query.status).trim();
  } else {
    query.status = "published";
  }

  if (category) query.category = category;
  if (moduleCode) query.moduleCode = moduleCode;
  if (Number.isFinite(semester)) query.semester = semester;

  if (isAdmin(req) && suggestedParam !== undefined) {
    const v = suggestedParam.toLowerCase();
    if (v === "true" || v === "1") query.suggested = true;
    if (v === "false" || v === "0") query.suggested = false;
  }

  if (q) {
    query.$text = { $search: q };
  }

  let qy = StudyMaterial.find(query)
    .sort({ createdAt: -1 })
    .select(
      "title description category moduleCode subject semester fileType status suggested uploadedBy moderation access currentVersionId versions downloadCount lastDownloadedAt createdAt updatedAt",
    );

  // Admin screens often need uploader details.
  if (isAdmin(req)) {
    qy = qy.populate("uploadedBy", "_id studentId name email role");
  }

  const items = await qy.lean();

  const adminItems =
    isAdmin(req) && uploaderRole
      ? items.filter((m) => {
          const r = String(m?.uploadedBy?.role || "")
            .trim()
            .toLowerCase();
          return r ? r === uploaderRole : false;
        })
      : items;

  const user = req.user;
  const filtered = isAdmin(req)
    ? adminItems
    : items.filter((m) => matchesAccess(user, m));

  const materialIds = filtered.map((m) => m._id);
  const reviewStats = materialIds.length
    ? await StudyMaterialReview.aggregate([
        {
          $match: {
            materialId: { $in: materialIds },
            "moderation.status": { $ne: "removed" },
          },
        },
        {
          $group: {
            _id: "$materialId",
            avgRating: { $avg: "$rating" },
            reviewCount: { $sum: 1 },
          },
        },
      ])
    : [];
  const ratingMap = new Map(
    reviewStats.map((s) => [
      String(s._id),
      {
        avgRating: Number(s.avgRating || 0),
        reviewCount: Number(s.reviewCount || 0),
      },
    ]),
  );

  const bookmarks = await StudyMaterialBookmark.find({ userId: req.user._id })
    .select("materialId")
    .lean();
  const bookmarkedIds = new Set(bookmarks.map((b) => String(b.materialId)));

  const withFlags = filtered.map((m) => {
    const current = (m.versions || []).find(
      (v) => String(v._id) === String(m.currentVersionId),
    );
    const uploaderId = m.uploadedBy
      ? String(m.uploadedBy?._id || m.uploadedBy)
      : null;

    const uploadedByUser =
      isAdmin(req) && m.uploadedBy && m.uploadedBy._id
        ? {
            id: String(m.uploadedBy._id),
            studentId: m.uploadedBy.studentId,
            name: m.uploadedBy.name,
            email: m.uploadedBy.email,
            role: m.uploadedBy.role,
          }
        : null;

    const rating = ratingMap.get(String(m._id)) || {
      avgRating: 0,
      reviewCount: 0,
    };

    return {
      id: m._id,
      title: m.title,
      description: m.description,
      category: m.category,
      moduleCode: m.moduleCode,
      subject: m.subject,
      semester: m.semester,
      fileType: m.fileType,
      status: m.status,
      suggested: !!m.suggested,
      uploadedBy: uploaderId,
      uploadedByUser,
      downloadCount: m.downloadCount || 0,
      lastDownloadedAt: m.lastDownloadedAt,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      currentVersion: current
        ? {
            id: current._id,
            originalName: current.originalName,
            mimeType: current.mimeType,
            sizeBytes: current.sizeBytes,
            createdAt: current.createdAt,
          }
        : null,
      bookmarked: bookmarkedIds.has(String(m._id)),
      avgRating: Number(rating.avgRating.toFixed(2)),
      reviewCount: rating.reviewCount,
      highRated: rating.reviewCount > 0 && rating.avgRating >= 4,
    };
  });

  const sorted =
    sortBy === "rating_desc"
      ? [...withFlags].sort(
          (a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount,
        )
      : sortBy === "rating_asc"
        ? [...withFlags].sort(
            (a, b) =>
              a.avgRating - b.avgRating || b.reviewCount - a.reviewCount,
          )
        : withFlags;

  return res.json({ items: sorted });
};

const aiSearchMaterials = async (req, res) => {
  const prompt = String(req.body?.prompt || "").trim();
  if (!prompt) {
    return res.status(400).json({ message: "Prompt is required" });
  }

  const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    return res.json({
      prompt,
      interpreted: { moduleCode: "", semester: null, category: "" },
      totalFound: 0,
      results: [],
      gemini: { required: true, ok: false },
      message:
        "Gemini is required for AI search. Configure GEMINI_API_KEY in server/.env.",
    });
  }

  let geminiIntent = null;
  try {
    geminiIntent = await inferSearchIntentWithGemini(prompt);
  } catch {
    geminiIntent = null;
  }

  if (!geminiIntent) {
    const st = getGeminiDebugStatus ? getGeminiDebugStatus() : null;
    const retrySec = st?.disabledForMs
      ? Math.max(1, Math.ceil(st.disabledForMs / 1000))
      : null;

    const quotaHelp =
      "Gemini free-tier quota exceeded. Try a Flash model (set GEMINI_MODEL to gemini-2.5-flash if available, or gemini-2.0-flash / gemini-1.5-flash), or enable billing. Free-tier quotas often reset daily (UTC).";

    const extra =
      st?.lastDisableReason === "quota"
        ? st?.lastQuotaHint === "daily"
          ? " (free-tier quota)"
          : retrySec
            ? ` (rate limited — retry in ~${retrySec}s)`
            : " (rate limited)"
        : st?.lastDisableReason
          ? ` (${st.lastDisableReason})`
          : "";
    return res.json({
      prompt,
      interpreted: { moduleCode: "", semester: null, category: "" },
      totalFound: 0,
      results: [],
      gemini: { required: true, ok: false },
      message:
        st?.lastDisableReason === "quota"
          ? `${quotaHelp}${extra ? ` ${extra}` : ""}`
          : `Gemini is required for AI search, but it is currently unavailable${extra}.`,
    });
  }

  const parsed = {
    raw: prompt,
    lowered: prompt.toLowerCase(),
    searchText: geminiIntent.searchText || prompt,
    moduleCode: geminiIntent.moduleCode || "",
    semester:
      geminiIntent.semester !== null && geminiIntent.semester !== undefined
        ? geminiIntent.semester
        : null,
    category: geminiIntent.category || "",
  };

  const baseQuery = {};
  if (isAdmin(req)) {
    if (req.query.status) baseQuery.status = String(req.query.status).trim();
  } else {
    baseQuery.status = "published";
  }

  if (parsed.category) baseQuery.category = parsed.category;
  if (parsed.moduleCode)
    baseQuery.moduleCode = exactCaseInsensitive(parsed.moduleCode);
  if (Number.isFinite(parsed.semester)) baseQuery.semester = parsed.semester;

  const limit = 6;
  const useText = parsed.searchText.length >= 2;
  const keywordRegex = buildKeywordRegex(parsed.searchText);

  const combined = [];
  const seen = new Set();
  const pushResult = (m, matchedIn) => {
    const id = String(m?._id || "");
    if (!id || seen.has(id)) return;
    seen.add(id);

    const versions = Array.isArray(m.versions) ? m.versions : [];
    const current =
      versions.find((v) => String(v._id) === String(m.currentVersionId)) ||
      versions[0] ||
      null;

    combined.push({
      id: m._id,
      title: m.title,
      description: m.description,
      category: m.category,
      moduleCode: m.moduleCode,
      subject: m.subject,
      semester: m.semester,
      fileType: m.fileType,
      downloadCount: m.downloadCount || 0,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      matchedIn,
      currentVersion: current
        ? {
            id: current._id,
            originalName: current.originalName,
            mimeType: current.mimeType,
            sizeBytes: current.sizeBytes,
            createdAt: current.createdAt,
          }
        : null,
    });
  };

  const selectFields =
    "title description category moduleCode subject semester fileType currentVersionId versions downloadCount createdAt updatedAt";

  // Multi-pass strategy: start strict (use parsed filters), then relax.
  // This prevents bad intent parsing (e.g., user says "note") from hiding relevant items.
  const buildPasses = () => {
    const passes = [];

    const addPass = (q, label) => {
      const key = JSON.stringify(q, Object.keys(q).sort());
      if (passes.some((p) => p.key === key)) return;
      passes.push({ q, label, key });
    };

    addPass({ ...baseQuery }, "strict");

    if (baseQuery.category) {
      const { category, ...rest } = baseQuery;
      addPass({ ...rest }, "no_category");
    }

    if (baseQuery.moduleCode) {
      const { moduleCode, ...rest } = baseQuery;
      addPass({ ...rest }, "no_module");
    }

    if (baseQuery.semester !== undefined) {
      const { semester, ...rest } = baseQuery;
      addPass({ ...rest }, "no_semester");
    }

    // Last resort: only keep status (published) constraint.
    const minimal = isAdmin(req) ? {} : { status: "published" };
    addPass(minimal, "minimal");

    return passes;
  };

  const passes = buildPasses();

  for (const pass of passes) {
    if (combined.length >= limit) break;

    const textQuery = useText
      ? { ...pass.q, $text: { $search: parsed.searchText } }
      : { ...pass.q };

    let qy = StudyMaterial.find(textQuery).select(selectFields).limit(60);
    if (useText) {
      qy = qy.select({ score: { $meta: "textScore" } }).sort({
        score: { $meta: "textScore" },
        downloadCount: -1,
        createdAt: -1,
      });
    } else {
      qy = qy.sort({ downloadCount: -1, createdAt: -1 });
    }

    const docs = await qy.lean();
    for (const m of docs) {
      if (!isAdmin(req)) {
        if (!matchesAccess(req.user, m)) continue;
      }
      pushResult(m, "metadata");
      if (combined.length >= limit) break;
    }

    if (combined.length >= limit) break;

    // Fallback: match inside extracted document content.
    if (keywordRegex) {
      const contentQuery = {
        ...pass.q,
        extractedText: { $regex: keywordRegex },
      };

      const contentDocs = await StudyMaterial.find(contentQuery)
        .select(selectFields)
        .sort({ downloadCount: -1, createdAt: -1 })
        .limit(60)
        .lean();

      for (const m of contentDocs) {
        if (!isAdmin(req)) {
          if (!matchesAccess(req.user, m)) continue;
        }
        pushResult(m, "content");
        if (combined.length >= limit) break;
      }
    }
  }

  const interpreted = {
    moduleCode: parsed.moduleCode || "",
    semester: Number.isFinite(parsed.semester) ? parsed.semester : null,
    category: parsed.category || "",
  };

  const message =
    combined.length > 0
      ? `I found ${combined.length} relevant materials.`
      : "I couldn't find matching materials. Try different keywords (e.g. module code like SE3020).";

  return res.json({
    prompt,
    interpreted,
    totalFound: combined.length,
    results: combined,
    gemini: { required: true, ok: true },
    message,
  });
};

const adminDownloadsHistory = async (req, res) => {
  const limitRaw =
    req.query.limit !== undefined ? Number(req.query.limit) : 200;
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0
      ? Math.min(Math.floor(limitRaw), 500)
      : 200;

  const events = await StudyMaterialDownload.find({})
    .sort({ downloadedAt: -1 })
    .limit(limit)
    .populate("userId", "_id studentId name email")
    .populate("materialId", "_id title moduleCode semester")
    .lean();

  return res.json({
    items: events.map((e) => ({
      downloadedAt: e.downloadedAt,
      ip: e.ip,
      userAgent: e.userAgent,
      user: e.userId,
      material: e.materialId,
      versionId: e.versionId,
    })),
  });
};

const adminDeleteMaterial = async (req, res) => {
  const material = await StudyMaterial.findById(req.params.id);
  if (!material) return res.status(404).json({ message: "Not found" });

  // Best-effort file cleanup (ignore missing files)
  const versionPaths = Array.isArray(material.versions)
    ? material.versions.map((v) => v.filePath).filter(Boolean)
    : [];

  await StudyMaterial.deleteOne({ _id: material._id });
  await StudyMaterialBookmark.deleteMany({ materialId: material._id }).catch(
    () => {},
  );
  await StudyMaterialDownload.deleteMany({ materialId: material._id }).catch(
    () => {},
  );

  for (const p of versionPaths) {
    const abs = path.isAbsolute(p) ? p : path.join(__dirname, "..", p);
    try {
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    } catch {
      // ignore
    }
  }

  return res.json({ id: req.params.id, deleted: true });
};

const getMaterial = async (req, res) => {
  const material = await StudyMaterial.findById(req.params.id).lean();
  if (!material) return res.status(404).json({ message: "Not found" });

  if (!isAdmin(req)) {
    if (material.status !== "published")
      return res.status(404).json({ message: "Not found" });
    if (!matchesAccess(req.user, material))
      return res.status(403).json({ message: "Forbidden" });
  }

  const reviewSummary = await StudyMaterialReview.aggregate([
    {
      $match: {
        materialId: material._id,
        "moderation.status": { $ne: "removed" },
      },
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);
  const summary = reviewSummary[0] || { avgRating: 0, reviewCount: 0 };

  return res.json({
    material: {
      id: material._id,
      title: material.title,
      description: material.description,
      category: material.category,
      moduleCode: material.moduleCode,
      subject: material.subject,
      semester: material.semester,
      fileType: material.fileType,
      status: material.status,
      suggested: !!material.suggested,
      downloadCount: material.downloadCount || 0,
      lastDownloadedAt: material.lastDownloadedAt,
      versions: (material.versions || []).map((v) => ({
        id: v._id,
        originalName: v.originalName,
        mimeType: v.mimeType,
        sizeBytes: v.sizeBytes,
        note: v.note,
        createdAt: v.createdAt,
      })),
      currentVersionId: material.currentVersionId,
      access: material.access,
      moderation: material.moderation,
      avgRating: Number(Number(summary.avgRating || 0).toFixed(2)),
      reviewCount: Number(summary.reviewCount || 0),
      highRated:
        Number(summary.reviewCount || 0) > 0 &&
        Number(summary.avgRating || 0) >= 4,
      createdAt: material.createdAt,
      updatedAt: material.updatedAt,
    },
  });
};

const streamMaterialFile = async (req, res) => {
  ensureUploadDir();

  const material = await StudyMaterial.findById(req.params.id);
  if (!material) return res.status(404).json({ message: "Not found" });

  if (!isAdmin(req)) {
    if (material.status !== "published")
      return res.status(404).json({ message: "Not found" });
    if (!matchesAccess(req.user, material))
      return res.status(403).json({ message: "Forbidden" });
  }

  const disposition =
    String(req.query.disposition || "inline").toLowerCase() === "attachment"
      ? "attachment"
      : "inline";

  const versionId = req.query.versionId
    ? String(req.query.versionId)
    : String(material.currentVersionId || "");
  const version = (material.versions || []).find(
    (v) => String(v._id) === versionId,
  );
  if (!version) return res.status(404).json({ message: "File not found" });

  const filePath = version.filePath;
  const abs = path.isAbsolute(filePath)
    ? filePath
    : path.join(__dirname, "..", filePath);

  if (!fs.existsSync(abs))
    return res.status(404).json({ message: "File not found" });

  // Track downloads only for attachment mode
  if (disposition === "attachment") {
    await StudyMaterial.updateOne(
      { _id: material._id },
      { $inc: { downloadCount: 1 }, $set: { lastDownloadedAt: new Date() } },
    );

    await StudyMaterialDownload.create({
      userId: req.user._id,
      materialId: material._id,
      versionId: version._id,
      ip: req.ip,
      userAgent: String(req.headers["user-agent"] || "").slice(0, 500),
      downloadedAt: new Date(),
    }).catch(() => {});
  }

  const stat = fs.statSync(abs);
  const mime = version.mimeType || "application/octet-stream";

  res.setHeader("Content-Type", mime);
  res.setHeader(
    "Content-Disposition",
    `${disposition}; filename="${getSafeFileName(version.originalName)}"`,
  );
  res.setHeader("Accept-Ranges", "bytes");

  const range = req.headers.range;
  if (range) {
    const m = /bytes=(\d+)-(\d*)/.exec(range);
    if (m) {
      const start = Number(m[1]);
      const end = m[2] ? Number(m[2]) : stat.size - 1;
      if (start >= stat.size || end >= stat.size) {
        res.status(416);
        res.setHeader("Content-Range", `bytes */${stat.size}`);
        return res.end();
      }

      res.status(206);
      res.setHeader("Content-Range", `bytes ${start}-${end}/${stat.size}`);
      res.setHeader("Content-Length", String(end - start + 1));
      return fs.createReadStream(abs, { start, end }).pipe(res);
    }
  }

  res.setHeader("Content-Length", String(stat.size));
  return fs.createReadStream(abs).pipe(res);
};

const createSuggestion = async (req, res) => {
  ensureUploadDir();

  if (!req.file) {
    return res.status(400).json({ message: "file is required" });
  }

  const title = String(req.body.title || req.file.originalname).trim();
  if (!title) return res.status(400).json({ message: "title is required" });

  const semester =
    req.body.semester !== undefined && req.body.semester !== ""
      ? Number(req.body.semester)
      : null;
  const normalizedCategory =
    String(req.body.category || "notes").trim() || "notes";
  const allowedSemesters = normalizeNumberArray(req.body.allowedSemesters);

  const duplicate = await findDuplicateMaterial({
    title,
    moduleCode: req.body.moduleCode,
    semester,
    category: normalizedCategory,
    originalName: req.file.originalname,
  });
  const isDuplicate = !!duplicate;

  const material = await StudyMaterial.create({
    title,
    description: String(req.body.description || "").trim(),
    category: normalizedCategory,
    moduleCode: String(req.body.moduleCode || "").trim(),
    subject: String(req.body.subject || "").trim(),
    semester: Number.isFinite(semester) ? semester : null,
    fileType: String(req.body.fileType || "").trim(),

    status: isDuplicate ? "rejected" : "pending",
    suggested: String(req.body.suggested || "true") !== "false",
    uploadedBy: req.user._id,

    moderation: isDuplicate
      ? {
          reviewedBy: null,
          reviewedAt: new Date(),
          decisionReason:
            "Auto-rejected: same material appears to be already added.",
        }
      : undefined,

    access: {
      allowedSemesters,
      allowedModules: normalizeStringArray(req.body.allowedModules),
      allowedRoles: normalizeStringArray(req.body.allowedRoles),
    },

    versions: [
      {
        filePath: path.relative(path.join(__dirname, ".."), req.file.path),
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        note: "Initial upload",
        createdBy: req.user._id,
        createdAt: new Date(),
      },
    ],
  });

  material.currentVersionId = material.versions[0]._id;

  const extractedText = await extractTextFromUploadedFile(req.file);
  if (extractedText) {
    material.extractedText = extractedText;
    material.extractedAt = new Date();
    material.extractedFromVersionId = material.currentVersionId;
  }
  await material.save();

  return res.status(201).json({
    id: material._id,
    status: material.status,
    autoRejected: isDuplicate,
    message: isDuplicate
      ? "Material auto-rejected because a similar item already exists"
      : undefined,
  });
};

const toggleBookmark = async (req, res) => {
  const material = await StudyMaterial.findById(req.params.id).lean();
  if (!material) return res.status(404).json({ message: "Not found" });

  if (!isAdmin(req)) {
    if (material.status !== "published")
      return res.status(404).json({ message: "Not found" });
    if (!matchesAccess(req.user, material))
      return res.status(403).json({ message: "Forbidden" });
  }

  const existing = await StudyMaterialBookmark.findOne({
    userId: req.user._id,
    materialId: material._id,
  });

  if (existing) {
    await StudyMaterialBookmark.deleteOne({ _id: existing._id });
    return res.json({ bookmarked: false });
  }

  await StudyMaterialBookmark.create({
    userId: req.user._id,
    materialId: material._id,
  });
  return res.json({ bookmarked: true });
};

const listBookmarks = async (req, res) => {
  const bookmarks = await StudyMaterialBookmark.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .select("materialId createdAt")
    .lean();

  const materialIds = bookmarks.map((b) => b.materialId);
  const materials = await StudyMaterial.find({
    _id: { $in: materialIds },
    status: "published",
  }).lean();
  const map = new Map(materials.map((m) => [String(m._id), m]));

  const items = bookmarks
    .map((b) => {
      const m = map.get(String(b.materialId));
      if (!m) return null;
      if (!matchesAccess(req.user, m)) return null;
      const current = (m.versions || []).find(
        (v) => String(v._id) === String(m.currentVersionId),
      );
      return {
        id: m._id,
        title: m.title,
        moduleCode: m.moduleCode,
        semester: m.semester,
        category: m.category,
        fileType: m.fileType,
        downloadCount: m.downloadCount || 0,
        currentVersion: current
          ? {
              id: current._id,
              originalName: current.originalName,
              mimeType: current.mimeType,
              sizeBytes: current.sizeBytes,
            }
          : null,
        bookmarkedAt: b.createdAt,
      };
    })
    .filter(Boolean);

  return res.json({ items });
};

const listMyUploads = async (req, res) => {
  const statusRaw =
    req.query.status !== undefined ? String(req.query.status).trim() : "";
  const status = statusRaw ? statusRaw.toLowerCase() : "";

  const query = {
    uploadedBy: req.user._id,
    suggested: true,
  };

  if (status) {
    query.status = status;
  }

  const items = await StudyMaterial.find(query)
    .sort({ createdAt: -1 })
    .select(
      "title description category moduleCode subject semester fileType status suggested moderation currentVersionId versions createdAt updatedAt",
    )
    .lean();

  const mapped = items.map((m) => {
    const current = (m.versions || []).find(
      (v) => String(v._id) === String(m.currentVersionId),
    );

    return {
      id: m._id,
      title: m.title,
      description: m.description,
      category: m.category,
      moduleCode: m.moduleCode,
      subject: m.subject,
      semester: m.semester,
      fileType: m.fileType,
      status: m.status,
      suggested: !!m.suggested,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      moderation: m.moderation
        ? {
            reviewedAt: m.moderation.reviewedAt,
            decisionReason: m.moderation.decisionReason,
          }
        : null,
      currentVersion: current
        ? {
            id: current._id,
            originalName: current.originalName,
            mimeType: current.mimeType,
            sizeBytes: current.sizeBytes,
            createdAt: current.createdAt,
          }
        : null,
    };
  });

  return res.json({ items: mapped });
};

const listHistory = async (req, res) => {
  const events = await StudyMaterialDownload.find({ userId: req.user._id })
    .sort({ downloadedAt: -1 })
    .limit(100)
    .lean();

  const ids = Array.from(new Set(events.map((e) => String(e.materialId)))).map(
    (s) => s,
  );
  const materials = await StudyMaterial.find({ _id: { $in: ids } }).lean();
  const map = new Map(materials.map((m) => [String(m._id), m]));

  const items = events
    .map((e) => {
      const m = map.get(String(e.materialId));
      if (!m) return null;
      if (!isAdmin(req)) {
        if (m.status !== "published") return null;
        if (!matchesAccess(req.user, m)) return null;
      }
      const v = (m.versions || []).find(
        (vv) => String(vv._id) === String(e.versionId),
      );
      return {
        downloadedAt: e.downloadedAt,
        material: {
          id: m._id,
          title: m.title,
          moduleCode: m.moduleCode,
          semester: m.semester,
          fileType: m.fileType,
        },
        version: v
          ? {
              id: v._id,
              originalName: v.originalName,
              mimeType: v.mimeType,
              sizeBytes: v.sizeBytes,
            }
          : { id: e.versionId },
      };
    })
    .filter(Boolean);

  return res.json({ items });
};

// ---------------- Admin ----------------

const adminCreateMaterials = async (req, res) => {
  ensureUploadDir();

  const files = Array.isArray(req.files) ? req.files : [];
  if (!files.length)
    return res.status(400).json({ message: "files are required" });

  const created = [];
  const publishedTitles = [];
  for (const file of files) {
    const title = String(
      req.body.title || path.parse(file.originalname).name,
    ).trim();
    const semester =
      req.body.semester !== undefined && req.body.semester !== ""
        ? Number(req.body.semester)
        : null;
    const normalizedCategory =
      String(req.body.category || "notes").trim() || "notes";
    const requestedStatus = String(req.body.status || "published").trim();

    const duplicate = await findDuplicateMaterial({
      title,
      moduleCode: req.body.moduleCode,
      semester,
      category: normalizedCategory,
      originalName: file.originalname,
    });
    const isDuplicate = !!duplicate;

    const m = await StudyMaterial.create({
      title,
      description: String(req.body.description || "").trim(),
      category: normalizedCategory,
      moduleCode: String(req.body.moduleCode || "").trim(),
      subject: String(req.body.subject || "").trim(),
      semester: Number.isFinite(semester) ? semester : null,
      fileType: String(req.body.fileType || "").trim(),
      status: isDuplicate ? "rejected" : requestedStatus,
      suggested: false,
      uploadedBy: req.user._id,
      moderation: isDuplicate
        ? {
            reviewedBy: null,
            reviewedAt: new Date(),
            decisionReason:
              "Auto-rejected: same material appears to be already added.",
          }
        : undefined,
      access: {
        allowedSemesters: normalizeNumberArray(req.body.allowedSemesters),
        allowedModules: normalizeStringArray(req.body.allowedModules),
        allowedRoles: normalizeStringArray(req.body.allowedRoles),
      },
      versions: [
        {
          filePath: path.relative(path.join(__dirname, ".."), file.path),
          originalName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          note: "Initial upload",
          createdBy: req.user._id,
          createdAt: new Date(),
        },
      ],
    });

    m.currentVersionId = m.versions[0]._id;

    const extractedText = await extractTextFromUploadedFile(file);
    if (extractedText) {
      m.extractedText = extractedText;
      m.extractedAt = new Date();
      m.extractedFromVersionId = m.currentVersionId;
    }
    await m.save();
    created.push({ id: m._id, title: m.title, status: m.status });
    if (String(m.status).trim().toLowerCase() === "published") {
      publishedTitles.push(m.title);
    }
  }

  notifyStudentsAboutNewMaterials(publishedTitles);

  return res.status(201).json({ items: created });
};

const adminAddVersion = async (req, res) => {
  ensureUploadDir();
  if (!req.file) return res.status(400).json({ message: "file is required" });

  const material = await StudyMaterial.findById(req.params.id);
  if (!material) return res.status(404).json({ message: "Not found" });

  const note = String(req.body.note || "").trim();
  material.versions.push({
    filePath: path.relative(path.join(__dirname, ".."), req.file.path),
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    note,
    createdBy: req.user._id,
    createdAt: new Date(),
  });

  const newVersion = material.versions[material.versions.length - 1];
  material.currentVersionId = newVersion._id;

  const extractedText = await extractTextFromUploadedFile(req.file);
  if (extractedText) {
    material.extractedText = extractedText;
    material.extractedAt = new Date();
    material.extractedFromVersionId = material.currentVersionId;
  }
  await material.save();

  return res.status(201).json({
    materialId: material._id,
    currentVersionId: material.currentVersionId,
    version: {
      id: newVersion._id,
      originalName: newVersion.originalName,
      mimeType: newVersion.mimeType,
      sizeBytes: newVersion.sizeBytes,
      note: newVersion.note,
      createdAt: newVersion.createdAt,
    },
  });
};

const adminUpdateMaterial = async (req, res) => {
  const material = await StudyMaterial.findById(req.params.id);
  if (!material) return res.status(404).json({ message: "Not found" });
  const previousStatus = String(material.status || "")
    .trim()
    .toLowerCase();

  const patchString = (key, maxLen) => {
    if (req.body[key] === undefined) return;
    const v = String(req.body[key] ?? "").trim();
    material[key] = maxLen ? v.slice(0, maxLen) : v;
  };

  const patchEnum = (key, allowed) => {
    if (req.body[key] === undefined) return true;
    const v = String(req.body[key] ?? "").trim();
    if (!allowed.includes(v)) return false;
    material[key] = v;
    return true;
  };

  patchString("title", 200);
  patchString("description", 2000);
  patchString("moduleCode", 50);
  patchString("subject", 120);
  patchString("fileType", 30);

  if (req.body.semester !== undefined) {
    const raw = req.body.semester;
    if (raw === "" || raw === null) {
      material.semester = null;
    } else {
      const sem = Number(raw);
      if (!Number.isFinite(sem)) {
        return res.status(400).json({ message: "Invalid semester" });
      }
      material.semester = sem;
    }
  }

  const okCategory = patchEnum("category", [
    "notes",
    "tutes",
    "papers",
    "links",
    "other",
  ]);
  if (!okCategory) return res.status(400).json({ message: "Invalid category" });

  const okStatus = patchEnum("status", [
    "published",
    "draft",
    "archived",
    "pending",
    "rejected",
  ]);
  if (!okStatus) return res.status(400).json({ message: "Invalid status" });

  await material.save();

  if (
    previousStatus !== "published" &&
    String(material.status || "")
      .trim()
      .toLowerCase() === "published"
  ) {
    notifyStudentsAboutNewMaterials([material.title]);
  }

  return res.json({
    id: material._id,
    title: material.title,
    description: material.description,
    category: material.category,
    moduleCode: material.moduleCode,
    subject: material.subject,
    semester: material.semester,
    status: material.status,
    updatedAt: material.updatedAt,
  });
};

const adminQueueList = async (req, res) => {
  const status = String(req.query.status || "pending").trim();
  const items = await StudyMaterial.find({ status })
    .sort({ createdAt: -1 })
    .select(
      "title description moduleCode subject semester status suggested uploadedBy versions currentVersionId createdAt",
    )
    .populate("uploadedBy", "_id studentId name email")
    .lean();

  const mapped = items.map((m) => {
    const current = (m.versions || []).find(
      (v) => String(v._id) === String(m.currentVersionId),
    );
    return {
      id: m._id,
      title: m.title,
      description: m.description,
      moduleCode: m.moduleCode,
      subject: m.subject,
      semester: m.semester,
      status: m.status,
      suggested: !!m.suggested,
      uploadedBy: m.uploadedBy,
      createdAt: m.createdAt,
      currentVersion: current
        ? {
            id: current._id,
            originalName: current.originalName,
            mimeType: current.mimeType,
            sizeBytes: current.sizeBytes,
          }
        : null,
    };
  });

  return res.json({ items: mapped });
};

const adminApprove = async (req, res) => {
  const material = await StudyMaterial.findById(req.params.id);
  if (!material) return res.status(404).json({ message: "Not found" });
  if (material.status !== "pending")
    return res.status(400).json({ message: "Not in pending state" });

  material.status = "published";
  material.moderation.reviewedBy = req.user._id;
  material.moderation.reviewedAt = new Date();
  material.moderation.decisionReason = String(req.body.reason || "").trim();
  await material.save();

  notifyStudentsAboutNewMaterials([material.title]);

  return res.json({ id: material._id, status: material.status });
};

const adminReject = async (req, res) => {
  const reason = String(req.body.reason || "").trim();
  if (!reason) return res.status(400).json({ message: "reason is required" });

  const material = await StudyMaterial.findById(req.params.id);
  if (!material) return res.status(404).json({ message: "Not found" });
  if (material.status !== "pending")
    return res.status(400).json({ message: "Not in pending state" });

  material.status = "rejected";
  material.moderation.reviewedBy = req.user._id;
  material.moderation.reviewedAt = new Date();
  material.moderation.decisionReason = reason;
  await material.save();

  return res.json({ id: material._id, status: material.status });
};

const adminAnalytics = async (req, res) => {
  const pendingModerationCount = await StudyMaterial.countDocuments({
    status: "pending",
  });

  const topMaterials = await StudyMaterial.find({ status: "published" })
    .sort({ downloadCount: -1 })
    .limit(10)
    .select("title moduleCode semester downloadCount")
    .lean();

  const byModule = await StudyMaterial.aggregate([
    { $match: { status: "published" } },
    {
      $group: {
        _id: "$moduleCode",
        downloads: { $sum: "$downloadCount" },
        materials: { $sum: 1 },
      },
    },
    { $sort: { downloads: -1 } },
    { $limit: 10 },
  ]);

  const recentDownloads = await StudyMaterialDownload.find({})
    .sort({ downloadedAt: -1 })
    .limit(20)
    .populate("userId", "_id studentId name email")
    .populate("materialId", "_id title moduleCode")
    .lean();

  const reviewStats = await StudyMaterialReview.aggregate([
    { $match: { "moderation.status": { $ne: "removed" } } },
    {
      $group: {
        _id: "$materialId",
        avgRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
    { $sort: { avgRating: -1, reviewCount: -1 } },
    { $limit: 10 },
  ]);
  const ratedMaterialIds = reviewStats.map((r) => r._id);
  const ratedMaterials = await StudyMaterial.find({
    _id: { $in: ratedMaterialIds },
  })
    .select("title moduleCode")
    .lean();
  const ratedMaterialMap = new Map(
    ratedMaterials.map((m) => [String(m._id), m]),
  );

  const reviewTrends = await StudyMaterialReview.aggregate([
    { $match: { "moderation.status": { $ne: "removed" } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  return res.json({
    moderationQueuePendingCount: pendingModerationCount,
    topMaterials,
    popularModules: byModule.map((m) => ({
      moduleCode: m._id || "(none)",
      downloads: m.downloads,
      materials: m.materials,
    })),
    recentDownloads: recentDownloads.map((d) => ({
      downloadedAt: d.downloadedAt,
      user: d.userId,
      material: d.materialId,
    })),
    reviewInsights: {
      topRated: reviewStats.map((s) => {
        const material = ratedMaterialMap.get(String(s._id));
        return {
          materialId: s._id,
          title: material?.title || "Unknown",
          moduleCode: material?.moduleCode || "",
          avgRating: Number(Number(s.avgRating || 0).toFixed(2)),
          reviewCount: Number(s.reviewCount || 0),
        };
      }),
      trends: reviewTrends.map((t) => ({
        year: t._id.year,
        month: t._id.month,
        avgRating: Number(Number(t.avgRating || 0).toFixed(2)),
        reviewCount: Number(t.count || 0),
      })),
    },
  });
};

module.exports = {
  listMaterials,
  aiSearchMaterials,
  getMaterial,
  streamMaterialFile,
  scanSuggestionAutofill,
  createSuggestion,
  toggleBookmark,
  listBookmarks,
  listHistory,
  listMyUploads,
  adminCreateMaterials,
  adminAddVersion,
  adminUpdateMaterial,
  adminDeleteMaterial,
  adminQueueList,
  adminApprove,
  adminReject,
  adminAnalytics,
  adminDownloadsHistory,
};
