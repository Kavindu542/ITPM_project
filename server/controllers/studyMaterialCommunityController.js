const path = require("path");
const mongoose = require("mongoose");

const User = require("../models/User");
const StudyMaterial = require("../models/StudyMaterial");
const StudyMaterialRequest = require("../models/StudyMaterialRequest");
const StudyMaterialReview = require("../models/StudyMaterialReview");
const StudyMaterialForumCategory = require("../models/StudyMaterialForumCategory");
const StudyMaterialForumThread = require("../models/StudyMaterialForumThread");
const StudyMaterialForumBan = require("../models/StudyMaterialForumBan");
const { sendBulkEmail } = require("../utils/email");
const pdfParse = require("pdf-parse");

const isAdmin = (req) => req.auth?.module === "study-material";

const normalizeFsPath = (value) => String(value || "").replace(/\\/g, "/");

const safeAttachmentName = (name) =>
  String(name || "file")
    .replace(/\r|\n/g, " ")
    .replace(/"/g, "'")
    .slice(0, 200);

const resolveUploadedFilePath = (relativePath) => {
  const root = path.resolve(path.join(__dirname, ".."));
  const uploadsRoot = path.resolve(path.join(root, "uploads"));
  const abs = path.resolve(path.join(root, String(relativePath || "")));

  if (!abs.startsWith(uploadsRoot + path.sep) && abs !== uploadsRoot) {
    return null;
  }

  return abs;
};

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 100);

const normalizeDemandKey = ({ title, description, moduleCode, courseCode }) => {
  const textKey = slugify(title || description || "material").slice(0, 80);
  const moduleKey = slugify(moduleCode || "");
  const courseKey = slugify(courseCode || "");
  return [textKey, moduleKey, courseKey].filter(Boolean).join("|");
};

const mapRequest = (item, userId, demandCountMap = new Map()) => {
  const upvotes = Array.isArray(item.upvotes) ? item.upvotes : [];
  const demandCount = Number(
    demandCountMap.get(String(item.normalizedKey || "")) || 1,
  );
  const upvoteCount = upvotes.length;

  return {
    id: item._id,
    title: item.title,
    description: item.description,
    moduleCode: item.moduleCode,
    courseCode: item.courseCode,
    syllabusLink: item.syllabusLink,
    status: item.status,
    feedback: item.feedback,
    requester: item.requester,
    fulfilledMaterialId: item.fulfilledMaterialId,
    fulfilledBy: item.fulfilledBy,
    fulfilledAt: item.fulfilledAt,
    rejectedBy: item.rejectedBy,
    rejectedAt: item.rejectedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    demandCount,
    upvoteCount,
    highDemand: demandCount >= 3 || upvoteCount >= 5,
    upvoted: upvotes.some((id) => String(id) === String(userId)),
    isRequester:
      String(item.requester?._id || item.requester) === String(userId),
  };
};

const notifyUsers = async ({ userIds = [], subject, text, html }) => {
  const ids = Array.from(
    new Set(userIds.map((id) => String(id || "")).filter(Boolean)),
  );
  if (!ids.length) return;

  const users = await User.find({ _id: { $in: ids } })
    .select("email")
    .lean();
  const bcc = users
    .map((u) =>
      String(u?.email || "")
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean);
  if (!bcc.length) return;

  await sendBulkEmail({ subject, text, html, bcc, chunkSize: 50 }).catch(
    () => {},
  );
};

const resolveUserIdFromIdentifier = async (identifierRaw) => {
  const identifier = String(identifierRaw || "").trim();
  if (!identifier) return null;

  const escapedIdentifier = identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    const byId = await User.findById(identifier).select("_id").lean();
    if (byId?._id) return byId._id;
  }

  const byStudentId = await User.findOne({
    studentId: new RegExp(`^${escapedIdentifier}$`, "i"),
  })
    .select("_id")
    .lean();
  if (byStudentId?._id) return byStudentId._id;

  const byEmail = await User.findOne({
    email: String(identifier).trim().toLowerCase(),
  })
    .select("_id")
    .lean();
  if (byEmail?._id) return byEmail._id;

  return null;
};

const listRequests = async (req, res) => {
  const status = String(req.query.status || "")
    .trim()
    .toLowerCase();
  const mine =
    String(req.query.mine || "")
      .trim()
      .toLowerCase() === "true";

  const query = {};
  if (status) query.status = status;
  if (!isAdmin(req) || mine) query.requester = req.user._id;

  const rows = await StudyMaterialRequest.find(query)
    .sort({ createdAt: -1 })
    .populate("requester", "_id studentId name email")
    .populate("fulfilledMaterialId", "_id title moduleCode semester")
    .populate("fulfilledBy", "_id name email")
    .populate("rejectedBy", "_id name email")
    .lean();

  const keys = Array.from(
    new Set(rows.map((r) => String(r.normalizedKey || "")).filter(Boolean)),
  );
  const counts = keys.length
    ? await StudyMaterialRequest.aggregate([
        {
          $match: {
            normalizedKey: { $in: keys },
            status: { $in: ["pending", "in-progress"] },
          },
        },
        { $group: { _id: "$normalizedKey", count: { $sum: 1 } } },
      ])
    : [];
  const demandCountMap = new Map(
    counts.map((c) => [String(c._id), Number(c.count || 0)]),
  );

  return res.json({
    items: rows.map((r) => mapRequest(r, req.user._id, demandCountMap)),
  });
};

