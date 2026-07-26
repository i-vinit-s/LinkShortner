const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  logout,
  getMe,
  verifyOtp,
  resendOtp,
} = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth");
const { limitLogin, limitOtpResend } = require("../middleware/rateLimiter");

router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", limitOtpResend, resendOtp);
router.post("/login", limitLogin, login);
router.post("/logout", logout);
router.get("/me", requireAuth, getMe);

module.exports = router;
