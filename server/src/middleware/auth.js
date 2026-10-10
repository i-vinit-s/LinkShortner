const redisClient = require("../config/redis");

exports.requireAuth = async function (req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    // O(1) Redis check — set by admin when banning a user
    var isBanned = await redisClient.get("banned:" + req.session.userId);
    if (isBanned) {
      // Destroy their session immediately so the cookie is invalidated
      req.session.destroy(function () {});
      res.clearCookie("connect.sid");
      return res
        .status(403)
        .json({ message: "Your account has been suspended" });
    }
  } catch (err) {
    // If Redis is down, fall through — don't block all authed requests
    console.error("Ban check failed:", err.message);
  }

  next();
};
