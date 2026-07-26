const Link = require("../models/Link");
const ClickEvent = require("../models/ClickEvent");
const mongoose = require("mongoose");

exports.getLinkAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    // Accept either a Mongo _id or a shortCode in the same param
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id, userId: req.session.userId }
      : { shortCode: id, userId: req.session.userId };

    const link = await Link.findOne(query);
    if (!link) return res.status(404).json({ message: "Link not found" });

    const clicksOverTime = await ClickEvent.aggregate([
      { $match: { linkId: link._id } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const topReferrers = await ClickEvent.aggregate([
      { $match: { linkId: link._id } },
      { $group: { _id: "$referrer", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const deviceBreakdown = await ClickEvent.aggregate([
      { $match: { linkId: link._id } },
      { $group: { _id: "$device", count: { $sum: 1 } } },
    ]);

    const topCountries = await ClickEvent.aggregate([
      { $match: { linkId: link._id } },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      totalClicks: link.clickCount,
      clicksOverTime,
      topReferrers,
      deviceBreakdown,
      topCountries,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};

exports.getRawClickEvents = async (req, res) => {
  try {
    var mongoose = require("mongoose");
    var id = req.params.id;

    var query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id, userId: req.session.userId }
      : { shortCode: id, userId: req.session.userId };

    var link = await Link.findOne(query);
    if (!link) return res.status(404).json({ message: "Link not found" });

    var events = await ClickEvent.find({ linkId: link._id })
      .sort({ timestamp: -1 })
      .select("timestamp referrer device browser os country city -_id")
      .lean();

    res.json({ shortCode: link.shortCode, events: events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch click events" });
  }
};