const createRequest = async (req, res) => {
  const title = String(req.body.title || "").trim();
  const description = String(req.body.description || "").trim();
  if (!title || !description) {
    return res
      .status(400)
      .json({ message: "title and description are required" });
  }

  const payload = {
    title,
    description,
    moduleCode: String(req.body.moduleCode || "").trim(),
    courseCode: String(req.body.courseCode || "").trim(),
    syllabusLink: String(req.body.syllabusLink || "").trim(),
    requester: req.user._id,
  };
  payload.normalizedKey = normalizeDemandKey(payload);

  const created = await StudyMaterialRequest.create(payload);
  const populated = await StudyMaterialRequest.findById(created._id)
    .populate("requester", "_id studentId name email")
    .lean();

  return res
    .status(201)
    .json({ item: mapRequest(populated, req.user._id, new Map()) });
};

const toggleRequestUpvote = async (req, res) => {
  const item = await StudyMaterialRequest.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Not found" });

  const myId = String(req.user._id);
  if (String(item.requester) === myId) {
    return res
      .status(400)
      .json({ message: "You cannot upvote your own request" });
  }

  const had = item.upvotes.some((id) => String(id) === myId);
  if (had) {
    item.upvotes = item.upvotes.filter((id) => String(id) !== myId);
  } else {
    item.upvotes.push(req.user._id);
  }
  await item.save();

  return res.json({ upvoted: !had, upvoteCount: item.upvotes.length });
};

const adminMarkRequestInProgress = async (req, res) => {
  const item = await StudyMaterialRequest.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Not found" });
  if (item.status === "in-progress") {
    return res.json({ id: item._id, status: item.status });
  }
  if (item.status === "completed") {
    return res.status(409).json({ message: "Request is already completed" });
  }
  if (item.status === "rejected") {
    return res.status(409).json({ message: "Request is already rejected" });
  }
  if (item.status !== "pending") {
    return res.status(409).json({ message: "Request is not pending" });
  }

  item.status = "in-progress";
  await item.save();

  return res.json({ id: item._id, status: item.status });
};

const adminFulfillRequest = async (req, res) => {
  const item = await StudyMaterialRequest.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Not found" });
  if (item.status === "completed") {
    return res.json({
      id: item._id,
      status: item.status,
      fulfilledMaterialId: item.fulfilledMaterialId || null,
    });
  }
  if (item.status === "rejected") {
    return res
      .status(409)
      .json({ message: "Rejected requests cannot be fulfilled" });
  }
  if (!["pending", "in-progress"].includes(item.status)) {
    return res.status(409).json({ message: "Request is not open" });
  }
  if (!req.file) return res.status(400).json({ message: "file is required" });

  const title = String(
    req.body.title || item.title || req.file.originalname,
  ).trim();
  const description = String(
    req.body.description || item.description || "",
  ).trim();
  const semester =
    req.body.semester !== undefined && req.body.semester !== ""
      ? Number(req.body.semester)
      : null;

  const material = await StudyMaterial.create({
    title,
    description,
    category: String(req.body.category || "notes").trim() || "notes",
    moduleCode: String(req.body.moduleCode || item.moduleCode || "").trim(),
    subject: String(req.body.subject || "").trim(),
    semester: Number.isFinite(semester) ? semester : null,
    fileType: String(req.body.fileType || "").trim(),
    status: "published",
    suggested: false,
    uploadedBy: req.user._id,
    versions: [
      {
        filePath: path.relative(path.join(__dirname, ".."), req.file.path),
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        note: "Uploaded to fulfill missing resource request",
        createdBy: req.user._id,
        createdAt: new Date(),
      },
    ],
  });
  material.currentVersionId = material.versions[0]._id;
  await material.save();

  item.status = "completed";
  item.fulfilledMaterialId = material._id;
  item.fulfilledBy = req.user._id;
  item.fulfilledAt = new Date();
  item.feedback = String(
    req.body.feedback || "Completed: requested material uploaded.",
  ).trim();
  await item.save();

  const notifiedUserIds = [
    item.requester,
    ...(Array.isArray(item.upvotes) ? item.upvotes : []),
  ];
  const appName = process.env.APP_NAME || "CampusCore";
  await notifyUsers({
    userIds: notifiedUserIds,
    subject: `${appName} - Missing resource request completed`,
    text: `Your requested resource "${item.title}" is now available in Study Materials.`,
    html: `<p>Your requested resource <strong>${item.title}</strong> is now available in Study Materials.</p>`,
  });

  return res.json({
    id: item._id,
    status: item.status,
    fulfilledMaterialId: material._id,
  });
};

const adminRejectRequest = async (req, res) => {
  const reason = String(req.body.reason || "").trim();
  if (!reason) return res.status(400).json({ message: "reason is required" });

  const item = await StudyMaterialRequest.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Not found" });
  if (!["pending", "in-progress"].includes(item.status)) {
    return res.status(400).json({ message: "Request is not open" });
  }

  item.status = "rejected";
  item.feedback = reason;
  item.rejectedBy = req.user._id;
  item.rejectedAt = new Date();
  await item.save();

  const notifiedUserIds = [
    item.requester,
    ...(Array.isArray(item.upvotes) ? item.upvotes : []),
  ];
  const appName = process.env.APP_NAME || "CampusCore";
  await notifyUsers({
    userIds: notifiedUserIds,
    subject: `${appName} - Missing resource request update`,
    text: `Request "${item.title}" was rejected. Reason: ${reason}`,
    html: `<p>Request <strong>${item.title}</strong> was rejected.</p><p>Reason: ${reason}</p>`,
  });

  return res.json({
    id: item._id,
    status: item.status,
    feedback: item.feedback,
  });
};

