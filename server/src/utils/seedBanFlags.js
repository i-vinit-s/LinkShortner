const User = require("../models/User");
const redisClient = require("../config/redis");

// Re-creates banned:<userId> flags from MongoDB (the source of truth).
// Covers flags lost to eviction, a Redis outage during a ban, or a restore.
// Safe to run repeatedly: it only sets keys, never removes them.
async function seedBanFlags() {
  try {
    if (!redisClient.isReady) {
      await new Promise(function (resolve) {
        redisClient.once("ready", resolve);
      });
    }

    var banned = await User.find({ isBanned: true }).select("_id").lean();
    await Promise.all(
      banned.map(function (u) {
        return redisClient.set("banned:" + u._id, "1");
      }),
    );

    if (banned.length > 0) {
      console.log(
        "[ban-flags] restored " + banned.length + " flag(s) from MongoDB",
      );
    }
  } catch (err) {
    console.error("[ban-flags] seeding failed:", err.message);
  }
}

// Run once at startup and again every time Redis reconnects
function startBanFlagSync() {
  seedBanFlags();
  redisClient.on("ready", seedBanFlags);
}

module.exports = { startBanFlagSync };
