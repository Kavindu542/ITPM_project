const mongoose = require("mongoose");

const studyMaterialRequestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    moduleCode: { type: String, default: "", trim: true, maxlength: 50 },
    courseCode: { type: String, default: "", trim: true, maxlength: 80 },
    syllabusLink: { type: String, default: "", trim: true, maxlength: 1000 },
    normalizedKey: { type: String, required: true, trim: true, index: true },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "in-progress", "completed", "rejected"],
      index: true,
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    upvotes: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
    fulfilledMaterialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyMaterial",
      default: null,
    },
    fulfilledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    fulfilledAt: { type: Date, default: null },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectedAt: { type: Date, default: null },
    feedback: { type: String, default: "", trim: true, maxlength: 1500 },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "StudyMaterialRequest",
  studyMaterialRequestSchema,
);
