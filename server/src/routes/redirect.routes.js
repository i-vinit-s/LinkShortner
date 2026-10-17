const express = require("express");
const router = express.Router();
const {
  resolveLink,
  verifyLinkPassword,
} = require("../controllers/redirect.controller");
const {
  limitRedirect,
  limitPasswordVerify,
} = require("../middleware/rateLimiter");

router.get("/api/v1/resolve/:shortCode", limitRedirect, resolveLink);
router.post(
  "/api/v1/resolve/:shortCode/verify",
  limitRedirect,
  limitPasswordVerify,
  verifyLinkPassword,
);

module.exports = router;
