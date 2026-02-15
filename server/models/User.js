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

    role: {
      type: String,
      enum: ["student", "admin", "club_leader"],
      default: "student",
      index: true,
    },
    department: {
      type: String,
      trim: true,
      default: null,
    },
    year: {
      type: String,
      trim: true,
      default: null,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      default: null, // if user is a leader
    },
    clubs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      default: [], // memberships
    }],
    semester: {
      type: Number,
      default: null,
      min: 1,
      max: 12,
      index: true,
    },
    enrolledModules: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
