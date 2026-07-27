const validUrl = require("valid-url");
const bcrypt = require("bcryptjs");
const Link = require("../models/Link");
const redisClient = require("../config/redis");
const { encode } = require("../utils/base62");
const { getNextCounter } = require("../utils/counter");
const { isUrlMalicious } = require("../utils/safeBrowsing");

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

exports.createLink = async (req, res) => {
  try {
    var longUrl = req.body.longUrl;
    var customAlias = req.body.customAlias;
    var expiresAt = req.body.expiresAt;
    var password = req.body.password;
    var tags = req.body.tags;

    if (!longUrl || !validUrl.isWebUri(longUrl)) {
      return res.status(400).json({ message: "A valid URL is required" });
    }

    if (!isSafeUrl(longUrl)) {
      return res
        .status(400)
        .json({ message: "Only http/https URLs are allowed" });
    }

    // Normalize tags: trim, lowercase, dedupe, cap length and count
    var cleanTags = [];
    if (Array.isArray(tags)) {
      var seen = {};
      for (var i = 0; i < tags.length; i++) {
        var t = String(tags[i]).trim().toLowerCase().slice(0, 20);
        if (t !== "" && !seen[t]) {
          seen[t] = true;
          cleanTags.push(t);
        }
        if (cleanTags.length >= 5) break; // cap at 5 tags per link
      }
    }

    const malicious = await isUrlMalicious(longUrl);
    if (malicious) {
      return res.status(400).json({
        message: "This URL has been flagged as unsafe and cannot be shortened",
      });
    }

    let shortCode;

    if (customAlias) {
      const alias = customAlias.trim();
      if (!/^[a-zA-Z0-9_-]{3,20}$/.test(alias)) {
        return res.status(400).json({
          message: "Alias must be 3-20 chars, letters/numbers/-/_ only",
        });
      }
      if (RESERVED_ALIASES.includes(alias.toLowerCase())) {
        return res.status(400).json({ message: "This alias is reserved" });
      }
      const exists = await Link.findOne({ shortCode: alias });
      if (exists) {
        return res.status(409).json({ message: "Alias already taken" });
      }
      shortCode = alias;
    } else {
      const counter = await getNextCounter();
      shortCode = encode(counter);
    }

    var linkData = {
      shortCode: shortCode,
      longUrl: longUrl,
      customAlias: !!customAlias,
      userId: req.session.userId || null,
      expiresAt: expiresAt || null,
      tags: cleanTags,
    };

    if (password) {
      linkData.passwordHash = await bcrypt.hash(password, 10);
    }

    const link = await Link.create(linkData);

    // Warm the Redis cache immediately so the very first redirect is also fast
    const cacheValue = JSON.stringify({
      longUrl: link.longUrl,
      hasPassword: !!link.passwordHash,
      isActive: link.isActive,
    });

    if (link.expiresAt) {
      const ttlSeconds = Math.floor(
        (new Date(link.expiresAt) - Date.now()) / 1000,
      );
      if (ttlSeconds > 0)
        await redisClient.setEx(`short:${shortCode}`, ttlSeconds, cacheValue);
    } else {
      await redisClient.set(`short:${shortCode}`, cacheValue);
    }

    res.status(201).json({ link });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create link" });
  }
};

exports.getMyLinks = async (req, res) => {
  try {
    const links = await Link.find({ userId: req.session.userId }).sort({
      createdAt: -1,
    });
    res.json({ links });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch links" });
  }
};

exports.deleteLink = async (req, res) => {
  try {
    const link = await Link.findOne({
      _id: req.params.id,
      userId: req.session.userId,
    });
    if (!link) return res.status(404).json({ message: "Link not found" });

    link.isActive = false; // soft delete — keeps analytics history intact
    await link.save();
    await redisClient.del(`short:${link.shortCode}`);

    res.json({ message: "Link deactivated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete link" });
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
      { _id: { $in: ids }, userId: req.session.userId },
      { $set: { isActive: false } },
    );

    // Clear Redis cache for each affected link so deactivation takes effect immediately
    var links = await Link.find({
      _id: { $in: ids },
      userId: req.session.userId,
    }).select("shortCode");
    var deletePromises = links.map(function (link) {
      return redisClient.del("short:" + link.shortCode);
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