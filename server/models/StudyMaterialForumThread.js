const mongoose = require("mongoose");

const forumAttachmentSchema = new mongoose.Schema(
  {
    filePath: { type: String, required: true, trim: true, maxlength: 500 },
    originalName: { type: String, required: true, trim: true, maxlength: 255 },
    mimeType: { type: String, default: "", trim: true, maxlength: 120 },
    sizeBytes: { type: Number, default: 0 },
    pageCount: { type: Number, default: null },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

const forumReplySchema = new mongoose.Schema(
  {
    body: {
      type: String,
      required: false,
      default: "",
      trim: true,
      maxlength: 5000,
    },
    attachments: { type: [forumAttachmentSchema], default: [] },
    createdBy: {
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
    accepted: { type: Boolean, default: false },
    helpful: { type: Boolean, default: false },
    removed: { type: Boolean, default: false },
    removedReason: { type: String, default: "", trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

const studyMaterialForumThreadSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 250 },
    body: { type: String, required: true, trim: true, maxlength: 8000 },
    attachments: { type: [forumAttachmentSchema], default: [] },
    tags: { type: [String], default: [] },
    moduleCode: { type: String, default: "", trim: true, maxlength: 50 },
    topic: { type: String, default: "", trim: true, maxlength: 120 },
    categorySlug: {
      type: String,
      default: "general-queries",
      trim: true,
      maxlength: 120,
      index: true,
    },
    createdBy: {
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
    subscribers: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
    replies: { type: [forumReplySchema], default: [] },
    sticky: { type: Boolean, default: false, index: true },
    announcement: { type: Boolean, default: false, index: true },
    locked: { type: Boolean, default: false },
    movedFromCategory: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "removed"],
      index: true,
    },
  },
  { timestamps: true },
);

studyMaterialForumThreadSchema.index({
  title: "text",
  body: "text",
  tags: "text",
  moduleCode: "text",
  topic: "text",
});

module.exports = mongoose.model(
  "StudyMaterialForumThread",
  studyMaterialForumThreadSchema,
);
