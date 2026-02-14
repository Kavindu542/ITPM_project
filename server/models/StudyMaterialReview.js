const mongoose = require("mongoose");

const studyMaterialReviewSchema = new mongoose.Schema(
  {
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyMaterial",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    reviewText: { type: String, default: "", trim: true, maxlength: 3000 },
    helpfulVotes: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
    unhelpfulVotes: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
    moderation: {
      status: {
        type: String,
        default: "visible",
        enum: ["visible", "flagged", "removed"],
        index: true,
      },
      reason: { type: String, default: "", trim: true, maxlength: 1000 },
      moderatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      moderatedAt: { type: Date, default: null },
    },
    adminResponse: {
      text: { type: String, default: "", trim: true, maxlength: 2000 },
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      respondedAt: { type: Date, default: null },
    },
  },
  { timestamps: true },
);

studyMaterialReviewSchema.index({ materialId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model(
  "StudyMaterialReview",
  studyMaterialReviewSchema,
);
