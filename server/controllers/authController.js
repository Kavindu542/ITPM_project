const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

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
    // Frontend and API run on different domains in production.
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

const normalizeEmail = (v) => String(v || "").toLowerCase().trim();

// Minimal implementations to keep server running
const register = async (req, res) => {
  const { studentId, name, email, password, confirmPassword } = req.body || {};
  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: "name, email, password, confirmPassword are required" });
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
    isEmailVerified: true,
    role: "student",
  });
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
      enrolledModules: Array.isArray(user.enrolledModules) ? user.enrolledModules : [],
    },
  });
};

const verifyEmailOtp = async (_req, res) => {
  return res.status(501).json({ message: "verify-email-otp not implemented" });
};

const resendEmailOtp = async (_req, res) => {
  return res.status(501).json({ message: "resend-email-otp not implemented" });
};

const forgotPassword = async (_req, res) => {
  return res.status(501).json({ message: "forgot-password not implemented" });
};

const resetPassword = async (_req, res) => {
  return res.status(501).json({ message: "reset-password not implemented" });
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
      enrolledModules: Array.isArray(user.enrolledModules) ? user.enrolledModules : [],
      module: null,
    },
  });
};

const moduleLogin = async (req, res) => {
  const { module, email, password } = req.body || {};
  if (!module || !email || !password) {
    return res.status(400).json({ message: "module, email and password are required" });
  }
  const user = await User.findOne({ email: normalizeEmail(email) });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });
  const token = signToken(user, { mod: String(module).trim(), module: String(module).trim() });
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
      enrolledModules: Array.isArray(user.enrolledModules) ? user.enrolledModules : [],
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
        enrolledModules: Array.isArray(user.enrolledModules) ? user.enrolledModules : [],
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
    if (avatarUrl !== undefined) updates.avatarUrl = String(avatarUrl || "").trim();
    if (semester !== undefined) updates.semester = semester ?? null;
    if (Array.isArray(enrolledModules)) updates.enrolledModules = enrolledModules;
    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
      select: "_id studentId name email avatarUrl role semester enrolledModules",
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
        enrolledModules: Array.isArray(user.enrolledModules) ? user.enrolledModules : [],
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
    return res.status(400).json({ message: "currentPassword, newPassword and confirmPassword are required" });
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
    if (!ok) return res.status(401).json({ message: "Current password is incorrect" });
    user.passwordHash = await bcrypt.hash(String(newPassword), 10);
    await user.save();
    return res.json({ message: "Password updated" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update password" });
  }
};

const deleteAccount = async (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ message: "password is required" });
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
