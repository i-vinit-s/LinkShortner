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

exports.createLink = async (req, res) => {
  try {
    const { longUrl, customAlias, expiresAt, password } = req.body;

    if (!longUrl || !validUrl.isWebUri(longUrl)) {
      return res.status(400).json({ message: "A valid URL is required" });
    }

    const malicious = await isUrlMalicious(longUrl);
    if (malicious) {
      return res
        .status(400)
        .json({
          message:
            "This URL has been flagged as unsafe and cannot be shortened",
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

    const linkData = {
      shortCode,
      longUrl,
      customAlias: !!customAlias,
      userId: req.session.userId || null,
      expiresAt: expiresAt || null,
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
