const { createClient } = require("redis");

const redisClient = createClient({ url: process.env.REDIS_URL });

redisClient.on("error", (err) => console.error("Redis error:", err));
redisClient.on("connect", () => console.log("Redis connected"));

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("Redis connection failed:", err.message);
  }
})();

async function disconnectRedis() {
  if (redisClient.isOpen) await redisClient.quit();
}

module.exports = redisClient;
module.exports.disconnectRedis = disconnectRedis;
