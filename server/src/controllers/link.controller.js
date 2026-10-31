const validUrl = require("valid-url");
const bcrypt = require("bcryptjs");
const Link = require("../models/Link");
const redisClient = require("../config/redis");
const { checkUrlSafety } = require("../utils/safeBrowsing");
const { generateUniqueShortCode } = require("../utils/shortCode");
const { getPageBounds } = require("../utils/pagination");
const {
  buildLinkListFilter,
  getLinkListSort,
  parseLinkListQuery,
} = require("../utils/linkListQuery");
const { appendDestinationHistory } = require("../utils/destinationHistory");
const { clearShortCodeCache } = require("../utils/shortCodeCache");

const LINK_LIST_PAGE_SIZE = 20;

const RESERVED_ALIASES = [
  "api",
  "login",
  "signup",
  "dashboard",
  "admin",
  "health",
];

function isSafeUrl(url) {
  try {
    var parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (err) {
    return false;
  }
}

function isSelfReferencingShortLink(url, shortCode) {
  try {
    var parsed = new URL(url);
    var ownHost = process.env.CLIENT_URL
      ? new URL(process.env.CLIENT_URL).hostname
      : null;
    var path = parsed.pathname.replace(/^\/|\/$/g, "");
    return !!ownHost && parsed.hostname === ownHost && path === shortCode;
  } catch (err) {
    return false;
  }
}

exports.createLink = async (req, res) => {
  try {
    var longUrl = req.body.longUrl;
    var isAuthenticated = !!req.session.userId;

    if (!longUrl || !validUrl.isWebUri(longUrl)) {
      return res.status(400).json({ message: "A valid URL is required" });
    }

    if (!isSafeUrl(longUrl)) {
      return res
        .status(400)
        .json({ message: "Only http/https URLs are allowed" });
    }

    var safetyCheck = await checkUrlSafety(longUrl);
    if (safetyCheck.malicious) {
      return res.status(400).json({
        message: "This URL has been flagged as unsafe and cannot be shortened",
      });
    }
    if (safetyCheck.unavailable) {
      return res.status(503).json({
        message:
          "URL safety check is temporarily unavailable. Please try again later.",
      });
    }

    var linkData = {
      longUrl: longUrl,
      userId: isAuthenticated ? req.session.userId : null,
    };

    if (isAuthenticated) {
      // --- Full feature set for logged-in users ---
      var customAlias = req.body.customAlias;
      var expiresAt = req.body.expiresAt;
      var password = req.body.password;
      var tags = req.body.tags;

      var cleanTags = [];
      if (Array.isArray(tags)) {
        var seen = {};
        for (var i = 0; i < tags.length; i++) {
          var t = String(tags[i]).trim().toLowerCase().slice(0, 20);
          if (t !== "" && !seen[t]) {
            seen[t] = true;
            cleanTags.push(t);
          }
          if (cleanTags.length >= 5) break;
        }
      }
      linkData.tags = cleanTags;
      linkData.expiresAt = expiresAt || null;

      if (customAlias) {
        var alias = customAlias.trim();
        if (!/^[a-zA-Z0-9_-]{3,20}$/.test(alias)) {
          return res.status(400).json({
            message: "Alias must be 3-20 chars, letters/numbers/-/_ only",
          });
        }
        if (RESERVED_ALIASES.includes(alias.toLowerCase())) {
          return res.status(400).json({ message: "This alias is reserved" });
        }
        var existsAlias = await Link.findOne({
          $or: [{ shortCode: alias }, { legacyShortCodes: alias }],
        });
        if (existsAlias) {
          return res.status(409).json({ message: "Alias already taken" });
        }
        linkData.shortCode = alias;
        linkData.customAlias = true;
      }

      if (password) {
        linkData.passwordHash = await bcrypt.hash(password, 10);
      }
    } else {
      // --- Anonymous users: no alias, no password, no tags, no custom expiry ---
      // Anonymous links also auto-expire after 14 days — a soft nudge toward creating an account for permanent links.
      linkData.expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    }

    var link;

    if (linkData.shortCode) {
      // Custom alias path — already validated as unique above
      link = await Link.create(linkData);
    } else {
      // Automatic codes are random and consistently long for every account type.
      var attempts = 0;
      while (attempts < 5) {
        var candidateCode = await generateUniqueShortCode(Link);

        try {
          linkData.shortCode = candidateCode;
          link = await Link.create(linkData);
          break;
        } catch (err) {
          if (err.code === 11000) {
            attempts++;
            continue; // collision — extremely rare, just retry with a new code
          }
          throw err;
        }
      }

      if (!link) {
        return res.status(500).json({
          message: "Could not generate a unique short code, please try again",
        });
      }
    }

    var cacheValue = JSON.stringify({
      longUrl: link.longUrl,
      hasPassword: !!link.passwordHash,
      isActive: link.isActive,
      shortCode: link.shortCode,
    });

    if (link.expiresAt) {
      var ttlSeconds = Math.floor(
        (new Date(link.expiresAt) - Date.now()) / 1000,
      );
      if (ttlSeconds > 0)
        await redisClient.setEx(
          "short:" + link.shortCode,
          ttlSeconds,
          cacheValue,
        );
    } else {
      await redisClient.set("short:" + link.shortCode, cacheValue);
    }

    res.status(201).json({ link: link });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create link" });
  }
};

exports.getMyLinks = async (req, res) => {
  try {
    const options = parseLinkListQuery(req.query);
    if (options.error) return res.status(400).json({ message: options.error });

    const filter = buildLinkListFilter(req.session.userId, options);
    const allFilter = { userId: req.session.userId };
    const [total, allTotal] = await Promise.all([
      Link.countDocuments(filter),
      Link.countDocuments(allFilter),
    ]);
    const bounds = getPageBounds(options.page, total, LINK_LIST_PAGE_SIZE);
    const links = await Link.find(filter)
      .sort(getLinkListSort(options.sort))
      .skip((bounds.page - 1) * LINK_LIST_PAGE_SIZE)
      .limit(LINK_LIST_PAGE_SIZE);

    res.json({
      links,
      total,
      allTotal,
      page: bounds.page,
      pages: bounds.pages,
      limit: LINK_LIST_PAGE_SIZE,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch links" });
  }
};

exports.getDestinationHistory = async (req, res) => {
  try {
    const link = await Link.findOne({
      _id: req.params.id,
      userId: req.session.userId,
    }).populate("destinationHistory.changedBy", "name");

    if (!link) return res.status(404).json({ message: "Link not found" });

    res.json({
      shortCode: link.shortCode,
      currentUrl: link.longUrl,
      history: link.destinationHistory.map((entry, index) => ({
        index,
        url: entry.url,
        changedAt: entry.changedAt,
        changedBy: entry.changedBy ? entry.changedBy.name : null,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch destination history" });
  }
};

exports.deleteLink = async (req, res) => {
  try {
    const link = await Link.findOne({
      _id: req.params.id,
      userId: req.session.userId,
    });
    if (!link) return res.status(404).json({ message: "Link not found" });

    // Don't re-label a link that is already off (e.g. disabled by an admin)
    if (!link.isActive) {
      return res.status(400).json({ message: "Link is already deactivated" });
    }

    link.isActive = false; // soft delete — keeps analytics history intact
    link.deactivatedBy = "user";
    await link.save();
    await clearShortCodeCache(redisClient, link);

    res.json({ message: "Link deactivated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete link" });
  }
};

exports.updateLink = async (req, res) => {
  try {
    var newUrl =
      typeof req.body.longUrl === "string" ? req.body.longUrl.trim() : "";

    if (!newUrl || newUrl.length > 2048 || !validUrl.isWebUri(newUrl)) {
      return res.status(400).json({ message: "A valid URL is required" });
    }
    if (!isSafeUrl(newUrl)) {
      return res
        .status(400)
        .json({ message: "Only http/https URLs are allowed" });
    }

    var link = await Link.findOne({
      _id: req.params.id,
      userId: req.session.userId,
    });
    if (!link) return res.status(404).json({ message: "Link not found" });

    // Admin-moderated links stay frozen
    if (link.deactivatedBy === "admin") {
      return res.status(403).json({
        message:
          "This link was disabled by an administrator and can't be edited",
      });
    }

    if (newUrl === link.longUrl) {
      return res
        .status(400)
        .json({ message: "That's already the current destination" });
    }

    // A link must not point at itself (redirect loop).
    if (isSelfReferencingShortLink(newUrl, link.shortCode)) {
      return res.status(400).json({ message: "A link can't point to itself" });
    }

    var safetyCheck = await checkUrlSafety(newUrl);
    if (safetyCheck.malicious) {
      return res.status(400).json({
        message: "This URL has been flagged as unsafe and cannot be used",
      });
    }
    if (safetyCheck.unavailable) {
      return res.status(503).json({
        message:
          "URL safety check is temporarily unavailable. Please try again later.",
      });
    }

    appendDestinationHistory(link, req.session.userId);
    link.longUrl = newUrl;
    await link.save();

    // The redirect engine caches the destination — drop it so the next visit uses the new one
    await clearShortCodeCache(redisClient, link);

    res.json({ message: "Destination updated", longUrl: link.longUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update link" });
  }
};

exports.restoreDestination = async (req, res) => {
  try {
    const body = req.body || {};
    const rawHistoryIndex = req.params.historyIndex;
    const historyIndex = Number(rawHistoryIndex);
    const expectedChangedAt = new Date(body.expectedChangedAt);
    if (
      typeof rawHistoryIndex !== "string" ||
      !/^\d{1,2}$/.test(rawHistoryIndex) ||
      !Number.isInteger(historyIndex) ||
      historyIndex < 0 ||
      typeof body.expectedUrl !== "string" ||
      typeof body.expectedChangedAt !== "string" ||
      Number.isNaN(expectedChangedAt.getTime())
    ) {
      return res.status(400).json({ message: "A valid history entry is required" });
    }

    const link = await Link.findOne({
      _id: req.params.id,
      userId: req.session.userId,
    });
    if (!link) return res.status(404).json({ message: "Link not found" });
    if (link.deactivatedBy === "admin") {
      return res.status(403).json({
        message: "This link was disabled by an administrator and can't be changed",
      });
    }

    const entry = link.destinationHistory[historyIndex];
    if (
      !entry ||
      entry.url !== body.expectedUrl ||
      new Date(entry.changedAt).getTime() !== expectedChangedAt.getTime()
    ) {
      return res.status(409).json({
        message: "This history entry is no longer available. Refresh the history and try again.",
      });
    }

    if (entry.url === link.longUrl) {
      return res.status(400).json({ message: "This destination is already current" });
    }

    const destinationUrl = entry.url;
    if (!validUrl.isWebUri(destinationUrl) || !isSafeUrl(destinationUrl)) {
      return res.status(400).json({ message: "This saved destination is no longer valid" });
    }
    if (isSelfReferencingShortLink(destinationUrl, link.shortCode)) {
      return res.status(400).json({ message: "A link can't point to itself" });
    }

    const safetyCheck = await checkUrlSafety(destinationUrl);
    if (safetyCheck.malicious) {
      return res.status(400).json({
        message: "This destination has been flagged as unsafe and can't be restored",
      });
    }
    if (safetyCheck.unavailable) {
      return res.status(503).json({
        message: "URL safety check is temporarily unavailable. Please try again later.",
      });
    }

    appendDestinationHistory(link, req.session.userId);
    link.longUrl = destinationUrl;
    await link.save();
    await clearShortCodeCache(redisClient, link);

    res.json({ message: "Destination restored", longUrl: link.longUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to restore destination" });
  }
};

exports.reactivateLink = async (req, res) => {
  try {
    const link = await Link.findOne({
      _id: req.params.id,
      userId: req.session.userId,
    });
    if (!link) return res.status(404).json({ message: "Link not found" });

    if (link.isActive) {
      return res.status(400).json({ message: "Link is already active" });
    }

    // Only links the user switched off themselves can be switched back on.
    // Admin-disabled (moderated) and legacy/expired links stay off.
    if (link.deactivatedBy !== "user") {
      return res.status(403).json({
        message:
          "This link can't be reactivated. Contact support if you think this is a mistake.",
      });
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return res
        .status(400)
        .json({ message: "This link has expired. Create a new link instead." });
    }

    // The destination may have become unsafe while the link was off
    const safetyCheck = await checkUrlSafety(link.longUrl);
    if (safetyCheck.malicious) {
      return res.status(400).json({
        message:
          "This URL has been flagged as unsafe and the link cannot be reactivated",
      });
    }
    if (safetyCheck.unavailable) {
      return res.status(503).json({
        message:
          "URL safety check is temporarily unavailable. Please try again later.",
      });
    }

    link.isActive = true;
    link.deactivatedBy = null;
    await link.save();
    await clearShortCodeCache(redisClient, link); // next visit repopulates the cache

    res.json({ message: "Link reactivated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to reactivate link" });
  }
};

exports.bulkDeleteLinks = async (req, res) => {
  try {
    var ids = req.body.ids;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No links selected" });
    }

    // Scope strictly to this user's own links — never trust IDs alone
    var result = await Link.updateMany(
      { _id: { $in: ids }, userId: req.session.userId, isActive: true },
      { $set: { isActive: false, deactivatedBy: "user" } },
    );

    // Clear Redis cache for each affected link so deactivation takes effect immediately
    var links = await Link.find({
      _id: { $in: ids },
      userId: req.session.userId,
    }).select("shortCode legacyShortCodes");
    var deletePromises = links.map(function (link) {
      return clearShortCodeCache(redisClient, link);
    });
    await Promise.all(deletePromises);

    res.json({ message: "Links deactivated", count: result.modifiedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Bulk delete failed" });
  }
};

exports.getMyTags = async (req, res) => {
  try {
    var tags = await Link.distinct("tags", { userId: req.session.userId });
    res.json({ tags: tags.sort() });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tags" });
  }
};
