const mongoose = require("mongoose");
const User = require("../models/User");
const Link = require("../models/Link");
const BioPage = require("../models/BioPage");
const Report = require("../models/Report");
const ClickEvent = require("../models/ClickEvent");
const redisClient = require("../config/redis");

// --- Dashboard summary ---
exports.getStats = async function (req, res) {
  try {
    var totalUsers = await User.countDocuments();
    var totalLinks = await Link.countDocuments();
    var activeLinks = await Link.countDocuments({ isActive: true });
    var pendingReports = await Report.countDocuments({ status: "pending" });
    var totalClicks = await ClickEvent.countDocuments();

    res.json({
      totalUsers: totalUsers,
      totalLinks: totalLinks,
      activeLinks: activeLinks,
      pendingReports: pendingReports,
      totalClicks: totalClicks,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};

// --- Users ---
exports.listUsers = async function (req, res) {
  try {
    var page = parseInt(req.query.page, 10) || 1;
    var limit = 20;
    var search = (req.query.search || "").trim();

    var filter = {};
    if (search) {
      filter = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
    }

    var users = await User.find(filter)
      .select("-password -otpHash")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    var total = await User.countDocuments(filter);

    res.json({
      users: users,
      total: total,
      page: page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

exports.toggleUserBan = async function (req, res) {
  try {
    var user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isAdmin) {
      return res.status(400).json({ message: "Cannot ban an admin account" });
    }

    user.verified = !user.verified; // reuse `verified` as an on/off gate: unverifying locks them out of login
    await user.save();

    res.json({
      message: user.verified ? "User reinstated" : "User banned",
      verified: user.verified,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update user" });
  }
};

// --- Links ---
exports.listAllLinks = async function (req, res) {
  try {
    var page = parseInt(req.query.page, 10) || 1;
    var limit = 20;
    var search = (req.query.search || "").trim();

    var filter = {};
    if (search) {
      filter = {
        $or: [
          { shortCode: { $regex: search, $options: "i" } },
          { longUrl: { $regex: search, $options: "i" } },
        ],
      };
    }

    var links = await Link.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    var total = await Link.countDocuments(filter);

    res.json({
      links: links,
      total: total,
      page: page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch links" });
  }
};

exports.adminDeactivateLink = async function (req, res) {
  try {
    var link = await Link.findById(req.params.id);
    if (!link) return res.status(404).json({ message: "Link not found" });

    link.isActive = !link.isActive;
    await link.save();
    await redisClient.del("short:" + link.shortCode);

    res.json({
      message: link.isActive ? "Link reactivated" : "Link deactivated",
      isActive: link.isActive,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update link" });
  }
};

// --- Reports ---
exports.listReports = async function (req, res) {
  try {
    var status = req.query.status || "all";
    var filter = status === "all" ? {} : { status: status };

    var reports = await Report.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ reports: reports });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch reports" });
  }
};

exports.actionReport = async function (req, res) {
  try {
    var report = await Report.findById(req.params.id).populate("linkId");
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (report.linkId) {
      report.linkId.isActive = false;
      await report.linkId.save();
      await redisClient.del("short:" + report.linkId.shortCode);
    }

    report.status = "actioned";
    await report.save();

    res.json({ message: "Link deactivated and report actioned" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to action report" });
  }
};

exports.dismissReport = async function (req, res) {
  try {
    var report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    report.status = "reviewed";
    await report.save();

    res.json({ message: "Report dismissed" });
  } catch (err) {
    res.status(500).json({ message: "Failed to dismiss report" });
  }
};

exports.listBioPages = async function (req, res) {
  try {
    var page = parseInt(req.query.page, 10) || 1;
    var limit = 20;
    var search = (req.query.search || "").trim();

    var filter = {};
    if (search) {
      filter = { slug: { $regex: search, $options: "i" } };
    }

    var pages = await BioPage.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    var total = await BioPage.countDocuments(filter);

    res.json({
      pages: pages,
      total: total,
      page: page,
      pages_count: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch bio pages" });
  }
};

exports.toggleBioPagePublish = async function (req, res) {
  try {
    var page = await BioPage.findById(req.params.id);
    if (!page) return res.status(404).json({ message: "Page not found" });

    page.isPublished = !page.isPublished;
    await page.save();

    res.json({
      message: page.isPublished ? "Page published" : "Page unpublished",
      isPublished: page.isPublished,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update page" });
  }
};

exports.adminDeleteBioPage = async function (req, res) {
  try {
    var result = await BioPage.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Page not found" });
    }
    res.json({ message: "Page deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete page" });
  }
};