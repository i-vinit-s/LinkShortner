const validator = require("validator");
const User = require("../models/User");
const { validatePasswordStrength } = require("../utils/validators");
const { generateOtp, hashOtp } = require("../utils/otp");
const { sendOtpEmail } = require("../config/mailer");

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address" });
    }

    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return res.status(400).json({ message: strength.message });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (user && user.verified) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    if (user && !user.verified) {
      // Unverified signup already exists — update details and resend a fresh code
      user.name = name;
      user.password = password; // pre-save hook re-hashes since it's modified
      user.otpHash = otpHash;
      user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
      await user.save();
    } else {
      user = await User.create({
        name,
        email: normalizedEmail,
        password,
        verified: false,
        otpHash,
        otpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
      });
    }

    await sendOtpEmail(normalizedEmail, otp);

    res
      .status(201)
      .json({ message: "Verification code sent", email: normalizedEmail });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed" });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.otpHash) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    if (user.otpExpiresAt < new Date()) {
      return res
        .status(400)
        .json({ message: "Code has expired. Request a new one." });
    }

    if (hashOtp(otp) !== user.otpHash) {
      return res.status(400).json({ message: "Incorrect code" });
    }

    user.verified = true;
    user.otpHash = null;
    user.otpExpiresAt = null;
    await user.save();

    req.session.userId = user._id;
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Verification failed" });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || user.verified) {
      // Don't reveal whether the account exists/is already verified — generic response
      return res.json({
        message: "If an account exists, a new code has been sent",
      });
    }

    const otp = generateOtp();
    user.otpHash = hashOtp(otp);
    user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
    await user.save();

    await sendOtpEmail(user.email, otp);
    res.json({ message: "If an account exists, a new code has been sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to resend code" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.verified) {
      return res
        .status(403)
        .json({
          message: "Please verify your email before logging in",
          unverified: true,
          email: user.email,
        });
    }

    req.session.userId = user._id;
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out" });
  });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
};
