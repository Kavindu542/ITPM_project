const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");

const { sendEmailOtp, sendPasswordResetOtp } = require("../utils/email");

const getJwtSecret = () => String(process.env.JWT_SECRET || "dev-secret");

const signToken = (user, extra = {}) => {
  const payload = {
    sub: String(user?._id || user),
    name: user?.name || "",
    email: user?.email || "",
    studentId: user?.studentId || "",
    ...extra,
  };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
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

const normalizeEmail = (v) =>
  String(v || "")
    .toLowerCase()
    .trim();

const getEnvInt = (name, fallback) => {
  const raw = process.env[name];
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const generateOtp6 = () =>
  String(crypto.randomInt(0, 1000000)).padStart(6, "0");

const publicUser = (user, req) => ({
  id: user._id,
  studentId: user.studentId || null,
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl || "",
  role: user.role || "student",
  semester: user.semester ?? null,
  enrolledModules: Array.isArray(user.enrolledModules)
    ? user.enrolledModules
    : [],
  module: req?.user?.mod || req?.user?.module || null,
});

// Minimal implementations to keep server running
const register = async (req, res) => {
  const { studentId, name, email, password, confirmPassword } = req.body || {};
  if (!name || !email || !password || !confirmPassword) {
    return res
      .status(400)
      .json({ message: "name, email, password, confirmPassword are required" });
  }
  if (String(password) !== String(confirmPassword)) {
    return res.status(400).json({ message: "Passwords do not match" });
  }
  const emailNorm = normalizeEmail(email);
  const existing = await User.findOne({ email: emailNorm });
  if (existing) {
    return res.status(409).json({ message: "Email already in use" });
  }
  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = await User.create({
    studentId: String(studentId || "").trim() || undefined,
    name: String(name || "").trim(),
    email: emailNorm,
    passwordHash,
    isEmailVerified: false,
    role: "student",
  });

  const ttlMinutes = getEnvInt("EMAIL_OTP_TTL_MINUTES", 10);
  const otp = generateOtp6();
  user.emailOtpHash = await bcrypt.hash(otp, 10);
  user.emailOtpExpiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  user.emailOtpSentAt = new Date();
  await user.save();

  try {
    await sendEmailOtp({ to: user.email, otp, ttlMinutes });
  } catch (err) {
    console.error("Failed to send verification OTP:", err);
    return res
      .status(500)
      .json({
        message: "Failed to send verification code. Check SMTP settings.",
      });
  }

  return res.status(201).json({
    email: user.email,
    message: "OTP sent",
  });
};

const verifyEmailOtp = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const otp = String(req.body?.otp || "").trim();

  if (!email || !otp) {
    return res.status(400).json({ message: "email and otp are required" });
  }
  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({ message: "OTP must be 6 digits" });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "Account not found" });

  if (user.isEmailVerified) {
    const token = signToken(user);
    res.cookie("token", token, cookieOptions());
    return res.json({ user: publicUser(user, req) });
  }

  if (!user.emailOtpHash || !user.emailOtpExpiresAt) {
    return res
      .status(400)
      .json({ message: "No OTP pending. Please request a new code." });
  }
  if (new Date(user.emailOtpExpiresAt).getTime() < Date.now()) {
    return res
      .status(400)
      .json({ message: "OTP expired. Please request a new code." });
  }

  const ok = await bcrypt.compare(otp, user.emailOtpHash);
  if (!ok) return res.status(400).json({ message: "Invalid OTP" });

  user.isEmailVerified = true;
  user.emailOtpHash = "";
  user.emailOtpExpiresAt = null;
  await user.save();

  const token = signToken(user);
  res.cookie("token", token, cookieOptions());
  return res.json({ user: publicUser(user, req) });
};

const resendEmailOtp = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!email) return res.status(400).json({ message: "email is required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "Account not found" });

  if (user.isEmailVerified) {
    return res.json({ message: "Email already verified" });
  }

  const cooldownSeconds = getEnvInt("EMAIL_OTP_RESEND_COOLDOWN_SECONDS", 60);
  if (user.emailOtpSentAt) {
    const elapsed =
      (Date.now() - new Date(user.emailOtpSentAt).getTime()) / 1000;
    const remaining = Math.ceil(cooldownSeconds - elapsed);
    if (remaining > 0) {
      return res
        .status(429)
        .json({ message: `Please wait ${remaining}s before resending OTP` });
    }
  }

  const ttlMinutes = getEnvInt("EMAIL_OTP_TTL_MINUTES", 10);
  const otp = generateOtp6();
  user.emailOtpHash = await bcrypt.hash(otp, 10);
  user.emailOtpExpiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  user.emailOtpSentAt = new Date();
  await user.save();

  try {
    await sendEmailOtp({ to: user.email, otp, ttlMinutes });
  } catch (err) {
    console.error("Failed to resend verification OTP:", err);
    return res
      .status(500)
      .json({
        message: "Failed to send verification code. Check SMTP settings.",
      });
  }

  return res.json({ message: "OTP resent" });
};

const forgotPassword = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!email) return res.status(400).json({ message: "email is required" });

  const user = await User.findOne({ email });
  const ttlMinutes = getEnvInt("PASSWORD_RESET_TTL_MINUTES", 30);

  if (user) {
    const otp = generateOtp6();
    user.passwordResetTokenHash = await bcrypt.hash(otp, 10);
    user.passwordResetExpiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    user.passwordResetSentAt = new Date();
    await user.save();

    try {
      await sendPasswordResetOtp({ to: user.email, otp, ttlMinutes });
    } catch (err) {
      console.error("Failed to send password reset OTP:", err);
      return res
        .status(500)
        .json({ message: "Failed to send reset code. Check SMTP settings." });
    }
  }

  return res.json({
    message: "If an account exists, a reset code has been sent.",
  });
};

