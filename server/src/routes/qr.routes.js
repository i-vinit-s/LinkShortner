const express = require("express");
const router = express.Router();
const {
  getQrCode,
  generateQrFromUrl,
} = require("../controllers/qr.controller");
const { requireAuth } = require("../middleware/auth");
const { limitQrGenerate } = require("../middleware/rateLimiter");

router.get("/:id", requireAuth, getQrCode); // QR for an existing shortened link (your own)
router.post("/generate", limitQrGenerate, generateQrFromUrl); // QR for any raw URL, public, no DB record

module.exports = router;