const createOrUpdateReview = async (req, res) => {
  const rating = Number(req.body.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "rating must be 1-5" });
  }

  const material = await StudyMaterial.findById(req.params.materialId)
    .select("_id status")
    .lean();
  if (!material || material.status !== "published") {
    return res.status(404).json({ message: "Material not found" });
  }

  const reviewText = String(req.body.reviewText || "").trim();
  const review = await StudyMaterialReview.findOneAndUpdate(
    { materialId: material._id, userId: req.user._id },
    {
      $set: {
        rating,
        reviewText,
        "moderation.status": "visible",
        "moderation.reason": "",
        "moderation.moderatedBy": null,
        "moderation.moderatedAt": null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .populate("userId", "_id studentId name")
    .lean();

  return res.status(201).json({ item: review });
};

const listMaterialReviews = async (req, res) => {
  const material = await StudyMaterial.findById(req.params.materialId)
    .select("_id")
    .lean();
  if (!material) return res.status(404).json({ message: "Material not found" });

  const sortBy = String(req.query.sortBy || "recent")
    .trim()
    .toLowerCase();
  const sort =
    sortBy === "highest"
      ? { rating: -1, createdAt: -1 }
      : sortBy === "lowest"
        ? { rating: 1, createdAt: -1 }
        : { createdAt: -1 };

  const includeRemoved =
    isAdmin(req) &&
    String(req.query.includeRemoved || "")
      .trim()
      .toLowerCase() === "true";
  const query = { materialId: material._id };
  if (!includeRemoved) query["moderation.status"] = { $ne: "removed" };

  const rows = await StudyMaterialReview.find(query)
    .sort(sort)
    .populate("userId", "_id studentId name")
    .populate("adminResponse.respondedBy", "_id name")
    .lean();

  const myId = String(req.user._id);
  return res.json({
    items: rows.map((r) => ({
      id: r._id,
      materialId: r.materialId,
      user: r.userId,
      rating: r.rating,
      reviewText: r.reviewText,
      helpfulCount: (r.helpfulVotes || []).length,
      unhelpfulCount: (r.unhelpfulVotes || []).length,
      myHelpfulVote: (r.helpfulVotes || []).some((id) => String(id) === myId),
      myUnhelpfulVote: (r.unhelpfulVotes || []).some(
        (id) => String(id) === myId,
      ),
      moderation: r.moderation,
      adminResponse: r.adminResponse,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      isMine: String(r.userId?._id || r.userId) === myId,
    })),
  });
};

const voteReview = async (req, res) => {
  const vote = String(req.body.vote || "")
    .trim()
    .toLowerCase();
  if (!["helpful", "unhelpful"].includes(vote)) {
    return res
      .status(400)
      .json({ message: "vote must be helpful or unhelpful" });
  }

  const review = await StudyMaterialReview.findById(req.params.reviewId);
  if (!review) return res.status(404).json({ message: "Not found" });

  const myId = String(req.user._id);
  review.helpfulVotes = (review.helpfulVotes || []).filter(
    (id) => String(id) !== myId,
  );
  review.unhelpfulVotes = (review.unhelpfulVotes || []).filter(
    (id) => String(id) !== myId,
  );
  if (vote === "helpful") review.helpfulVotes.push(req.user._id);
  if (vote === "unhelpful") review.unhelpfulVotes.push(req.user._id);
  await review.save();

  return res.json({
    helpfulCount: review.helpfulVotes.length,
    unhelpfulCount: review.unhelpfulVotes.length,
    myHelpfulVote: vote === "helpful",
    myUnhelpfulVote: vote === "unhelpful",
  });
};

const updateOwnReview = async (req, res) => {
  const review = await StudyMaterialReview.findById(req.params.reviewId);
  if (!review) return res.status(404).json({ message: "Not found" });
  if (String(review.userId) !== String(req.user._id)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (req.body.rating !== undefined) {
    const rating = Number(req.body.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "rating must be 1-5" });
    }
    review.rating = rating;
  }
  if (req.body.reviewText !== undefined) {
    review.reviewText = String(req.body.reviewText || "").trim();
  }
  await review.save();
  return res.json({
    id: review._id,
    rating: review.rating,
    reviewText: review.reviewText,
  });
};

const deleteOwnReview = async (req, res) => {
  const review = await StudyMaterialReview.findById(req.params.reviewId);
  if (!review) return res.status(404).json({ message: "Not found" });
  if (String(review.userId) !== String(req.user._id)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await StudyMaterialReview.deleteOne({ _id: review._id });
  return res.json({ id: review._id, deleted: true });
};

const adminListReviews = async (req, res) => {
  const status = String(req.query.status || "")
    .trim()
    .toLowerCase();
  const q = String(req.query.q || "").trim();
  const query = {};
  if (status) query["moderation.status"] = status;
  if (q) query.reviewText = { $regex: q, $options: "i" };

  const rows = await StudyMaterialReview.find(query)
    .sort({ createdAt: -1 })
    .populate("userId", "_id studentId name email")
    .populate("materialId", "_id title moduleCode semester")
    .populate("adminResponse.respondedBy", "_id name")
    .lean();

  return res.json({
    items: rows.map((r) => ({
      id: r._id,
      material: r.materialId,
      user: r.userId,
      rating: r.rating,
      reviewText: r.reviewText,
      helpfulCount: (r.helpfulVotes || []).length,
      unhelpfulCount: (r.unhelpfulVotes || []).length,
      moderation: r.moderation,
      adminResponse: r.adminResponse,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
  });
};

const adminModerateReview = async (req, res) => {
  const action = String(req.body.action || "")
    .trim()
    .toLowerCase();
  if (!["flag", "remove", "restore"].includes(action)) {
    return res
      .status(400)
      .json({ message: "action must be flag, remove, or restore" });
  }

  const review = await StudyMaterialReview.findById(req.params.reviewId);
  if (!review) return res.status(404).json({ message: "Not found" });

  review.moderation.status =
    action === "flag" ? "flagged" : action === "remove" ? "removed" : "visible";
  review.moderation.reason = String(req.body.reason || "").trim();
  review.moderation.moderatedBy = req.user._id;
  review.moderation.moderatedAt = new Date();
  await review.save();

  return res.json({ id: review._id, moderation: review.moderation });
};

const adminRespondReview = async (req, res) => {
  const text = String(req.body.text || "").trim();
  if (!text) return res.status(400).json({ message: "text is required" });

  const review = await StudyMaterialReview.findById(req.params.reviewId);
  if (!review) return res.status(404).json({ message: "Not found" });

  review.adminResponse.text = text;
  review.adminResponse.respondedBy = req.user._id;
  review.adminResponse.respondedAt = new Date();
  await review.save();

  return res.json({ id: review._id, adminResponse: review.adminResponse });
};

const adminReviewAnalytics = async (req, res) => {
  const avgByMaterial = await StudyMaterialReview.aggregate([
    { $match: { "moderation.status": { $ne: "removed" } } },
    {
      $group: {
        _id: "$materialId",
        avgRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
    { $sort: { avgRating: -1, reviewCount: -1 } },
    { $limit: 20 },
  ]);

  const materialIds = avgByMaterial.map((x) => x._id);
  const materials = await StudyMaterial.find({ _id: { $in: materialIds } })
    .select("title moduleCode")
    .lean();
  const materialMap = new Map(materials.map((m) => [String(m._id), m]));

  const trends = await StudyMaterialReview.aggregate([
    { $match: { "moderation.status": { $ne: "removed" } } },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        avgRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  return res.json({
    byMaterial: avgByMaterial.map((r) => ({
      materialId: r._id,
      title: materialMap.get(String(r._id))?.title || "Unknown",
      moduleCode: materialMap.get(String(r._id))?.moduleCode || "",
      avgRating: Number(Number(r.avgRating || 0).toFixed(2)),
      reviewCount: Number(r.reviewCount || 0),
    })),
    trends: trends.map((t) => ({
      year: t._id.year,
      month: t._id.month,
      avgRating: Number(Number(t.avgRating || 0).toFixed(2)),
      totalReviews: Number(t.totalReviews || 0),
    })),
  });
};

const DEFAULT_FORUM_CATEGORIES = [
  {
    name: "Programming",
    slug: "programming",
    description: "Coding and software development",
  },
  {
    name: "Mathematics",
    slug: "mathematics",
    description: "Math related discussions",
  },
  {
    name: "General Queries",
    slug: "general-queries",
    description: "General study related questions",
  },
];

const ensureDefaultForumCategories = async () => {
  for (const c of DEFAULT_FORUM_CATEGORIES) {
    await StudyMaterialForumCategory.updateOne(
      { slug: c.slug },
      { $setOnInsert: c },
      { upsert: true },
    );
  }
};

const ensureNotBanned = async (userId) => {
  const ban = await StudyMaterialForumBan.findOne({
    userId,
    active: true,
  }).lean();
  return !ban;
};

const mapThread = (thread, currentUserId) => {
  const myId = String(currentUserId);
  const threadId = String(thread._id);

  const mapAttachment = (a, url) => ({
    id: a._id,
    originalName: a.originalName,
    mimeType: a.mimeType,
    sizeBytes: a.sizeBytes,
    pageCount: a.pageCount ?? null,
    createdAt: a.createdAt,
    url,
  });

  const attachments = (thread.attachments || []).map((a) =>
    mapAttachment(
      a,
      `/api/study-material/forum/threads/${encodeURIComponent(
        threadId,
      )}/attachments/${encodeURIComponent(String(a._id))}/file`,
    ),
  );

  const replies = (thread.replies || []).map((r) => ({
    id: r._id,
    body: r.body,
    createdBy: r.createdBy,
    attachments: (r.attachments || []).map((a) =>
      mapAttachment(
        a,
        `/api/study-material/forum/replies/${encodeURIComponent(
          String(r._id),
        )}/attachments/${encodeURIComponent(String(a._id))}/file`,
      ),
    ),
    upvoteCount: (r.upvotes || []).length,
    upvoted: (r.upvotes || []).some((id) => String(id) === myId),
    accepted: !!r.accepted,
    helpful: !!r.helpful,
    removed: !!r.removed,
    removedReason: r.removedReason,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    isMine: String(r.createdBy?._id || r.createdBy) === myId,
  }));

  return {
    id: thread._id,
    title: thread.title,
    body: thread.body,
    attachments,
    tags: thread.tags || [],
    moduleCode: thread.moduleCode,
    topic: thread.topic,
    categorySlug: thread.categorySlug,
    createdBy: thread.createdBy,
    sticky: !!thread.sticky,
    announcement: !!thread.announcement,
    locked: !!thread.locked,
    status: thread.status,
    upvoteCount: (thread.upvotes || []).length,
    upvoted: (thread.upvotes || []).some((id) => String(id) === myId),
    subscribed: (thread.subscribers || []).some((id) => String(id) === myId),
    replyCount: replies.filter((r) => !r.removed).length,
    replies,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
    isMine: String(thread.createdBy?._id || thread.createdBy) === myId,
  };
};

const listForumCategories = async (req, res) => {
  await ensureDefaultForumCategories();
  const items = await StudyMaterialForumCategory.find({})
    .sort({ name: 1 })
    .lean();
  return res.json({ items });
};

const adminCreateForumCategory = async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ message: "name is required" });
  const slug = slugify(req.body.slug || name);
  if (!slug) return res.status(400).json({ message: "invalid slug" });

  const existing = await StudyMaterialForumCategory.findOne({ slug }).lean();
  if (existing) return res.status(400).json({ message: "slug already exists" });

  const created = await StudyMaterialForumCategory.create({
    name,
    slug,
    description: String(req.body.description || "").trim(),
    createdBy: req.user._id,
  });
  return res
    .status(201)
    .json({ id: created._id, name: created.name, slug: created.slug });
};

const adminDeleteForumCategory = async (req, res) => {
  await ensureDefaultForumCategories();
  const slug = String(req.params.slug || "")
    .trim()
    .toLowerCase();
  if (!slug) return res.status(400).json({ message: "slug is required" });
  if (["general-queries"].includes(slug)) {
    return res.status(400).json({ message: "Cannot delete default category" });
  }

  const cat = await StudyMaterialForumCategory.findOne({ slug }).lean();
  if (!cat) return res.status(404).json({ message: "Not found" });

  // Move existing threads to general-queries
  await ensureDefaultForumCategories();
  await StudyMaterialForumThread.updateMany(
    { categorySlug: slug },
    { $set: { movedFromCategory: slug, categorySlug: "general-queries" } },
  );

  await StudyMaterialForumCategory.deleteOne({ slug });
  return res.json({ slug, deleted: true, movedThreadsTo: "general-queries" });
};

const listForumThreads = async (req, res) => {
  await ensureDefaultForumCategories();

  const q = String(req.query.q || "").trim();
  const categorySlug = String(req.query.category || "").trim();
  const tag = String(req.query.tag || "").trim();

  const query = { status: "active" };
  if (categorySlug) query.categorySlug = categorySlug;
  if (tag) query.tags = tag;
  if (q) query.$text = { $search: q };

  const rows = await StudyMaterialForumThread.find(query)
    .sort({ sticky: -1, announcement: -1, updatedAt: -1 })
    .limit(200)
    .populate("createdBy", "_id studentId name avatarUrl")
    .populate("replies.createdBy", "_id studentId name avatarUrl")
    .lean();

  return res.json({ items: rows.map((t) => mapThread(t, req.user._id)) });
};

const getForumThread = async (req, res) => {
  const thread = await StudyMaterialForumThread.findById(req.params.threadId)
    .populate("createdBy", "_id studentId name avatarUrl")
    .populate("replies.createdBy", "_id studentId name avatarUrl")
    .lean();
  if (!thread || thread.status !== "active") {
    return res.status(404).json({ message: "Not found" });
  }

  return res.json({ item: mapThread(thread, req.user._id) });
};

const createForumThread = async (req, res) => {
  const allowed = await ensureNotBanned(req.user._id);
  if (!allowed)
    return res.status(403).json({ message: "You are banned from posting" });

  const title = String(req.body.title || "").trim();
  const body = String(req.body.body || "").trim();
  if (!title || !body)
    return res.status(400).json({ message: "title and body are required" });

  const files = Array.isArray(req.files) ? req.files : [];
  const attachments = await Promise.all(
    files.map(async (file) => {
      const attachment = {
        filePath: normalizeFsPath(
          path.relative(path.join(__dirname, ".."), file.path),
        ),
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedBy: req.user._id,
        pageCount: null,
      };

      if (String(file.mimetype || "").toLowerCase() === "application/pdf") {
        try {
          const parsed = await pdfParse(file.path);
          if (parsed?.numpages) attachment.pageCount = Number(parsed.numpages);
        } catch (_) {
          // ignore
        }
      }

      return attachment;
    }),
  );

  await ensureDefaultForumCategories();
  const requestedCategory = String(
    req.body.categorySlug || "general-queries",
  ).trim();
  const category = await StudyMaterialForumCategory.findOne({
    slug: requestedCategory,
  }).lean();
  const categorySlug = category?.slug || "general-queries";

  const tags = Array.isArray(req.body.tags)
    ? req.body.tags
    : String(req.body.tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

  const created = await StudyMaterialForumThread.create({
    title,
    body,
    attachments,
    tags: tags.slice(0, 20),
    moduleCode: String(req.body.moduleCode || "").trim(),
    topic: String(req.body.topic || "").trim(),
    categorySlug,
    createdBy: req.user._id,
    sticky: !!(isAdmin(req) && req.body.sticky),
    announcement: !!(isAdmin(req) && req.body.announcement),
    subscribers: [req.user._id],
  });

  const populated = await StudyMaterialForumThread.findById(created._id)
    .populate("createdBy", "_id studentId name avatarUrl")
    .lean();
  return res.status(201).json({ item: mapThread(populated, req.user._id) });
};

const addForumReply = async (req, res) => {
  const allowed = await ensureNotBanned(req.user._id);
  if (!allowed)
    return res.status(403).json({ message: "You are banned from replying" });

  const body = String(req.body.body || "").trim();
  const files = Array.isArray(req.files) ? req.files : [];
  if (!body && !files.length) {
    return res.status(400).json({ message: "body or attachment is required" });
  }

  const thread = await StudyMaterialForumThread.findById(req.params.threadId);
  if (!thread || thread.status !== "active") {
    return res.status(404).json({ message: "Not found" });
  }
  if (thread.locked && !isAdmin(req)) {
    return res.status(400).json({ message: "Thread is locked" });
  }

  const attachments = await Promise.all(
    files.map(async (file) => {
      const attachment = {
        filePath: normalizeFsPath(
          path.relative(path.join(__dirname, ".."), file.path),
        ),
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedBy: req.user._id,
        pageCount: null,
      };

      if (String(file.mimetype || "").toLowerCase() === "application/pdf") {
        try {
          const parsed = await pdfParse(file.path);
          if (parsed?.numpages) attachment.pageCount = Number(parsed.numpages);
        } catch (_) {
          // ignore
        }
      }

      return attachment;
    }),
  );

  thread.replies.push({
    body,
    attachments,
    createdBy: req.user._id,
    upvotes: [],
  });
  await thread.save();

  const notifiedUserIds = [
    thread.createdBy,
    ...(thread.subscribers || []),
  ].filter((id) => String(id) !== String(req.user._id));
  const appName = process.env.APP_NAME || "CampusCore";
  await notifyUsers({
    userIds: notifiedUserIds,
    subject: `${appName} - New forum reply`,
    text: `There is a new reply on thread: ${thread.title}`,
    html: `<p>There is a new reply on thread: <strong>${thread.title}</strong></p>`,
  });

  const populated = await StudyMaterialForumThread.findById(thread._id)
    .populate("createdBy", "_id studentId name avatarUrl")
    .populate("replies.createdBy", "_id studentId name avatarUrl")
    .lean();

  return res.status(201).json({ item: mapThread(populated, req.user._id) });
};

const streamForumThreadAttachment = async (req, res) => {
  const thread = await StudyMaterialForumThread.findById(req.params.threadId)
    .select("attachments status")
    .lean();
  if (!thread || thread.status !== "active") {
    return res.status(404).json({ message: "Not found" });
  }

  const attachment = (thread.attachments || []).find(
    (a) => String(a._id) === String(req.params.attachmentId),
  );
  if (!attachment) return res.status(404).json({ message: "Not found" });

  const abs = resolveUploadedFilePath(attachment.filePath);
  if (!abs) return res.status(400).json({ message: "Invalid file path" });

  const disposition =
    String(req.query.disposition || "attachment").toLowerCase() === "inline"
      ? "inline"
      : "attachment";
  res.setHeader(
    "Content-Disposition",
    `${disposition}; filename="${safeAttachmentName(attachment.originalName)}"`,
  );
  if (attachment.mimeType) res.type(attachment.mimeType);
  return res.sendFile(abs);
};

const streamForumReplyAttachment = async (req, res) => {
  const thread = await StudyMaterialForumThread.findOne({
    "replies._id": req.params.replyId,
  })
    .select("replies status")
    .lean();
  if (!thread || thread.status !== "active") {
    return res.status(404).json({ message: "Not found" });
  }

  const reply = (thread.replies || []).find(
    (r) => String(r._id) === String(req.params.replyId),
  );
  if (!reply || reply.removed)
    return res.status(404).json({ message: "Not found" });

  const attachment = (reply.attachments || []).find(
    (a) => String(a._id) === String(req.params.attachmentId),
  );
  if (!attachment) return res.status(404).json({ message: "Not found" });

  const abs = resolveUploadedFilePath(attachment.filePath);
  if (!abs) return res.status(400).json({ message: "Invalid file path" });

  const disposition =
    String(req.query.disposition || "attachment").toLowerCase() === "inline"
      ? "inline"
      : "attachment";
  res.setHeader(
    "Content-Disposition",
    `${disposition}; filename="${safeAttachmentName(attachment.originalName)}"`,
  );
  if (attachment.mimeType) res.type(attachment.mimeType);
  return res.sendFile(abs);
};

const toggleThreadUpvote = async (req, res) => {
  const thread = await StudyMaterialForumThread.findById(req.params.threadId);
  if (!thread || thread.status !== "active")
    return res.status(404).json({ message: "Not found" });

  const myId = String(req.user._id);
  const had = (thread.upvotes || []).some((id) => String(id) === myId);
  thread.upvotes = had
    ? thread.upvotes.filter((id) => String(id) !== myId)
    : [...thread.upvotes, req.user._id];
  await thread.save();

  return res.json({ upvoted: !had, upvoteCount: thread.upvotes.length });
};

const toggleReplyUpvote = async (req, res) => {
  const thread = await StudyMaterialForumThread.findOne({
    "replies._id": req.params.replyId,
  });
  if (!thread || thread.status !== "active")
    return res.status(404).json({ message: "Not found" });

  const reply = thread.replies.id(req.params.replyId);
  if (!reply || reply.removed)
    return res.status(404).json({ message: "Not found" });

  const myId = String(req.user._id);
  const had = (reply.upvotes || []).some((id) => String(id) === myId);
  reply.upvotes = had
    ? reply.upvotes.filter((id) => String(id) !== myId)
    : [...reply.upvotes, req.user._id];
  await thread.save();

  return res.json({ upvoted: !had, upvoteCount: reply.upvotes.length });
};

const acceptReply = async (req, res) => {
  const thread = await StudyMaterialForumThread.findOne({
    "replies._id": req.params.replyId,
  });
  if (!thread || thread.status !== "active")
    return res.status(404).json({ message: "Not found" });

  const canAccept =
    isAdmin(req) || String(thread.createdBy) === String(req.user._id);
  if (!canAccept) return res.status(403).json({ message: "Forbidden" });

  const reply = thread.replies.id(req.params.replyId);
  if (!reply || reply.removed)
    return res.status(404).json({ message: "Not found" });

  thread.replies.forEach((r) => {
    r.accepted = String(r._id) === String(reply._id);
  });
  await thread.save();

  return res.json({ replyId: reply._id, accepted: true });
};

const updateOwnForumReply = async (req, res) => {
  const allowed = await ensureNotBanned(req.user._id);
  if (!allowed)
    return res.status(403).json({ message: "You are banned from posting" });

  const thread = await StudyMaterialForumThread.findOne({
    "replies._id": req.params.replyId,
  });
  if (!thread || thread.status !== "active")
    return res.status(404).json({ message: "Not found" });
  if (thread.locked && !isAdmin(req)) {
    return res.status(400).json({ message: "Thread is locked" });
  }

  const reply = thread.replies.id(req.params.replyId);
  if (!reply || reply.removed)
    return res.status(404).json({ message: "Not found" });

  const isOwner = String(reply.createdBy) === String(req.user._id);
  if (!isOwner) return res.status(403).json({ message: "Forbidden" });

  const body = String(req.body.body || "").trim();
  const hasAttachments = Array.isArray(reply.attachments)
    ? reply.attachments.length > 0
    : false;
  if (!body && !hasAttachments) {
    return res.status(400).json({ message: "body or attachment is required" });
  }

  reply.body = body;
  await thread.save();

  return res.json({ replyId: reply._id, body: reply.body });
};

const deleteOwnForumReply = async (req, res) => {
  const allowed = await ensureNotBanned(req.user._id);
  if (!allowed)
    return res.status(403).json({ message: "You are banned from posting" });

  const thread = await StudyMaterialForumThread.findOne({
    "replies._id": req.params.replyId,
  });
  if (!thread || thread.status !== "active")
    return res.status(404).json({ message: "Not found" });
  if (thread.locked && !isAdmin(req)) {
    return res.status(400).json({ message: "Thread is locked" });
  }

  const reply = thread.replies.id(req.params.replyId);
  if (!reply || reply.removed)
    return res.status(404).json({ message: "Not found" });

  const isOwner = String(reply.createdBy) === String(req.user._id);
  if (!isOwner) return res.status(403).json({ message: "Forbidden" });

  reply.removed = true;
  if (!reply.removedReason) reply.removedReason = "Removed by author";
  await thread.save();

  return res.json({ replyId: reply._id, removed: true });
};

const toggleThreadSubscription = async (req, res) => {
  const thread = await StudyMaterialForumThread.findById(req.params.threadId);
  if (!thread || thread.status !== "active")
    return res.status(404).json({ message: "Not found" });

  const myId = String(req.user._id);
  const had = (thread.subscribers || []).some((id) => String(id) === myId);
  thread.subscribers = had
    ? thread.subscribers.filter((id) => String(id) !== myId)
    : [...thread.subscribers, req.user._id];
  await thread.save();

  return res.json({
    subscribed: !had,
    subscriberCount: thread.subscribers.length,
  });
};

const adminUpdateForumThread = async (req, res) => {
  const action = String(req.body.action || "update")
    .trim()
    .toLowerCase();
  const thread = await StudyMaterialForumThread.findById(req.params.threadId);
  if (!thread) return res.status(404).json({ message: "Not found" });

  if (action === "remove") {
    thread.status = "removed";
  } else if (action === "restore") {
    thread.status = "active";
  } else if (action === "move") {
    const nextCategory = String(
      req.body.categorySlug || thread.categorySlug || "",
    ).trim();
    if (!nextCategory)
      return res.status(400).json({ message: "categorySlug is required" });

    const categoryExists = await StudyMaterialForumCategory.findOne({
      slug: nextCategory,
    })
      .select("_id")
      .lean();
    if (!categoryExists) {
      return res
        .status(400)
        .json({ message: "Target category does not exist" });
    }

    if (thread.categorySlug !== nextCategory) {
      thread.movedFromCategory = thread.categorySlug;
      thread.categorySlug = nextCategory;
    }
  } else {
    if (req.body.title !== undefined)
      thread.title = String(req.body.title || "").trim();
    if (req.body.body !== undefined)
      thread.body = String(req.body.body || "").trim();
    if (req.body.categorySlug !== undefined)
      thread.categorySlug = String(req.body.categorySlug || "").trim();
    if (req.body.sticky !== undefined) thread.sticky = !!req.body.sticky;
    if (req.body.announcement !== undefined)
      thread.announcement = !!req.body.announcement;
    if (req.body.locked !== undefined) thread.locked = !!req.body.locked;
  }

  await thread.save();
  return res.json({
    id: thread._id,
    status: thread.status,
    categorySlug: thread.categorySlug,
  });
};

const adminUpdateForumReply = async (req, res) => {
  const action = String(req.body.action || "")
    .trim()
    .toLowerCase();
  if (
    !["edit", "remove", "restore", "mark-helpful", "unmark-helpful"].includes(
      action,
    )
  ) {
    return res.status(400).json({ message: "Invalid action" });
  }

  const thread = await StudyMaterialForumThread.findOne({
    "replies._id": req.params.replyId,
  });
  if (!thread) return res.status(404).json({ message: "Not found" });
  const reply = thread.replies.id(req.params.replyId);
  if (!reply) return res.status(404).json({ message: "Not found" });

  if (action === "edit") {
    reply.body = String(req.body.body || "").trim();
  }
  if (action === "remove") {
    reply.removed = true;
    reply.removedReason = String(req.body.reason || "").trim();
  }
  if (action === "restore") {
    reply.removed = false;
    reply.removedReason = "";
  }
  if (action === "mark-helpful") reply.helpful = true;
  if (action === "unmark-helpful") reply.helpful = false;

  await thread.save();
  return res.json({
    replyId: reply._id,
    removed: reply.removed,
    helpful: reply.helpful,
  });
};

const adminBanForumUser = async (req, res) => {
  const identifier = String(req.params.userId || "").trim();
  if (!identifier)
    return res.status(400).json({ message: "userId is required" });

  const resolvedUserId = await resolveUserIdFromIdentifier(identifier);
  if (!resolvedUserId)
    return res.status(404).json({ message: "Target user not found" });

  const reason = String(req.body.reason || "").trim();
  await StudyMaterialForumBan.findOneAndUpdate(
    { userId: resolvedUserId, active: true },
    { $set: { reason, bannedBy: req.user._id, active: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return res.json({ userId: resolvedUserId, banned: true });
};

const adminUnbanForumUser = async (req, res) => {
  const identifier = String(req.params.userId || "").trim();
  if (!identifier)
    return res.status(400).json({ message: "userId is required" });

  const resolvedUserId = await resolveUserIdFromIdentifier(identifier);
  if (!resolvedUserId)
    return res.status(404).json({ message: "Target user not found" });

  await StudyMaterialForumBan.updateMany(
    { userId: resolvedUserId, active: true },
    { $set: { active: false } },
  );
  return res.json({ userId: resolvedUserId, banned: false });
};

const adminForumTopContributors = async (req, res) => {
  const rows = await StudyMaterialForumThread.aggregate([
    { $match: { status: "active" } },
    {
      $facet: {
        threadAuthors: [
          { $group: { _id: "$createdBy", threadCount: { $sum: 1 } } },
          { $project: { _id: 1, threadCount: 1, replyCount: { $literal: 0 } } },
        ],
        replyAuthors: [
          { $unwind: "$replies" },
          { $match: { "replies.removed": { $ne: true } } },
          { $group: { _id: "$replies.createdBy", replyCount: { $sum: 1 } } },
          { $project: { _id: 1, threadCount: { $literal: 0 }, replyCount: 1 } },
        ],
      },
    },
    {
      $project: {
        merged: { $concatArrays: ["$threadAuthors", "$replyAuthors"] },
      },
    },
    { $unwind: "$merged" },
    {
      $group: {
        _id: "$merged._id",
        threadCount: { $sum: "$merged.threadCount" },
        replyCount: { $sum: "$merged.replyCount" },
      },
    },
    { $sort: { replyCount: -1, threadCount: -1 } },
    { $limit: 20 },
  ]);

  const userIds = rows.map((r) => r._id).filter(Boolean);
  const users = await User.find({ _id: { $in: userIds } })
    .select("_id studentId name email")
    .lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  return res.json({
    items: rows.map((r) => ({
      user: userMap.get(String(r._id)) || { _id: r._id },
      threadCount: Number(r.threadCount || 0),
      replyCount: Number(r.replyCount || 0),
      score: Number(r.threadCount || 0) + Number(r.replyCount || 0),
    })),
  });
};

const deleteOwnForumThread = async (req, res) => {
  const thread = await StudyMaterialForumThread.findById(req.params.threadId);
  if (!thread) return res.status(404).json({ message: "Not found" });
  const isOwner = String(thread.createdBy) === String(req.user._id);
  if (!isOwner && !isAdmin(req)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  thread.status = "removed";
  await thread.save();
  return res.json({ id: thread._id, status: "removed" });
};

module.exports = {
  listRequests,
  createRequest,
  toggleRequestUpvote,
  adminMarkRequestInProgress,
  adminFulfillRequest,
  adminRejectRequest,
  createOrUpdateReview,
  listMaterialReviews,
  voteReview,
  updateOwnReview,
  deleteOwnReview,
  adminListReviews,
  adminModerateReview,
  adminRespondReview,
  adminReviewAnalytics,
  listForumCategories,
  adminCreateForumCategory,
  adminDeleteForumCategory,
  listForumThreads,
  getForumThread,
  createForumThread,
  streamForumThreadAttachment,
  addForumReply,
  streamForumReplyAttachment,
  toggleThreadUpvote,
  toggleReplyUpvote,
  updateOwnForumReply,
  deleteOwnForumReply,
  acceptReply,
  toggleThreadSubscription,
  adminUpdateForumThread,
  adminUpdateForumReply,
  adminBanForumUser,
  adminUnbanForumUser,
  adminForumTopContributors,
  deleteOwnForumThread,
};
