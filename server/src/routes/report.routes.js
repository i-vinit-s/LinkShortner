const express = require("express");
const router = express.Router();
const { submitReport } = require("../controllers/report.controller");
const { limitReport } = require("../middleware/rateLimiter");

router.post("/", limitReport, submitReport); // public — no auth required to report abuse

module.exports = router;
