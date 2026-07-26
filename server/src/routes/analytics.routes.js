const express = require("express");
const router = express.Router();
const { getLinkAnalytics, getRawClickEvents } = require("../controllers/analytics.controller");
const { requireAuth } = require("../middleware/auth");

router.get("/:id", requireAuth, getLinkAnalytics);
router.get("/:id/events", requireAuth, getRawClickEvents);

module.exports = router;
