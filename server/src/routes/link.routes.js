const express = require("express");
const router = express.Router();
const {
  createLink,
  getMyLinks,
  importLinksCsv,
  exportMyLinksCsv,
  getDestinationHistory,
  restoreDestination,
  updateLink,
  deleteLink,
  reactivateLink,
  bulkDeleteLinks,
  getMyTags,
} = require("../controllers/link.controller");
const { requireAuth } = require("../middleware/auth");
const {
  limitAnonymousLinkCreation,
  limitAuthLinkCreation,
  limitBulkImport,
  limitLinkExport,
} = require("../middleware/rateLimiter");

// Branch the rate limiter based on auth status
const smartLinkLimiter = (req, res, next) => {
  if (req.session.userId) {
    return limitAuthLinkCreation(req, res, next);
  }
  return limitAnonymousLinkCreation(req, res, next);
};

router.post("/", smartLinkLimiter, createLink);
router.post(
  "/import",
  requireAuth,
  limitBulkImport,
  express.text({ type: "text/csv", limit: "10kb" }),
  importLinksCsv,
);
router.get("/mine/export", requireAuth, limitLinkExport, exportMyLinksCsv);
router.get("/mine", requireAuth, getMyLinks);
router.get("/:id/history", requireAuth, getDestinationHistory);
router.post(
  "/:id/history/:historyIndex/restore",
  requireAuth,
  limitAuthLinkCreation,
  restoreDestination,
);
router.patch("/:id", requireAuth, limitAuthLinkCreation, updateLink);
router.delete("/:id", requireAuth, deleteLink);
router.post("/:id/reactivate", requireAuth, reactivateLink);
router.post("/bulk-delete", requireAuth, bulkDeleteLinks);
router.get("/tags", requireAuth, getMyTags);

module.exports = router;
