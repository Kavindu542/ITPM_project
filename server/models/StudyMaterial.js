const mongoose = require("mongoose");

const versionSchema = new mongoose.Schema(
  {
    filePath: { type: String, required: true, trim: true },
    originalName: { type: String, required: true, trim: true },
    mimeType: { type: String, default: "", trim: true },
    sizeBytes: { type: Number, default: 0 },
    note: { type: String, default: "", trim: true, maxlength: 500 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const studyMaterialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", trim: true, maxlength: 2000 },

    category: {
      type: String,
      default: "notes",
      enum: ["notes", "tutes", "papers", "links", "other"],
    },

    moduleCode: { type: String, default: "", trim: true, maxlength: 50 },
    subject: { type: String, default: "", trim: true, maxlength: 120 },
    semester: { type: Number, default: null, min: 1, max: 12 },

    fileType: { type: String, default: "", trim: true, maxlength: 30 },

    status: {
      type: String,
      default: "published",
      enum: ["published", "draft", "archived", "pending", "rejected"],
      index: true,
    },

    suggested: { type: Boolean, default: false },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    moderation: {
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      reviewedAt: { type: Date, default: null },
      decisionReason: {
        type: String,
        default: "",
        trim: true,
        maxlength: 1000,
      },
    },

    access: {
      allowedSemesters: { type: [Number], default: [] },
      allowedModules: { type: [String], default: [] },
      allowedRoles: { type: [String], default: [] },
    },

    versions: { type: [versionSchema], default: [] },
    currentVersionId: { type: mongoose.Schema.Types.ObjectId, default: null },

    extractedText: { type: String, default: "" },
    extractedAt: { type: Date, default: null },
    extractedFromVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    downloadCount: { type: Number, default: 0, index: true },
    lastDownloadedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

studyMaterialSchema.index({
  title: "text",
  description: "text",
  moduleCode: "text",
  subject: "text",
});

module.exports = mongoose.model("StudyMaterial", studyMaterialSchema);
