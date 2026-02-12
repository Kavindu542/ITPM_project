const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const { requireAuth } = require("../middleware/authMiddleware");
const { requireModuleAdmin } = require("../middleware/moduleAuthMiddleware");
const controller = require("../controllers/studyMaterialController");

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
