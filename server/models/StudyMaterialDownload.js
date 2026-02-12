const mongoose = require("mongoose");

const studyMaterialDownloadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyMaterial",
      required: true,
      index: true,
    },
    versionId: { type: mongoose.Schema.Types.ObjectId, required: true },

    ip: { type: String, default: "", trim: true },
    userAgent: { type: String, default: "", trim: true, maxlength: 500 },
    downloadedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false },
);

studyMaterialDownloadSchema.index({ materialId: 1, downloadedAt: -1 });

module.exports = mongoose.model(
  "StudyMaterialDownload",
  studyMaterialDownloadSchema,
);
