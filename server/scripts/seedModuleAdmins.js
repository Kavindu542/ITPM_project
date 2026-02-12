const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const { connectDB } = require("../config/db");
const User = require("../models/User");

dotenv.config();

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing env var: ${name}`);
  }
  return v;
}

function normalizeEmail(value) {
  return String(value || "")
    .toLowerCase()
    .trim();
}

async function upsertAdmin({ email, password, name }) {
  const emailNorm = normalizeEmail(email);
  const passwordHash = await bcrypt.hash(String(password), 10);

  await User.findOneAndUpdate(
    { email: emailNorm },
    {
      $set: {
        email: emailNorm,
        name: String(name || "Admin").trim(),
        passwordHash,
        isEmailVerified: true,
        role: "admin",
        emailOtpHash: "",
        emailOtpExpiresAt: null,
        emailOtpSentAt: null,
        passwordResetTokenHash: "",
        passwordResetExpiresAt: null,
        passwordResetSentAt: null,
      },
    },
    { upsert: true, new: true },
  );
}

async function main() {
  const mongoUri = requireEnv("MONGODB_URI");

  const studyEmail = requireEnv("SEED_STUDY_MATERIAL_ADMIN_EMAIL");
  const studyPassword = requireEnv("SEED_STUDY_MATERIAL_ADMIN_PASSWORD");

  const libraryEmail = requireEnv("SEED_LIBRARY_ADMIN_EMAIL");
  const libraryPassword = requireEnv("SEED_LIBRARY_ADMIN_PASSWORD");

  const clubEmail = requireEnv("SEED_CLUB_ADMIN_EMAIL");
  const clubPassword = requireEnv("SEED_CLUB_ADMIN_PASSWORD");

  const hostelWardenEmail = requireEnv("SEED_HOSTEL_WARDEN_ADMIN_EMAIL");
  const hostelWardenPassword = requireEnv("SEED_HOSTEL_WARDEN_ADMIN_PASSWORD");

  await connectDB(mongoUri);

  await upsertAdmin({
    email: studyEmail,
    password: studyPassword,
    name: "Study Material Admin",
  });

  await upsertAdmin({
    email: libraryEmail,
    password: libraryPassword,
    name: "Library Admin",
  });

  await upsertAdmin({
    email: clubEmail,
    password: clubPassword,
    name: "Club and Society Admin",
  });

  await upsertAdmin({
    email: hostelWardenEmail,
    password: hostelWardenPassword,
    name: "Hostel Warden Admin",
  });

  // eslint-disable-next-line no-console
  console.log("Seeded module admin users successfully");
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
