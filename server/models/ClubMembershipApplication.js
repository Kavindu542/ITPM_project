const mongoose = require("mongoose");

const LanguageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    proficiency: { type: String, default: "" },
  },
  { _id: false },
);

const ClubMembershipApplicationSchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
      index: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // School / campus details
    school: {
      university: { type: String, default: "" },
      faculty: { type: String, default: "" },
      department: { type: String, default: "" },
      studentId: { type: String, default: "" },
      semester: { type: String, default: "" },
      year: { type: String, default: "" },
    },

    // Personal details
    personal: {
      fullName: { type: String, default: "" },
      dob: { type: Date, default: null },
      phone: { type: String, default: "" },
      address: { type: String, default: "" },
    },

    contact: {
      email: { type: String, default: "" },
      alternateEmail: { type: String, default: "" },
    },

    languages: { type: [LanguageSchema], default: [] },

    educationQualifications: { type: String, default: "" },
    sportsQualifications: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

ClubMembershipApplicationSchema.index(
  { club: 1, applicant: 1 },
  { unique: true, name: "uniq_club_applicant" },
);

module.exports = mongoose.model(
  "ClubMembershipApplication",
  ClubMembershipApplicationSchema,
);
