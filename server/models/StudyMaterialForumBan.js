const mongoose = require("mongoose");

const studyMaterialForumBanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reason: { type: String, default: "", trim: true, maxlength: 1000 },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

studyMaterialForumBanSchema.index({ userId: 1, active: 1 }, { unique: true });

module.exports = mongoose.model(
  "StudyMaterialForumBan",
  studyMaterialForumBanSchema,
);
