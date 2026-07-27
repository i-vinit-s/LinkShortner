const User = require("../models/User");

exports.requireAdmin = async function (req, res, next) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    var user = await User.findById(req.session.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.adminUser = user; // available downstream if needed
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to verify admin access" });
  }
};
