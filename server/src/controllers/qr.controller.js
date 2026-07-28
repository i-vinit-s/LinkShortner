const QRCode = require("qrcode");
const Link = require("../models/Link");
const redisClient = require("../config/redis");
const { encode } = require("../utils/base62");
const { getNextCounter } = require("../utils/counter");

exports.getQrCode = async (req, res) => {
  try {
    const { id } = req.params;
    const link = await Link.findOne({ _id: id, userId: req.session.userId });

    if (!link) return res.status(404).json({ message: "Link not found" });

    // CLIENT_URL must be your frontend's domain, not the API's — this is what was wrong
    const shortUrl = process.env.CLIENT_URL + "/" + link.shortCode;

    const qrDataUrl = await QRCode.toDataURL(shortUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    res.json({ qrDataUrl, shortUrl, shortCode: link.shortCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate QR code" });
  }
};

const validUrl = require("valid-url");

function isSafeUrl(url) {
  try {
    var parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (err) {
    return false;
  }
}

exports.generateQrFromUrl = async (req, res) => {
  try {
    var url = (req.body.url || "").trim();

    if (!url || !validUrl.isWebUri(url)) {
      return res.status(400).json({ message: "A valid URL is required" });
    }
    if (!isSafeUrl(url)) {
      return res
        .status(400)
        .json({ message: "Only http/https URLs are allowed" });
    }

    var isAuthenticated = !!req.session.userId;

    if (!isAuthenticated) {
      // Anonymous: stateless, no link record, no analytics — just a QR of the raw URL
      var rawQrDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
      return res.json({ qrDataUrl: rawQrDataUrl, persisted: false });
    }

    // Authenticated: create a real short link so this QR gets full click analytics for free
    var shortCode = encode(await getNextCounter());
    var link = await Link.create({
      shortCode: shortCode,
      longUrl: url,
      userId: req.session.userId,
      source: "qr",
    });

    var shortUrl = process.env.CLIENT_URL + "/" + link.shortCode;

    var cacheValue = JSON.stringify({
      longUrl: link.longUrl,
      hasPassword: false,
      isActive: true,
    });
    await redisClient.set("short:" + shortCode, cacheValue);

    var qrDataUrl = await QRCode.toDataURL(shortUrl, {
      width: 300,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });

    res.json({
      qrDataUrl: qrDataUrl,
      shortUrl: shortUrl,
      shortCode: link.shortCode,
      linkId: link._id,
      persisted: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate QR code" });
  }
};