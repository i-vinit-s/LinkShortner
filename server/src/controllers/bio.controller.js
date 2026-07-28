const BioPage = require("../models/BioPage");
const { isValidTheme } = require("../utils/bioPresets");

var RESERVED_SLUGS = [
  "admin",
  "api",
  "login",
  "signup",
  "dashboard",
  "report",
  "privacy",
  "terms",
  "cookies",
  "health",
  "u",
  "new",
];

function isValidSlug(slug) {
  return /^[a-zA-Z0-9_-]{3,30}$/.test(slug);
}

exports.listMyBioPages = async function (req, res) {
  try {
    var pages = await BioPage.find({ userId: req.session.userId }).sort({
      createdAt: -1,
    });
    res.json({ pages: pages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch pages" });
  }
};

exports.getBioPageById = async function (req, res) {
  try {
    var page = await BioPage.findOne({
      _id: req.params.id,
      userId: req.session.userId,
    });
    if (!page) return res.status(404).json({ message: "Page not found" });
    res.json({ page: page });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch page" });
  }
};

exports.checkSlugAvailable = async function (req, res) {
  try {
    var slug = (req.query.slug || "").trim().toLowerCase();
    var excludeId = req.query.excludeId || null;

    if (!isValidSlug(slug)) {
      return res.json({
        available: false,
        reason: "Slug must be 3-30 characters: letters, numbers, - or _",
      });
    }
    if (RESERVED_SLUGS.indexOf(slug) !== -1) {
      return res.json({ available: false, reason: "This slug is reserved" });
    }

    var filter = { slug: slug };
    if (excludeId) filter._id = { $ne: excludeId };

    var existing = await BioPage.findOne(filter);
    res.json({ available: !existing });
  } catch (err) {
    res.status(500).json({ message: "Failed to check slug" });
  }
};

exports.saveBioPage = async function (req, res) {
  try {
    var pageId = req.body.pageId || null;
    var slug = (req.body.slug || "").trim().toLowerCase();
    var displayName = (req.body.displayName || "").trim().slice(0, 50);
    var bio = (req.body.bio || "").trim().slice(0, 200);
    var avatarUrl = (req.body.avatarUrl || "").trim();
    var isPublished = req.body.isPublished !== false;
    var rawLinks = Array.isArray(req.body.links) ? req.body.links : [];
    var theme = req.body.theme || {};

    if (!slug || !isValidSlug(slug)) {
      return res
        .status(400)
        .json({
          message: "Slug must be 3-30 characters: letters, numbers, - or _",
        });
    }
    if (RESERVED_SLUGS.indexOf(slug) !== -1) {
      return res.status(400).json({ message: "This slug is reserved" });
    }
    if (!isValidTheme(theme)) {
      return res.status(400).json({ message: "Invalid theme configuration" });
    }

    var slugFilter = { slug: slug };
    if (pageId) slugFilter._id = { $ne: pageId };
    var slugTaken = await BioPage.findOne(slugFilter);
    if (slugTaken) {
      return res.status(409).json({ message: "This slug is already taken" });
    }

    var cleanLinks = [];
    for (var i = 0; i < rawLinks.length && i < 15; i++) {
      var l = rawLinks[i];
      if (!l || !l.label || !l.url) continue;
      var urlStr = String(l.url).trim();
      try {
        var parsed = new URL(urlStr);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
          continue;
      } catch (err) {
        continue;
      }
      cleanLinks.push({
        id: l.id || "link_" + Date.now() + "_" + i,
        platform: l.platform || "website",
        label: String(l.label).trim().slice(0, 40),
        url: urlStr,
      });
    }

    var payload = {
      userId: req.session.userId,
      slug: slug,
      displayName: displayName,
      bio: bio,
      avatarUrl: avatarUrl,
      isPublished: isPublished,
      links: cleanLinks,
      theme: theme,
    };

    var page;
    if (pageId) {
      page = await BioPage.findOneAndUpdate(
        { _id: pageId, userId: req.session.userId },
        payload,
        { new: true },
      );
      if (!page) return res.status(404).json({ message: "Page not found" });
    } else {
      page = await BioPage.create(payload);
    }

    res.json({ page: page });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(409).json({ message: "This slug is already taken" });
    }
    res.status(500).json({ message: "Failed to save page" });
  }
};

exports.deleteBioPage = async function (req, res) {
  try {
    var result = await BioPage.deleteOne({
      _id: req.params.id,
      userId: req.session.userId,
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Page not found" });
    }
    res.json({ message: "Page deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete page" });
  }
};

exports.getPublicBioPage = async function (req, res) {
  try {
    var slug = (req.params.slug || "").trim().toLowerCase();
    var page = await BioPage.findOne({ slug: slug, isPublished: true });

    if (!page) return res.status(404).json({ message: "Page not found" });

    BioPage.updateOne({ _id: page._id }, { $inc: { views: 1 } }).catch(
      function (err) {
        console.error("View increment failed:", err);
      },
    );

    res.json({
      displayName: page.displayName,
      bio: page.bio,
      avatarUrl: page.avatarUrl,
      links: page.links,
      theme: page.theme,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load page" });
  }
};
