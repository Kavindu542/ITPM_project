const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendEmailOtp, sendPasswordResetOtp } = require("../utils/email");

const MAX_AVATAR_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_AVATAR_URL_CHARS = 4096;

const estimateBase64Bytes = (base64) => {
  const clean = String(base64 || "")
    .trim()
    .replace(/\s/g, "");
  if (!clean) return 0;

  const padding = clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0;
  // bytes = (len * 3 / 4) - padding
  return Math.max(0, Math.floor((clean.length * 3) / 4) - padding);
};

const parseImageDataUrl = (value) => {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/.exec(value);
  if (!match) return null;
  return { mime: match[1], base64: match[2] };
};

const signToken = (userId, extraClaims = {}) => {
  return jwt.sign({ sub: userId, ...extraClaims }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const cookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

const normalizeEmail = (value) =>
  String(value || "")
    .toLowerCase()
    .trim();

const OTP_TTL_MINUTES = Number(process.env.EMAIL_OTP_TTL_MINUTES || 10);
const OTP_RESEND_COOLDOWN_SECONDS = Number(
  process.env.EMAIL_OTP_RESEND_COOLDOWN_SECONDS || 60,
);

const PASSWORD_RESET_TTL_MINUTES = Number(
  process.env.PASSWORD_RESET_TTL_MINUTES || 30,
);

const generateOtp = () => {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
};

const isOtpExpired = (expiresAt) => {
  if (!expiresAt) return true;
  return Date.now() > new Date(expiresAt).getTime();
};

const getAllowedEmailsForModule = (moduleKey) => {
  const map = {
    "study-material": process.env.MODULE_ADMIN_STUDY_MATERIAL_EMAILS,
    library: process.env.MODULE_ADMIN_LIBRARY_EMAILS,
    "club-and-society": process.env.MODULE_ADMIN_CLUB_AND_SOCIETY_EMAILS,
    "hostel-warden": process.env.MODULE_ADMIN_HOSTEL_WARDEN_EMAILS,
    "hostel-laundry": process.env.MODULE_ADMIN_HOSTEL_LAUNDRY_EMAILS,
    "hostel-meals-shop": process.env.MODULE_ADMIN_HOSTEL_MEALS_SHOP_EMAILS,
  };

  const raw = map[moduleKey];
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((s) => normalizeEmail(s))
    .filter(Boolean);
};

const getAllAllowedAdminEmails = () => {
  const moduleKeys = [
    "study-material",
    "library",
    "club-and-society",
    "hostel-warden",
    "hostel-laundry",
    "hostel-meals-shop",
  ];

  const all = new Set();
  for (const key of moduleKeys) {
    for (const e of getAllowedEmailsForModule(key)) all.add(e);
  }
  return all;
};

const register = async (req, res) => {
  const { studentId, name, email, password, confirmPassword } = req.body || {};

  if (!studentId || !name || !email || !password || !confirmPassword) {
    return res.status(400).json({
      message: "studentId, name, email, password, confirmPassword are required",
    });
  }

  const trimmedStudentId = String(studentId).trim();
  if (trimmedStudentId.length < 3 || trimmedStudentId.length > 30) {
    return res
      .status(400)
      .json({ message: "Student ID must be 3-30 characters" });
  }

  const trimmedEmail = String(email).toLowerCase().trim();
  if (!trimmedEmail.endsWith("@my.sliit.lk")) {
    return res
      .status(400)
      .json({ message: "Please use your campus email (@my.sliit.lk)" });
  }

  if (String(password).length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  if (String(password) !== String(confirmPassword)) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  const existingStudent = await User.findOne({ studentId: trimmedStudentId });
  if (existingStudent) {
    return res.status(409).json({ message: "Student ID already in use" });
  }

  const existing = await User.findOne({
    email: trimmedEmail,
  });
  if (existing) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const now = new Date();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  const user = await User.create({
    studentId: trimmedStudentId,
    name: String(name).trim(),
    email: trimmedEmail,
    passwordHash,
    isEmailVerified: false,
    emailOtpHash: otpHash,
    emailOtpExpiresAt: expiresAt,
    emailOtpSentAt: now,
  });

  try {
    await sendEmailOtp({ to: trimmedEmail, otp, ttlMinutes: OTP_TTL_MINUTES });
  } catch (err) {
    await User.deleteOne({ _id: user._id }).catch(() => {});
    return res.status(500).json({
      message:
        err?.message === "Missing env var: SMTP_HOST" ||
        String(err?.message || "").startsWith("Missing env var")
          ? "Email service is not configured"
          : "Failed to send OTP email",
    });
  }

  return res.status(201).json({
    message: "OTP sent to your email",
    pendingVerification: true,
    email: trimmedEmail,
  });
};

const verifyEmailOtp = async (req, res) => {
  const { email, otp } = req.body || {};

  if (!email || !otp) {
    return res.status(400).json({ message: "email and otp are required" });
  }

  const emailNorm = normalizeEmail(email);
  const otpValue = String(otp).trim();
  if (!/^\d{6}$/.test(otpValue)) {
    return res.status(400).json({ message: "OTP must be 6 digits" });
  }

  const user = await User.findOne({ email: emailNorm });
  if (!user) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({ message: "Email already verified" });
  }

  if (!user.emailOtpHash || isOtpExpired(user.emailOtpExpiresAt)) {
    return res.status(400).json({ message: "OTP expired. Please resend." });
  }

  const ok = await bcrypt.compare(otpValue, user.emailOtpHash);
  if (!ok) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  user.isEmailVerified = true;
  user.emailOtpHash = "";
  user.emailOtpExpiresAt = null;
  user.emailOtpSentAt = null;
  await user.save();

  const token = signToken(user._id);
  res.cookie("token", token, cookieOptions());

  return res.json({
    user: {
      id: user._id,
      studentId: user.studentId,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || "",
    },
  });
};

const resendEmailOtp = async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ message: "email is required" });
  }

  const emailNorm = normalizeEmail(email);
  const user = await User.findOne({ email: emailNorm });
  if (!user) {
    return res.status(400).json({ message: "Invalid request" });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({ message: "Email already verified" });
  }

  if (user.emailOtpSentAt) {
    const secondsSince = Math.floor(
      (Date.now() - new Date(user.emailOtpSentAt).getTime()) / 1000,
    );
    if (secondsSince < OTP_RESEND_COOLDOWN_SECONDS) {
      return res.status(429).json({
        message: `Please wait ${OTP_RESEND_COOLDOWN_SECONDS - secondsSince}s before resending`,
      });
    }
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  user.emailOtpHash = otpHash;
  user.emailOtpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  user.emailOtpSentAt = new Date();
  await user.save();

  try {
    await sendEmailOtp({ to: user.email, otp, ttlMinutes: OTP_TTL_MINUTES });
  } catch (err) {
    return res.status(500).json({ message: "Failed to send OTP email" });
  }

  return res.json({ message: "OTP resent" });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ message: "email is required" });
  }

  const emailNorm = normalizeEmail(email);
  const user = await User.findOne({ email: emailNorm });

  // Always respond with a generic message to avoid leaking account existence.
  const okMessage = {
    message: "If an account exists for this email, a reset code has been sent.",
  };

  if (!user || !user.isEmailVerified) {
    return res.json(okMessage);
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  user.passwordResetTokenHash = otpHash;
  user.passwordResetExpiresAt = new Date(
    Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000,
  );
  user.passwordResetSentAt = new Date();
  await user.save();

  try {
    await sendPasswordResetOtp({
      to: user.email,
      otp,
      ttlMinutes: PASSWORD_RESET_TTL_MINUTES,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to send reset OTP" });
  }

  return res.json(okMessage);
};

const resetPassword = async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body || {};

  if (!email || !otp || !newPassword || !confirmPassword) {
    return res.status(400).json({
      message: "email, otp, newPassword and confirmPassword are required",
    });
  }

  const emailNorm = normalizeEmail(email);
  const otpValue = String(otp).trim();
  if (!/^\d{6}$/.test(otpValue)) {
    return res.status(400).json({ message: "OTP must be 6 digits" });
  }

  if (String(newPassword).length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  if (String(newPassword) !== String(confirmPassword)) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  const user = await User.findOne({ email: emailNorm });
  if (!user) {
    return res.status(400).json({ message: "Invalid or expired reset code" });
  }

  if (
    !user.passwordResetTokenHash ||
    isOtpExpired(user.passwordResetExpiresAt)
  ) {
    return res.status(400).json({ message: "Invalid or expired reset code" });
  }

  const ok = await bcrypt.compare(otpValue, user.passwordResetTokenHash);
  if (!ok) {
    return res.status(400).json({ message: "Invalid or expired reset code" });
  }

  user.passwordHash = await bcrypt.hash(String(newPassword), 10);
  user.passwordResetTokenHash = "";
  user.passwordResetExpiresAt = null;
  user.passwordResetSentAt = null;
  await user.save();

  return res.json({ message: "Password reset successful" });
};

const login = async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  const emailNorm = normalizeEmail(email);
  if (getAllAllowedAdminEmails().has(emailNorm)) {
    return res.status(403).json({
      message: "Admins cannot sign in here. Please use the Admin login page.",
    });
  }

  const user = await User.findOne({
    email: emailNorm,
  });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!user.isEmailVerified) {
    return res.status(403).json({
      message: "Please verify your email using the OTP sent to your inbox",
      code: "EMAIL_NOT_VERIFIED",
      email: user.email,
    });
  }

  const token = signToken(user._id);
  res.cookie("token", token, cookieOptions());

  return res.json({
    user: {
      id: user._id,
      studentId: user.studentId,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || "",
    },
  });
};