const resetPassword = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const otp = String(req.body?.otp || "").trim();
  const newPassword = String(req.body?.newPassword || "");
  const confirmPassword = String(req.body?.confirmPassword || "");

  if (!email || !otp || !newPassword || !confirmPassword) {
    return res
      .status(400)
      .json({
        message: "email, otp, newPassword, confirmPassword are required",
      });
  }
  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({ message: "OTP must be 6 digits" });
  }
  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "Invalid reset code" });

  if (!user.passwordResetTokenHash || !user.passwordResetExpiresAt) {
    return res.status(400).json({ message: "Invalid reset code" });
  }
  if (new Date(user.passwordResetExpiresAt).getTime() < Date.now()) {
    return res.status(400).json({ message: "Reset code expired" });
  }
  const ok = await bcrypt.compare(otp, user.passwordResetTokenHash);
  if (!ok) return res.status(400).json({ message: "Invalid reset code" });

  user.passwordHash = await bcrypt.hash(newPassword, 10);
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
  const user = await User.findOne({ email: normalizeEmail(email) });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });
  const token = signToken(user);
  res.cookie("token", token, cookieOptions());
  return res.json({
    user: {
      id: user._id,
      studentId: user.studentId || null,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || "",
      role: user.role || "student",
      semester: user.semester ?? null,
      enrolledModules: Array.isArray(user.enrolledModules)
        ? user.enrolledModules
        : [],
      module: null,
    },
  });
};

const moduleLogin = async (req, res) => {
  const { module, email, password } = req.body || {};
  if (!module || !email || !password) {
    return res
      .status(400)
      .json({ message: "module, email and password are required" });
  }
  const user = await User.findOne({ email: normalizeEmail(email) });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });
  const token = signToken(user, {
    mod: String(module).trim(),
    module: String(module).trim(),
  });
  res.cookie("token", token, cookieOptions());
  return res.json({
    module: String(module).trim(),
    token,
    user: {
      id: user._id,
      studentId: user.studentId || null,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || "",
      role: user.role || "student",
      semester: user.semester ?? null,
      enrolledModules: Array.isArray(user.enrolledModules)
        ? user.enrolledModules
        : [],
      module: String(module).trim(),
    },
  });
};

const me = async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?._id;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await User.findById(userId).select(
      "_id studentId name email avatarUrl role semester enrolledModules",
    );
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    return res.json({
      user: {
        id: user._id,
        studentId: user.studentId || null,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || "",
        role: user.role || "student",
        semester: user.semester ?? null,
        enrolledModules: Array.isArray(user.enrolledModules)
          ? user.enrolledModules
          : [],
        module: req.user?.mod || req.user?.module || null,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
};

const logout = async (_req, res) => {
  res.clearCookie("token");
  return res.json({ message: "Logged out" });
};

const updateProfile = async (req, res) => {
  const { name, avatarUrl, semester, enrolledModules } = req.body || {};
  try {
    const userId = req.user?.sub || req.user?._id;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const updates = {};
    if (name !== undefined) updates.name = String(name || "").trim();
    if (avatarUrl !== undefined)
      updates.avatarUrl = String(avatarUrl || "").trim();
    if (semester !== undefined) updates.semester = semester ?? null;
    if (Array.isArray(enrolledModules))
      updates.enrolledModules = enrolledModules;
    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
      select:
        "_id studentId name email avatarUrl role semester enrolledModules",
    });
    return res.json({
      user: {
        id: user._id,
        studentId: user.studentId || null,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || "",
        role: user.role || "student",
        semester: user.semester ?? null,
        enrolledModules: Array.isArray(user.enrolledModules)
          ? user.enrolledModules
          : [],
        module: req.user?.mod || req.user?.module || null,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update profile" });
  }
};

const updatePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body || {};
  if (!currentPassword || !newPassword || !confirmPassword) {
    return res
      .status(400)
      .json({
        message:
          "currentPassword, newPassword and confirmPassword are required",
      });
  }
  if (String(newPassword) !== String(confirmPassword)) {
    return res.status(400).json({ message: "Passwords do not match" });
  }
  try {
    const userId = req.user?.sub || req.user?._id;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    const ok = await bcrypt.compare(String(currentPassword), user.passwordHash);
    if (!ok)
      return res.status(401).json({ message: "Current password is incorrect" });
    user.passwordHash = await bcrypt.hash(String(newPassword), 10);
    await user.save();
    return res.json({ message: "Password updated" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update password" });
  }
};

const deleteAccount = async (req, res) => {
  const { password } = req.body || {};
  if (!password)
    return res.status(400).json({ message: "password is required" });
  try {
    const userId = req.user?.sub || req.user?._id;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Password is incorrect" });
    await User.deleteOne({ _id: user._id });
    res.clearCookie("token");
    return res.json({ message: "Account deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete account" });
  }
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
