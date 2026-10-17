const validator = require("validator");
const Report = require("../models/Report");
const Link = require("../models/Link");

exports.submitReport = async (req, res) => {
  try {
    var shortCodeOrUrl = (req.body.shortCodeOrUrl || "").trim();
    var reason = (req.body.reason || "").trim();
    var reporterEmail = (req.body.reporterEmail || "").trim();

    if (!shortCodeOrUrl || !reason) {
      return res
        .status(400)
        .json({ message: "Please provide the link and a reason" });
    }

    if (reason.length > 1000) {
      return res.status(400).json({ message: "Reason is too long" });
    }

    if (reporterEmail && !validator.isEmail(reporterEmail)) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email or leave it blank" });
    }

    // Try to extract a short code from whatever was submitted (a bare code, or a full short URL)
    var match = shortCodeOrUrl.match(/\/([A-Za-z0-9_-]+)\/?$/);
    var candidateCode = match ? match[1] : shortCodeOrUrl;

    var link = await Link.findOne({ shortCode: candidateCode });

    if (!link) {
      return res.status(404).json({
        message:
          "We couldn't find a link matching that code or URL. Please double-check and try again.",
      });
    }

    await Report.create({
      shortCodeOrUrl: shortCodeOrUrl,
      reason: reason,
      reporterEmail: reporterEmail || null,
      linkId: link._id, // now we can reference the real link directly
    });

    res
      .status(201)
      .json({
        message:
          "Report submitted. Thank you for helping keep the service safe.",
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit report" });
  }
};