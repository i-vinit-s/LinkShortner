const QRCode = require("qrcode");
const Link = require("../models/Link");

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

    var qrDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    res.json({ qrDataUrl: qrDataUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate QR code" });
  }
};