const express = require("express");
const router = express.Router();
const { getQrCode } = require("../controllers/qr.controller");
const { requireAuth } = require("../middleware/auth");

router.get("/:id", requireAuth, getQrCode);

module.exports = router;
