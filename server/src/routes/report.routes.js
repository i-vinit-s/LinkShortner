const express = require("express");
const router = express.Router();
const {
  submitReport,
  listReports,
  actionReport,
} = require("../controllers/report.controller");
const { requireAuth } = require("../middleware/auth");
const { limitReport } = require("../middleware/rateLimiter");

router.post("/", limitReport, submitReport); // public — no auth required to report abuse
router.get("/", requireAuth, listReports); // temporary: any logged-in user; tighten later with real admin check
router.post("/:id/action", requireAuth, actionReport);

module.exports = router;