const me = async (req, res) => {
  return res.json({
    user: {
      id: req.user._id,
      studentId: req.user.studentId,
      name: req.user.name,
      email: req.user.email,
      avatarUrl: req.user.avatarUrl || "",
      module: req.auth?.module || null,
    },
  });
};

const logout = async (req, res) => {
  res.clearCookie("token");
  return res.json({ message: "Logged out" });
};

const moduleLogin = async (req, res) => {
  const { module: moduleKey, email, password } = req.body || {};

  if (!moduleKey || !email || !password) {
    return res
      .status(400)
      .json({ message: "module, email and password are required" });
  }

  const moduleName = String(moduleKey).trim();
  const emailNorm = normalizeEmail(email);
  const allowed = getAllowedEmailsForModule(moduleName);

  if (!allowed.length) {
    return res
      .status(403)
      .json({ message: "Module admin login not configured" });
  }

  if (!allowed.includes(emailNorm)) {
    return res
      .status(403)
      .json({ message: "This email is not allowed for this module" });
  }

  const user = await User.findOne({ email: emailNorm });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken(user._id, { mod: moduleName });
  res.cookie("token", token, cookieOptions());

  return res.json({
    module: moduleName,
    user: {
      id: user._id,
      studentId: user.studentId,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || "",
      module: moduleName,
    },
  });
};

