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
