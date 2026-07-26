const redisClient = require("../config/redis");
const ClickEvent = require("../models/ClickEvent");
const Link = require("../models/Link");

const BATCH_SIZE = 100;
const INTERVAL_MS = 5000; // drain every 5 seconds

async function processBatch() {
  try {
    // Pull up to BATCH_SIZE items off the front of the queue
    const events = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
      const raw = await redisClient.lPop("click:queue");
      if (!raw) break;
      events.push(JSON.parse(raw));
    }

    if (events.length === 0) return;

    // We need each event's linkId — look up shortCode → linkId in bulk
    const shortCodes = [...new Set(events.map((e) => e.shortCode))];
    const links = await Link.find({ shortCode: { $in: shortCodes } }).select(
      "_id shortCode",
    );
    const linkMap = new Map(links.map((l) => [l.shortCode, l._id]));

    const docs = events
      .filter((e) => linkMap.has(e.shortCode))
      .map((e) => ({
        linkId: linkMap.get(e.shortCode),
        shortCode: e.shortCode,
        timestamp: new Date(e.timestamp),
        referrer: e.referrer,
        device: e.device,
        browser: e.browser,
        os: e.os,
        country: e.country,
        city: e.city,
      }));

    if (docs.length > 0) {
      await ClickEvent.insertMany(docs, { ordered: false });

      // Update the rough clickCount on each Link too (bulk operation, not per-click)
      const counts = {};
      docs.forEach((d) => {
        counts[d.shortCode] = (counts[d.shortCode] || 0) + 1;
      });

      const bulkOps = Object.entries(counts).map(([shortCode, count]) => ({
        updateOne: {
          filter: { shortCode },
          update: { $inc: { clickCount: count } },
        },
      }));

      if (bulkOps.length > 0) await Link.bulkWrite(bulkOps);
    }

    console.log(`Processed ${docs.length} click events`);
  } catch (err) {
    console.error("Click worker batch failed:", err);
  }
}

function startClickWorker() {
  setInterval(processBatch, INTERVAL_MS);
  console.log("Click worker started");
}

module.exports = { startClickWorker };
