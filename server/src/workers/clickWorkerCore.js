const crypto = require("crypto");

const BATCH_SIZE = 100;
const MAX_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;

const PROMOTE_DUE_RETRIES = `
  local jobs = redis.call('ZRANGEBYSCORE', KEYS[1], '-inf', ARGV[1], 'LIMIT', 0, ARGV[2])
  for _, job in ipairs(jobs) do
    if redis.call('ZREM', KEYS[1], job) == 1 then
      redis.call('RPUSH', KEYS[2], job)
    end
  end
  return #jobs
`;

function getBackoffMs(attempt) {
  const exponent = Math.max(0, Math.floor(attempt) - 1);
  return Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** exponent);
}

function normalizeEvent(raw) {
  const event = JSON.parse(raw);
  if (!event._id) {
    // Legacy queue entries get a stable ID, so replay after a crash is idempotent.
    event._id = crypto.createHash("sha256").update(raw).digest("hex").slice(0, 24);
  }
  return event;
}

function retryPayload(event, attempt, now) {
  const next = { ...event, attempts: attempt };
  const delayMs = getBackoffMs(attempt);
  next.nextAttemptAt = now + delayMs;
  return { event: next, raw: JSON.stringify(next), delayMs };
}

function createClickWorker({
  redisClient,
  ClickEvent,
  Link,
  logger = console,
  now = Date.now,
  prefix = "click",
}) {
  const QUEUE_KEY = `${prefix}:queue`;
  const PROCESSING_KEY = `${prefix}:processing`;
  const RETRY_KEY = `${prefix}:retry`;
  const DEAD_LETTER_KEY = `${prefix}:dead-letter`;
  const METRICS_KEY = `${prefix}:worker:metrics`;
  let processing = false;
  let recovered = false;

  async function incrementMetric(name, amount = 1) {
    try {
      await redisClient.hIncrBy(METRICS_KEY, name, amount);
    } catch (err) {
      logger.error("Click worker metric update failed:", err.message);
    }
  }

  async function setMetric(name, value) {
    try {
      await redisClient.hSet(METRICS_KEY, name, String(value));
    } catch (err) {
      logger.error("Click worker metric update failed:", err.message);
    }
  }

  async function recoverProcessingQueue() {
    let recoveredCount = 0;
    while (
      await redisClient.lMove(
        PROCESSING_KEY,
        QUEUE_KEY,
        "LEFT",
        "RIGHT",
      )
    ) {
      recoveredCount += 1;
    }
    if (recoveredCount > 0) {
      logger.warn(`Recovered ${recoveredCount} unacknowledged click events`);
    }
    return recoveredCount;
  }

  async function promoteDueRetries() {
    return redisClient.eval(PROMOTE_DUE_RETRIES, {
      keys: [RETRY_KEY, QUEUE_KEY],
      arguments: [String(now()), String(BATCH_SIZE)],
    });
  }

  async function moveFailedEvents(rawEvents, err) {
    for (const raw of rawEvents) {
      let event;
      try {
        event = normalizeEvent(raw);
      } catch {
        await redisClient.rPush(
          DEAD_LETTER_KEY,
          JSON.stringify({
            raw,
            attempts: MAX_ATTEMPTS,
            deadLetteredAt: new Date(now()).toISOString(),
            reason: "Invalid JSON click event",
          }),
        );
        await redisClient.lRem(PROCESSING_KEY, 1, raw);
        await incrementMetric("deadLetterEvents");
        continue;
      }

      const attempts = (Number(event.attempts) || 0) + 1;
      if (attempts >= MAX_ATTEMPTS) {
        const deadEvent = {
          ...event,
          attempts,
          deadLetteredAt: new Date(now()).toISOString(),
          lastError: String(err.message || err).slice(0, 300),
        };
        await redisClient.rPush(DEAD_LETTER_KEY, JSON.stringify(deadEvent));
        await redisClient.lRem(PROCESSING_KEY, 1, raw);
        await incrementMetric("deadLetterEvents");
        logger.error(`Moved click event ${event._id} to the dead-letter queue`);
      } else {
        const retry = retryPayload(event, attempts, now());
        // Schedule before acknowledging the processing entry: a Redis failure
        // leaves at least one durable copy available for recovery.
        await redisClient.zAdd(RETRY_KEY, {
          score: retry.event.nextAttemptAt,
          value: retry.raw,
        });
        await redisClient.lRem(PROCESSING_KEY, 1, raw);
        await incrementMetric("retriedEvents");
      }
    }
  }

  async function processBatch() {
    if (processing) return { processed: 0, skipped: true };
    processing = true;
    const rawEvents = [];
    const startedAt = now();

    try {
      if (!recovered) {
        await recoverProcessingQueue();
        recovered = true;
      }
      await promoteDueRetries();

      for (let i = 0; i < BATCH_SIZE; i += 1) {
        const raw = await redisClient.lMove(
          QUEUE_KEY,
          PROCESSING_KEY,
          "LEFT",
          "RIGHT",
        );
        if (!raw) break;
        rawEvents.push(raw);
      }

      if (rawEvents.length === 0) return { processed: 0 };

      const events = rawEvents.map(normalizeEvent);
      const shortCodes = [...new Set(events.map((event) => event.shortCode))];
      const links = await Link.find({ shortCode: { $in: shortCodes } }).select(
        "_id shortCode",
      );
      const linkMap = new Map(links.map((link) => [link.shortCode, link._id]));

      const docs = events
        .filter((event) => linkMap.has(event.shortCode))
        .map((event) => ({
          _id: event._id,
          linkId: linkMap.get(event.shortCode),
          shortCode: event.shortCode,
          timestamp: new Date(event.timestamp),
          referrer: event.referrer,
          device: event.device,
          browser: event.browser,
          os: event.os,
          country: event.country,
          city: event.city,
        }));

      let insertedDocs = [];
      let insertedCount = 0;
      if (docs.length > 0) {
        const result = await ClickEvent.bulkWrite(
          docs.map((doc) => ({
            updateOne: {
              filter: { _id: doc._id },
              update: { $setOnInsert: doc },
              upsert: true,
            },
          })),
          { ordered: false },
        );
        insertedCount = result.upsertedCount || 0;

        // Recompute affected link counters from the durable event collection.
        // This is idempotent if a process crashes after event writes but before
        // updating the link documents, then replays the processing-list batch.
        const affectedLinkIds = [
          ...new Map(docs.map((doc) => [String(doc.linkId), doc.linkId])).values(),
        ];
        const totals = await ClickEvent.aggregate([
          { $match: { linkId: { $in: affectedLinkIds } } },
          { $group: { _id: "$linkId", count: { $sum: 1 } } },
        ]);
        const totalsByLink = new Map(
          totals.map((total) => [String(total._id), total.count]),
        );
        const countOps = affectedLinkIds.map((linkId) => ({
          updateOne: {
            filter: { _id: linkId },
            update: { $set: { clickCount: totalsByLink.get(String(linkId)) || 0 } },
          },
        }));
        await Link.bulkWrite(countOps);
      }

      for (const raw of rawEvents) {
        await redisClient.lRem(PROCESSING_KEY, 1, raw);
      }

      await incrementMetric("processedBatches");
      await incrementMetric("processedEvents", events.length);
      await incrementMetric("insertedEvents", insertedCount);
      if (events.length > docs.length) {
        await incrementMetric("orphanEvents", events.length - docs.length);
      }
      await setMetric("lastSuccessAt", new Date(now()).toISOString());
      await setMetric("lastBatchDurationMs", now() - startedAt);
      logger.log(`Processed ${docs.length} click events`);
      return { processed: docs.length, inserted: insertedCount };
    } catch (err) {
      await incrementMetric("failedBatches");
      await setMetric("lastFailureAt", new Date(now()).toISOString());
      logger.error("Click worker batch failed:", err);
      if (rawEvents.length > 0) {
        try {
          await moveFailedEvents(rawEvents, err);
        } catch (retryError) {
          // Leave unacknowledged entries in click:processing for startup recovery.
          logger.error("Could not schedule click retries:", retryError);
        }
      }
      return { processed: 0, failed: true };
    } finally {
      processing = false;
    }
  }

  async function drain() {
    while (processing) await new Promise((resolve) => setTimeout(resolve, 50));
    await recoverProcessingQueue();
    recovered = true;
    while (true) {
      while (processing) await new Promise((resolve) => setTimeout(resolve, 50));
      if ((await redisClient.lLen(QUEUE_KEY)) === 0) break;
      await processBatch();
    }
  }

  return { processBatch, recoverProcessingQueue, drain };
}

module.exports = {
  BATCH_SIZE,
  MAX_ATTEMPTS,
  BASE_BACKOFF_MS,
  MAX_BACKOFF_MS,
  getBackoffMs,
  normalizeEvent,
  retryPayload,
  createClickWorker,
};
