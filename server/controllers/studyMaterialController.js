const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const StudyMaterial = require("../models/StudyMaterial");
const StudyMaterialDownload = require("../models/StudyMaterialDownload");
const StudyMaterialBookmark = require("../models/StudyMaterialBookmark");
const StudyMaterialReview = require("../models/StudyMaterialReview");
const User = require("../models/User");
const { sendBulkEmail } = require("../utils/email");

const UPLOAD_ROOT = path.join(__dirname, "..", "uploads", "study-materials");

const MAX_PDF_EXTRACT_BYTES = 15 * 1024 * 1024; // 15MB
const MAX_EXTRACTED_TEXT_CHARS = 20000;

const SUGGESTION_SCAN_MAX_TEXT_CHARS = 25000;
const SUGGESTION_SEMESTER_OPTIONS = [
  "",
  "1.1",
  "1.2",
  "2.1",
  "2.2",
  "3.1",
  "3.2",
  "4.1",
  "4.2",
];
const SUGGESTION_CATEGORY_OPTIONS = [
  "notes",
  "tutes",
  "papers",
  "links",
  "other",
];

const getGenAI = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set in environment");
  return new GoogleGenerativeAI(key);
};

const stripJsonFences = (text) => {
  const s = String(text || "").trim();
  if (!s) return "";
  // Remove ```json ... ``` fences if present
  const fenced = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```\s*$/i);
  if (fenced) return String(fenced[1] || "").trim();
  return s;
};

const clampString = (value, maxLen) => {
  const s = String(value || "").trim();
  if (!s) return "";
  return s.length > maxLen ? s.slice(0, maxLen) : s;
};

const normalizeModuleCode = (value) => {
  const s = String(value || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .trim();
  const m = s.match(/\b[A-Z]{2,4}\d{3,4}\b/);
  return m ? m[0] : "";
};

const normalizeSemester = (value) => {
  const s = String(value ?? "").trim();
  if (SUGGESTION_SEMESTER_OPTIONS.includes(s)) return s;
  // Some models may respond with 1/2/3/4; treat as unknown to avoid wrong autofill.
  return "";
};

const normalizeCategory = (value) => {
  const s = String(value || "")
    .trim()
    .toLowerCase();
  if (SUGGESTION_CATEGORY_OPTIONS.includes(s)) return s;
  return "";
};

const guessCategoryFromText = (text) => {
  const t = String(text || "").toLowerCase();
  if (/\b(past\s*paper|past\s*papers|exam|final|mid)\b/.test(t))
    return "papers";
  if (/\b(tute|tutorial|worksheet)\b/.test(t)) return "tutes";
  if (/\b(link|url|website|resource)\b/.test(t)) return "links";
  if (/\b(lecture\s*note|lecture\s*notes|notes)\b/.test(t)) return "notes";
  return "";
};

const inferTitleFromFilename = (filename) => {
  const base = String(filename || "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return clampString(base, 120);
};

const safeJsonParse = (raw) => {
  const cleaned = stripJsonFences(raw);
  if (!cleaned) return null;
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to recover a JSON object substring
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
};

const parsePdfTextFromBuffer = async (buf) => {
  const parser = new PDFParse({ data: buf });
  try {
    const parsed = await parser.getText({
      first: 5,
      lineEnforce: false,
      pageJoiner: "\n",
      itemJoiner: " ",
    });
    return String(parsed?.text || "");
  } finally {
    try {
      await parser.destroy();
    } catch {
      // best-effort
    }
  }
};

const parsePdfTextFromUploadedBuffer = async (buf) => {
  try {
    if (!Buffer.isBuffer(buf) || buf.length === 0) return "";
    if (buf.length > MAX_PDF_EXTRACT_BYTES) return "";
    const rawText = await parsePdfTextFromBuffer(buf);
    return String(rawText || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, SUGGESTION_SCAN_MAX_TEXT_CHARS);
  } catch {
    return "";
  }
};

// Simple delay helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callGeminiWithRetry = async (model, request, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(request);
      const response = result?.response;
      const text =
        typeof response?.text === "function" ? response.text() : response?.text;
      return String(text || "");
    } catch (err) {
      const msg = String(err?.message || "");
      const isRetryable =
        msg.includes("429") ||
        msg.includes("503") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("retry") ||
        msg.includes("RetryInfo") ||
        msg.includes("overloaded") ||
        msg.includes("quota");

      if (isRetryable && attempt < maxRetries) {
        const delayMs = attempt * 2000;
        await sleep(delayMs);
        continue;
      }
      throw err;
    }
  }
};

const extractModuleCodesFromText = (text) => {
  const upper = String(text || "").toUpperCase();
  const out = new Set();

  const contiguous = upper.match(/\b[A-Z]{2,4}\d{3,4}\b/g) || [];
  for (const m of contiguous) out.add(String(m).trim());

  // Handle common PDF text extraction artifacts where module codes are split by spaces:
  // - IT30 30 -> IT3030
  // - IT 3 0 3 0 -> IT3030
  const spaced4 = upper.match(/\b[A-Z]{2,4}(?:\s*\d){4}\b/g) || [];
  for (const raw of spaced4) {
    const normalized = raw.replace(/\s+/g, "").trim();
    if (/^[A-Z]{2,4}\d{4}$/.test(normalized)) out.add(normalized);
  }
  const spaced3 = upper.match(/\b[A-Z]{2,4}(?:\s*\d){3}\b/g) || [];
  for (const raw of spaced3) {
    const normalized = raw.replace(/\s+/g, "").trim();
    if (/^[A-Z]{2,4}\d{3}$/.test(normalized)) out.add(normalized);
  }

  return Array.from(out).filter(Boolean);
};

const tryExtractPdfText = async (absolutePath, sizeBytes) => {
  try {
    if (!absolutePath) return { text: "", moduleCodes: [] };
    const ext = String(path.extname(absolutePath) || "").toLowerCase();
    if (ext !== ".pdf") return { text: "", moduleCodes: [] };

    const knownSize = Number.isFinite(sizeBytes) ? sizeBytes : null;
    if (knownSize !== null && knownSize > MAX_PDF_EXTRACT_BYTES) {
      return { text: "", moduleCodes: [] };
    }

    const buf = await fs.promises.readFile(absolutePath);
    if (buf.length > MAX_PDF_EXTRACT_BYTES)
      return { text: "", moduleCodes: [] };

    const rawText = await parsePdfTextFromBuffer(buf);
    const text = String(rawText || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_EXTRACTED_TEXT_CHARS);
    const moduleCodes = extractModuleCodesFromText(text);
    return { text, moduleCodes };
  } catch {
    return { text: "", moduleCodes: [] };
  }
};

const updateExtractedSearchForMaterial = async ({ material, version }) => {
  try {
    if (!material || !version?.filePath) return;
    const absolutePath = path.join(__dirname, "..", String(version.filePath));

    const { text, moduleCodes } = await tryExtractPdfText(
      absolutePath,
      version.sizeBytes,
    );

    if (!text && (!moduleCodes || moduleCodes.length === 0)) return;

    const existingCodes = Array.isArray(material.extractedModuleCodes)
      ? material.extractedModuleCodes
          .map((c) => String(c).trim().toUpperCase())
          .filter(Boolean)
      : [];

    const mergedCodes = Array.from(
      new Set([...existingCodes, ...(moduleCodes || [])]),
    );
    material.extractedModuleCodes = mergedCodes;

    if (text) {
      const current = String(material.extractedText || "").trim();
      material.extractedText = (current ? `${current}\n` : "")
        .concat(text)
        .slice(0, MAX_EXTRACTED_TEXT_CHARS);
    }
  } catch {
    // best-effort
  }
};

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

  await updateExtractedSearchForMaterial({
    material,
    version: material.versions[0],
  });

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

const scanSuggestionDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "file is required" });
    }

    const mimeType = String(req.file.mimetype || "application/octet-stream");
    const originalName = String(req.file.originalname || "");
    const filenameTitle = inferTitleFromFilename(originalName);

    const isPdf =
      mimeType === "application/pdf" ||
      String(path.extname(originalName) || "").toLowerCase() === ".pdf";
    const isImage =
      mimeType === "image/png" ||
      mimeType === "image/jpeg" ||
      mimeType === "image/webp";

    if (!isPdf && !isImage) {
      return res.status(400).json({
        message:
          "Unsupported file type for scanning. Please upload a PDF or an image (PNG/JPG/WebP).",
      });
    }

    let extractedText = "";
    let moduleCodes = [];

    if (isPdf) {
      extractedText = await parsePdfTextFromUploadedBuffer(req.file.buffer);
      moduleCodes = extractModuleCodesFromText(extractedText);
    }

    const genAI = getGenAI();
    // Default to the same family already used elsewhere in this repo.
    const preferredModel = String(
      process.env.GEMINI_SUGGESTION_SCAN_MODEL || "",
    ).trim();
    const modelName = preferredModel || "gemini-flash-latest";
    const model = genAI.getGenerativeModel({ model: modelName });

    const system = `You are a document metadata extractor for a university study-material upload form.
Return ONLY valid JSON (no markdown, no code fences).

Schema:
{
  "title": string,
  "moduleCode": string,
  "subject": string,
  "semester": string,
  "category": string,
  "description": string
}

Rules:
- title: short, human-friendly, <= 120 chars. If uncertain, derive from filename.
- moduleCode: uppercase like IT3030 or SE3020. Empty string if unknown.
- subject: optional course/subject name (e.g., "Network Design and Management"). Empty string if unknown.
- semester: must be exactly one of: ${JSON.stringify(SUGGESTION_SEMESTER_OPTIONS.filter((x) => x))} or "".
- category: must be exactly one of: ${JSON.stringify(SUGGESTION_CATEGORY_OPTIONS)}.
- description: a short SUMMARY of the document content (1–2 sentences), <= 300 chars.
  Mention the main topics/chapters and any obvious keywords (e.g., "OOP", "SQL", "Networking") only if present.
  If you cannot infer content, return an empty string.
- Do not invent facts; prefer empty strings.
`;

    const userPrompt = `Filename: ${originalName || "(unknown)"}
Detected mimeType: ${mimeType}
If you see a module code, prefer it.
If a category is implied (lecture notes/tutorial/past papers/links), map it to category.

Heuristics:
- If it's lecture notes => notes
- If it's tutorial/tute => tutes
- If it's past paper/exam => papers
- If it's mostly URLs => links

Known module codes found (may be empty): ${JSON.stringify(moduleCodes || [])}

PDF extracted text (may be empty):
${extractedText || ""}
`;

    const parts = [{ text: `${system}\n\n${userPrompt}` }];
    if (isImage) {
      parts.push({
        inlineData: {
          data: Buffer.from(req.file.buffer).toString("base64"),
          mimeType,
        },
      });
    }

    const raw = await callGeminiWithRetry(
      model,
      {
        contents: [{ role: "user", parts }],
        // Keep config minimal for compatibility across SDK versions.
        generationConfig: { temperature: 0.2 },
      },
      3,
    );
    const parsed = safeJsonParse(raw);
    if (!parsed || typeof parsed !== "object") {
      return res.status(502).json({
        message: "AI scan returned an invalid response",
      });
    }

    const normalized = {
      title: clampString(parsed.title || "", 120) || filenameTitle,
      moduleCode:
        normalizeModuleCode(parsed.moduleCode) ||
        (Array.isArray(moduleCodes) && moduleCodes.length
          ? moduleCodes[0]
          : ""),
      subject: clampString(parsed.subject || "", 120),
      semester: normalizeSemester(parsed.semester),
      category:
        normalizeCategory(parsed.category) ||
        guessCategoryFromText(
          `${parsed.title || ""} ${parsed.description || ""} ${extractedText || ""}`,
        ) ||
        "notes",
      description: clampString(parsed.description || "", 450),
    };

    return res.json(normalized);
  } catch (e) {
    const msg = String(e?.message || "AI scan failed");
    const lower = msg.toLowerCase();

    if (lower.includes("gemini_api_key") || lower.includes("api key")) {
      return res.status(500).json({ message: msg });
    }
    if (
      lower.includes("429") ||
      lower.includes("resource_exhausted") ||
      lower.includes("quota")
    ) {
      return res
        .status(429)
        .json({
          message: "AI scan is rate-limited. Please try again in a moment.",
        });
    }
    if (
      lower.includes("model") &&
      lower.includes("not") &&
      lower.includes("found")
    ) {
      return res
        .status(502)
        .json({
          message:
            "AI model is not available. Check GEMINI_SUGGESTION_SCAN_MODEL.",
        });
    }

    return res.status(500).json({ message: msg });
  }
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

  const parseSuggested = (raw) => {
    if (raw === undefined || raw === null || raw === "") return false;
    const v = String(raw).trim().toLowerCase();
    return v === "true" || v === "1" || v === "yes" || v === "on";
  };

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
    const suggested = parseSuggested(req.body.suggested);

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
      suggested,
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

    await updateExtractedSearchForMaterial({
      material: m,
      version: m.versions[0],
    });

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

  await updateExtractedSearchForMaterial({ material, version: newVersion });

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
  getMaterial,
  streamMaterialFile,
  createSuggestion,
  scanSuggestionDocument,
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