const updateProfile = async (req, res) => {
  const { name, avatarUrl } = req.body || {};

  const updates = {};
  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (trimmed.length < 2 || trimmed.length > 80) {
      return res.status(400).json({ message: "Name must be 2-80 characters" });
    }
    updates.name = trimmed;
  }

  if (avatarUrl !== undefined) {
    const value = String(avatarUrl || "").trim();

    if (value) {
      if (value.startsWith("data:")) {
        const parsed = parseImageDataUrl(value);
        if (!parsed) {
          return res
            .status(400)
            .json({ message: "Invalid image data URL format" });
        }

        const bytes = estimateBase64Bytes(parsed.base64);
        if (bytes > MAX_AVATAR_BYTES) {
          return res.status(400).json({
            message: "Profile image is too large. Max size is 10MB.",
          });
        }
      } else if (value.length > MAX_AVATAR_URL_CHARS) {
        return res
          .status(400)
          .json({ message: "Profile image URL is too long" });
      }
    }

    updates.avatarUrl = value;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
    select: "_id studentId name email avatarUrl",
  });

  return res.json({
    user: {
      id: user._id,
      studentId: user.studentId,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || "",
      module: req.auth?.module || null,
    },
  });
};

const updatePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body || {};

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({
      message: "currentPassword, newPassword and confirmPassword are required",
    });
  }

  if (String(newPassword).length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  if (String(newPassword) !== String(confirmPassword)) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const ok = await bcrypt.compare(String(currentPassword), user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Current password is incorrect" });
  }

  user.passwordHash = await bcrypt.hash(String(newPassword), 10);
  await user.save();

  return res.json({ message: "Password updated" });
};

const deleteAccount = async (req, res) => {
  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ message: "password is required" });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Password is incorrect" });
  }

  await User.deleteOne({ _id: user._id });
  res.clearCookie("token");
  return res.json({ message: "Account deleted" });
};

module.exports = {
  register,
  verifyEmailOtp,
  resendEmailOtp,
  forgotPassword,
  resetPassword,
  login,
  moduleLogin,
  me,
  logout,
  updateProfile,
  updatePassword,
  deleteAccount,
};
