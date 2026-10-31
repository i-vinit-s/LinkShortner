const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createClickWorker,
  getBackoffMs,
  normalizeEvent,
  retryPayload,
} = require("../src/workers/clickWorkerCore");

class FakeRedis {
  constructor({ queue = [], processing = [] } = {}) {
    this.lists = {
      "click:queue": queue.slice(),
      "click:processing": processing.slice(),
      "click:dead-letter": [],
    };
    this.sorted = { "click:retry": [] };
    this.hashes = { "click:worker:metrics": {} };
  }

  async lMove(source, destination, sourceSide, destinationSide) {
    const value = sourceSide === "LEFT" ? this.lists[source].shift() : this.lists[source].pop();
    if (value === undefined) return null;
    if (destinationSide === "LEFT") this.lists[destination].unshift(value);
    else this.lists[destination].push(value);
    return value;
  }

  async lRem(key, count, value) {
    let removed = 0;
    this.lists[key] = this.lists[key].filter((item) => {
      if (item === value && (count === 0 || removed < count)) {
        removed += 1;
        return false;
      }
      return true;
    });
    return removed;
  }

  async lLen(key) {
    return this.lists[key].length;
  }

  async rPush(key, value) {
    this.lists[key].push(value);
    return this.lists[key].length;
  }

  async zAdd(key, item) {
    this.sorted[key].push(item);
    this.sorted[key].sort((a, b) => a.score - b.score);
    return 1;
  }

  async zCard(key) {
    return this.sorted[key].length;
  }

  async eval(_script, { keys, arguments: args }) {
    const [source, destination] = keys;
    const now = Number(args[0]);
    const limit = Number(args[1]);
    const due = this.sorted[source].filter((item) => item.score <= now).slice(0, limit);
    this.sorted[source] = this.sorted[source].filter((item) => !due.includes(item));
    for (const item of due) this.lists[destination].push(item.value);
    return due.length;
  }

  async hIncrBy(key, field, amount) {
    this.hashes[key][field] = Number(this.hashes[key][field] || 0) + amount;
    return this.hashes[key][field];
  }

  async hSet(key, field, value) {
    this.hashes[key][field] = value;
    return 1;
  }

  async hGetAll(key) {
    return { ...this.hashes[key] };
  }
}

function makeEvent(overrides = {}) {
  return {
    _id: "000000000000000000000001",
    shortCode: "audit",
    timestamp: Date.now(),
    referrer: "direct",
    device: "desktop",
    browser: "test",
    os: "test",
    country: "unknown",
    city: "unknown",
    ...overrides,
  };
}

function makeDependencies(redis, { failBulkWrite = false } = {}) {
  const inserted = [];
  const linkUpdates = [];
  const link = { shortCode: "audit", _id: "link-id" };
  return {
    redisClient: redis,
    ClickEvent: {
      aggregate: async () => [{ _id: "link-id", count: 1 }],
      bulkWrite: async (ops) => {
        if (failBulkWrite) throw new Error("Mongo unavailable");
        for (let i = 0; i < ops.length; i += 1) {
          inserted.push(ops[i].updateOne.update.$setOnInsert);
        }
        return { upsertedCount: ops.length, upsertedIds: Object.fromEntries(ops.map((_, i) => [i, `id-${i}`])) };
      },
    },
    Link: {
      find: () => ({ select: async () => [link] }),
      bulkWrite: async (ops) => linkUpdates.push(...ops),
    },
    inserted,
    linkUpdates,
  };
}

test("click event IDs stay stable and retries use capped exponential backoff", () => {
  const raw = JSON.stringify({ shortCode: "legacy", timestamp: 1 });
  assert.equal(normalizeEvent(raw)._id, normalizeEvent(raw)._id);
  assert.equal(getBackoffMs(1), 1000);
  assert.equal(getBackoffMs(2), 2000);
  assert.equal(getBackoffMs(99), 30000);

  const retry = retryPayload(makeEvent(), 3, 5000);
  assert.equal(retry.delayMs, 4000);
  assert.equal(JSON.parse(retry.raw).nextAttemptAt, 9000);
});

