const mongoose = require("mongoose");

const studyMaterialForumCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      unique: true,
      index: true,
    },
    description: { type: String, default: "", trim: true, maxlength: 400 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "StudyMaterialForumCategory",
  studyMaterialForumCategorySchema,
);
