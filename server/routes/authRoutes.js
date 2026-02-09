const express = require("express");
const {
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
} = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/verify-email-otp", verifyEmailOtp);
router.post("/resend-email-otp", resendEmailOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/login", login);
router.post("/module-login", moduleLogin);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.patch("/profile", requireAuth, updateProfile);
router.patch("/password", requireAuth, updatePassword);
router.delete("/account", requireAuth, deleteAccount);

module.exports = router;
