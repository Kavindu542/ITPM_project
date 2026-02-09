const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    avatarUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000000,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailOtpHash: {
      type: String,
      default: "",
    },
    emailOtpExpiresAt: {
      type: Date,
      default: null,
    },
    emailOtpSentAt: {
      type: Date,
      default: null,
    },

    passwordResetTokenHash: {
      type: String,
      default: "",
    },
    passwordResetExpiresAt: {
      type: Date,
      default: null,
    },
    passwordResetSentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
