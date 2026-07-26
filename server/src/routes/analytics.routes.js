const express = require("express");
const router = express.Router();
const { getLinkAnalytics } = require("../controllers/analytics.controller");
const { requireAuth } = require("../middleware/auth");

router.get("/:id", requireAuth, getLinkAnalytics);

module.exports = router;
