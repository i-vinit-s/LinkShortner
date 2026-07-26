const redisClient = require("../config/redis");

async function getNextCounter() {
  // Redis INCR is atomic — safe even with concurrent requests
  const count = await redisClient.incr("link:counter");
  return count;
}

module.exports = { getNextCounter };
