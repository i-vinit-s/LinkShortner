const validator = require("validator");
const Report = require("../models/Report");
const Link = require("../models/Link");
const redisClient = require("../config/redis");

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

// Admin-only: list pending reports (protect this behind your own admin check later)
exports.listReports = async (req, res) => {
  try {
    var reports = await Report.find().sort({ createdAt: -1 }).limit(100);
    res.json({ reports: reports });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reports" });
  }
};

// Admin-only: deactivate the reported link and mark the report actioned
exports.actionReport = async (req, res) => {
  try {
    var report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    // Try to extract a short code if a full URL was submitted
    var candidate = report.shortCodeOrUrl;
    var match = candidate.match(/\/([A-Za-z0-9_-]+)\/?$/);
    var shortCode = match ? match[1] : candidate;

    var link = await Link.findOne({ shortCode: shortCode });
    if (link) {
      link.isActive = false;
      await link.save();
      await redisClient.del("short:" + shortCode);
    }

    report.status = "actioned";
    await report.save();

    res.json({ message: "Link deactivated and report marked actioned" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to action report" });
  }
};
