require("dotenv").config();
const app = require("./app");
const { connectDB, disconnectDB } = require("./config/db");
const redisClient = require("./config/redis");
const { validateEnvironment } = require("./config/env");
const { startClickWorker } = require("./workers/clickWorker");
const { startKeepAlive } = require("./utils/keepAlive");
const { startBanFlagSync } = require("./utils/seedBanFlags");

const PORT = process.env.PORT || 5000;

async function startServer() {
  validateEnvironment();
  await connectDB();

  const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  const clickWorker = startClickWorker();
  startBanFlagSync();
  if (process.env.NODE_ENV === "production") startKeepAlive();

  let shuttingDown = false;
  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}; shutting down gracefully`);
    clickWorker.stop();

    const forceClose = setTimeout(() => {
      console.error("Graceful shutdown timed out");
      process.exit(1);
    }, 10000);
    forceClose.unref();

    server.close(async () => {
      try {
        await clickWorker.drain();
        await disconnectDB();
        await redisClient.disconnectRedis();
        clearTimeout(forceClose);
        process.exit(0);
      } catch (err) {
        console.error("Shutdown failed:", err.message);
        process.exit(1);
      }
    });
  }

  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
}

startServer().catch((err) => {
  console.error("Server startup failed:", err.message);
  process.exit(1);
});
