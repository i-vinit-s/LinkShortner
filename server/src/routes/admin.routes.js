const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/requireAdmin");
const admin = require("../controllers/admin.controller");

router.use(requireAuth, requireAdmin); // applies to every route below

router.get("/stats", admin.getStats);

router.get("/users", admin.listUsers);
router.post("/users/:id/toggle-ban", admin.toggleUserBan);

router.get("/links", admin.listAllLinks);
router.post("/links/:id/toggle-active", admin.adminDeactivateLink);

router.get("/reports", admin.listReports);
router.post("/reports/:id/action", admin.actionReport);
router.post("/reports/:id/dismiss", admin.dismissReport);

router.get("/bio-pages", admin.listBioPages);
router.post("/bio-pages/:id/toggle-publish", admin.toggleBioPagePublish);
router.delete("/bio-pages/:id", admin.adminDeleteBioPage);

module.exports = router;
