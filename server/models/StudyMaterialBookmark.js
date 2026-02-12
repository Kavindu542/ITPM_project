const mongoose = require("mongoose");

const studyMaterialBookmarkSchema = new mongoose.Schema(
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
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

studyMaterialBookmarkSchema.index(
  { userId: 1, materialId: 1 },
  { unique: true },
);

module.exports = mongoose.model(
  "StudyMaterialBookmark",
  studyMaterialBookmarkSchema,
);
