const Link = require("../models/Link");
const redisClient = require("../config/redis");
const UAParser = require("ua-parser-js");
const geoip = require("geoip-lite");

// Called by the frontend page — returns JSON instead of doing a raw redirect
exports.resolveLink = async (req, res) => {
  try {
    const { shortCode } = req.params;

    let linkData;
    const cached = await redisClient.get("short:" + shortCode);

    if (cached) {
      linkData = JSON.parse(cached);
    } else {
      const link = await Link.findOne({ shortCode, isActive: true });
      if (!link) return res.status(404).json({ message: "Link not found" });

      // Check expiration explicitly — don't rely solely on Redis TTL eviction
      if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        link.isActive = false;
        await link.save(); // lazily deactivate so future queries short-circuit immediately
        return res
          .status(410)
          .json({ message: "This link has expired", expired: true });
      }

      linkData = {
        longUrl: link.longUrl,
        hasPassword: !!link.passwordHash,
        isActive: link.isActive,
      };

      if (link.expiresAt) {
        const ttlSeconds = Math.floor(
          (new Date(link.expiresAt) - Date.now()) / 1000,
        );
        if (ttlSeconds > 0) {
          await redisClient.setEx(
            "short:" + shortCode,
            ttlSeconds,
            JSON.stringify(linkData),
          );
        }
      } else {
        await redisClient.set("short:" + shortCode, JSON.stringify(linkData));
      }
    }

    if (!linkData.isActive) {
      return res
        .status(410)
        .json({ message: "This link has been deactivated" });
    }

    if (linkData.hasPassword) {
      return res.json({ requiresPassword: true });
    }

    trackClick(shortCode, req).catch(function (err) {
      console.error("Click tracking failed:", err);
    });

    return res.json({ longUrl: linkData.longUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to resolve link" });
  }
};

// Called by the frontend when the user submits the password
exports.verifyLinkPassword = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const { password } = req.body;

    if (!password)
      return res.status(400).json({ message: "Password is required" });

    const link = await Link.findOne({ shortCode, isActive: true });
    if (!link) return res.status(404).json({ message: "Link not found" });
    if (!link.passwordHash)
      return res
        .status(400)
        .json({ message: "This link is not password protected" });

    const match = await link.comparePassword(password);
    if (!match) return res.status(403).json({ message: "Incorrect password" });

    trackClick(shortCode, req).catch(function (err) {
      console.error("Click tracking failed:", err);
    });

    return res.json({ longUrl: link.longUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Verification failed" });
  }
};

async function trackClick(shortCode, req) {
  await redisClient.incr("clicks:" + shortCode);

  const ua = new UAParser(req.headers["user-agent"]);
  const parsed = ua.getResult();

  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "")
    .split(",")[0]
    .trim()
    .replace("::ffff:", "");

  const geo = geoip.lookup(ip);

  const event = {
    shortCode,
    timestamp: Date.now(),
    referrer: req.headers.referer || "direct",
    device: parsed.device.type || "desktop",
    browser: parsed.browser.name || "unknown",
    os: parsed.os.name || "unknown",
    country: geo && geo.country ? geo.country : "unknown",
    city: geo && geo.city ? geo.city : "unknown",
  };

  await redisClient.rPush("click:queue", JSON.stringify(event));
}
