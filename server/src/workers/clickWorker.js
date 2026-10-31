const INTERVAL_MS = 5000;
const { createClickWorker } = require("./clickWorkerCore");

function startClickWorker() {
  const redisClient = require("../config/redis");
  const ClickEvent = require("../models/ClickEvent");
  const Link = require("../models/Link");
  const worker = createClickWorker({ redisClient, ClickEvent, Link });

  const interval = setInterval(() => {
    worker.processBatch();
  }, INTERVAL_MS);
  worker.processBatch();
  console.log("Click worker started");

  return {
    stop: () => clearInterval(interval),
    drain: worker.drain,
  };
}

module.exports = { startClickWorker };