test("worker acknowledges events only after persistence and link-count updates", async () => {
  const raw = JSON.stringify(makeEvent());
  const redis = new FakeRedis({ queue: [raw] });
  const deps = makeDependencies(redis);
  const worker = createClickWorker({ ...deps, logger: { log() {}, warn() {}, error() {} } });

  const result = await worker.processBatch();

  assert.deepEqual(result, { processed: 1, inserted: 1 });
  assert.equal(deps.inserted.length, 1);
  assert.equal(deps.linkUpdates.length, 1);
  assert.deepEqual(deps.linkUpdates[0].updateOne.update.$set, { clickCount: 1 });
  assert.equal(await redis.lLen("click:queue"), 0);
  assert.equal(await redis.lLen("click:processing"), 0);
  assert.equal((await redis.hGetAll("click:worker:metrics")).processedEvents, 1);
});

test("failed batches are retained with delayed retries and failure metrics", async () => {
  const raw = JSON.stringify(makeEvent());
  const redis = new FakeRedis({ queue: [raw] });
  const deps = makeDependencies(redis, { failBulkWrite: true });
  const worker = createClickWorker({
    ...deps,
    now: () => 10000,
    logger: { log() {}, warn() {}, error() {} },
  });

  const result = await worker.processBatch();

  assert.equal(result.failed, true);
  assert.equal(await redis.lLen("click:processing"), 0);
  assert.equal(await redis.zCard("click:retry"), 1);
  assert.equal(redis.sorted["click:retry"][0].score, 11000);
  assert.equal((await redis.hGetAll("click:worker:metrics")).failedBatches, 1);
});

test("due retries are promoted and processed only after their backoff expires", async () => {
  let now = 10000;
  let failOnce = true;
  const redis = new FakeRedis({ queue: [JSON.stringify(makeEvent())] });
  const deps = makeDependencies(redis);
  deps.ClickEvent.bulkWrite = async (ops) => {
    if (failOnce) {
      failOnce = false;
      throw new Error("temporary database failure");
    }
    return {
      upsertedCount: ops.length,
      upsertedIds: Object.fromEntries(ops.map((_, index) => [index, `id-${index}`])),
    };
  };
  const worker = createClickWorker({
    ...deps,
    now: () => now,
    logger: { log() {}, warn() {}, error() {} },
  });

  await worker.processBatch();
  now = 10999;
  assert.deepEqual(await worker.processBatch(), { processed: 0 });
  assert.equal(await redis.lLen("click:queue"), 0);
  assert.equal(await redis.zCard("click:retry"), 1);

  now = 11000;
  const result = await worker.processBatch();
  assert.equal(result.inserted, 1);
  assert.equal(await redis.zCard("click:retry"), 0);
  assert.equal(await redis.lLen("click:processing"), 0);
});

test("processing-list entries are recovered and poison events reach the dead-letter queue", async () => {
  const processingRaw = JSON.stringify(makeEvent());
  const redis = new FakeRedis({ processing: [processingRaw] });
  const deps = makeDependencies(redis);
  const worker = createClickWorker({ ...deps, logger: { log() {}, warn() {}, error() {} } });

  await worker.processBatch();
  assert.equal(deps.inserted.length, 1);
  assert.equal(await redis.lLen("click:processing"), 0);

  const poisonRedis = new FakeRedis({
    queue: [JSON.stringify(makeEvent({ attempts: 4 }))],
  });
  const poisonDeps = makeDependencies(poisonRedis, { failBulkWrite: true });
  const poisonWorker = createClickWorker({
    ...poisonDeps,
    logger: { log() {}, warn() {}, error() {} },
  });
  await poisonWorker.processBatch();
  assert.equal(await poisonRedis.lLen("click:dead-letter"), 1);
  assert.equal((await poisonRedis.hGetAll("click:worker:metrics")).deadLetterEvents, 1);
});

test("replayed persisted events reconcile click totals without incrementing twice", async () => {
  const raw = JSON.stringify(makeEvent());
  const redis = new FakeRedis({ processing: [raw] });
  const deps = makeDependencies(redis);
  deps.ClickEvent.bulkWrite = async () => ({ upsertedCount: 0, upsertedIds: {} });
  const worker = createClickWorker({ ...deps, logger: { log() {}, warn() {}, error() {} } });

  const result = await worker.processBatch();

  assert.deepEqual(result, { processed: 1, inserted: 0 });
  assert.deepEqual(deps.linkUpdates[0].updateOne.update.$set, { clickCount: 1 });
  assert.equal(await redis.lLen("click:processing"), 0);
});
