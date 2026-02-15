const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const { requireAuth } = require("../middleware/authMiddleware");
const { requireModuleAdmin } = require("../middleware/moduleAuthMiddleware");
const controller = require("../controllers/studyMaterialController");
const community = require("../controllers/studyMaterialCommunityController");
const ai = require("../controllers/studyMaterialAIController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads", "study-materials"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 250 * 1024 * 1024, // 250MB
    files: 25,
  },
});

// Student endpoints
router.get("/materials", requireAuth, controller.listMaterials);
router.get("/materials/:id", requireAuth, controller.getMaterial);
router.get("/materials/:id/file", requireAuth, controller.streamMaterialFile);
router.post(
  "/materials/suggestions",
  requireAuth,
  upload.single("file"),
  controller.createSuggestion,
);
router.post("/materials/:id/bookmark", requireAuth, controller.toggleBookmark);
router.get("/me/uploads", requireAuth, controller.listMyUploads);
router.get("/me/bookmarks", requireAuth, controller.listBookmarks);
router.get("/me/history", requireAuth, controller.listHistory);

router.post("/ai/chat", requireAuth, ai.aiChat);

// Missing resource requests (student)
router.get("/requests", requireAuth, community.listRequests);
router.post("/requests", requireAuth, community.createRequest);
router.post("/requests/:id/upvote", requireAuth, community.toggleRequestUpvote);

// Reviews (student)
router.get(
  "/materials/:materialId/reviews",
  requireAuth,
  community.listMaterialReviews,
);
router.post(
  "/materials/:materialId/reviews",
  requireAuth,
  community.createOrUpdateReview,
);
router.post("/reviews/:reviewId/vote", requireAuth, community.voteReview);
router.patch("/reviews/:reviewId", requireAuth, community.updateOwnReview);
router.delete("/reviews/:reviewId", requireAuth, community.deleteOwnReview);

// Forum (student)
router.get("/forum/categories", requireAuth, community.listForumCategories);
router.get("/forum/threads", requireAuth, community.listForumThreads);
router.post("/forum/threads", requireAuth, community.createForumThread);
router.get("/forum/threads/:threadId", requireAuth, community.getForumThread);
router.post(
  "/forum/threads/:threadId/replies",
  requireAuth,
  community.addForumReply,
);
router.post(
  "/forum/threads/:threadId/upvote",
  requireAuth,
  community.toggleThreadUpvote,
);
router.post(
  "/forum/replies/:replyId/upvote",
  requireAuth,
  community.toggleReplyUpvote,
);
router.post(
  "/forum/replies/:replyId/accept",
  requireAuth,
  community.acceptReply,
);
router.post(
  "/forum/threads/:threadId/subscribe",
  requireAuth,
  community.toggleThreadSubscription,
);

// Admin endpoints (study-material module)
router.post(
  "/admin/materials",
  requireAuth,
  requireModuleAdmin("study-material"),
  upload.array("files", 25),
  controller.adminCreateMaterials,
);
router.post(
  "/admin/materials/:id/versions",
  requireAuth,
  requireModuleAdmin("study-material"),
  upload.single("file"),
  controller.adminAddVersion,
);
router.patch(
  "/admin/materials/:id",
  requireAuth,
  requireModuleAdmin("study-material"),
  controller.adminUpdateMaterial,
);
router.delete(
  "/admin/materials/:id",
  requireAuth,
  requireModuleAdmin("study-material"),
  controller.adminDeleteMaterial,
);
router.get(
  "/admin/materials",
  requireAuth,
  requireModuleAdmin("study-material"),
  controller.listMaterials,
);

// Missing resource requests (admin)
router.get(
  "/admin/requests",
  requireAuth,
  requireModuleAdmin("study-material"),
  community.listRequests,
);
router.post(
  "/admin/requests/:id/in-progress",
  requireAuth,
  requireModuleAdmin("study-material"),
  community.adminMarkRequestInProgress,
);
router.post(
  "/admin/requests/:id/fulfill",
  requireAuth,
  requireModuleAdmin("study-material"),
  upload.single("file"),
  community.adminFulfillRequest,
);
router.post(
  "/admin/requests/:id/reject",
  requireAuth,
  requireModuleAdmin("study-material"),
  community.adminRejectRequest,
);

// Reviews (admin)
router.get(
  "/admin/reviews",
  requireAuth,
  requireModuleAdmin("study-material"),
  community.adminListReviews,
);
router.post(
  "/admin/reviews/:reviewId/moderate",
  requireAuth,
  requireModuleAdmin("study-material"),
  community.adminModerateReview,
);
router.post(
  "/admin/reviews/:reviewId/respond",
  requireAuth,
  requireModuleAdmin("study-material"),
  community.adminRespondReview,
);
router.get(
  "/admin/reviews/analytics",
  requireAuth,
  requireModuleAdmin("study-material"),
  community.adminReviewAnalytics,
);

// Forum (admin)
router.post(
  "/admin/forum/categories",
  requireAuth,
  requireModuleAdmin("study-material"),
  community.adminCreateForumCategory,
);
router.delete(
  "/admin/forum/categories/:slug",
  requireAuth,
  requireModuleAdmin("study-material"),
  community.adminDeleteForumCategory,
);
router.patch(
  "/admin/forum/threads/:threadId",
  requireAuth,
  requireModuleAdmin("study-material"),
  community.adminUpdateForumThread,
);
router.patch(
  "/admin/forum/replies/:replyId",
  requireAuth,
  requireModuleAdmin("study-material"),
  community.adminUpdateForumReply,
);
router.post(
  "/admin/forum/users/:userId/ban",
  requireAuth,
  requireModuleAdmin("study-material"),
  community.adminBanForumUser,
);
router.delete(
  "/admin/forum/users/:userId/ban",
  requireAuth,
  requireModuleAdmin("study-material"),
  community.adminUnbanForumUser,
);
router.get(
  "/admin/forum/top-contributors",
  requireAuth,
  requireModuleAdmin("study-material"),
  community.adminForumTopContributors,
);

// Forum (user/owner)
router.delete(
  "/forum/threads/:threadId",
  requireAuth,
  community.deleteOwnForumThread,
);

router.get(
  "/admin/downloads",
  requireAuth,
  requireModuleAdmin("study-material"),
  controller.adminDownloadsHistory,
);
router.get(
  "/admin/queue",
  requireAuth,
  requireModuleAdmin("study-material"),
  controller.adminQueueList,
);
router.post(
  "/admin/queue/:id/approve",
  requireAuth,
  requireModuleAdmin("study-material"),
  controller.adminApprove,
);
router.post(
  "/admin/queue/:id/reject",
  requireAuth,
  requireModuleAdmin("study-material"),
  controller.adminReject,
);
router.get(
  "/admin/analytics",
  requireAuth,
  requireModuleAdmin("study-material"),
  controller.adminAnalytics,
);

module.exports = router;
