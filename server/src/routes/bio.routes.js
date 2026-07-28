const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { limitBioView } = require("../middleware/rateLimiter");
const bio = require("../controllers/bio.controller");

router.get("/mine", requireAuth, bio.listMyBioPages);
router.get("/mine/:id", requireAuth, bio.getBioPageById);
router.get("/check-slug", requireAuth, bio.checkSlugAvailable);
router.post("/", requireAuth, bio.saveBioPage);
router.delete("/:id", requireAuth, bio.deleteBioPage);
router.get("/public/:slug", limitBioView, bio.getPublicBioPage);

module.exports = router;
