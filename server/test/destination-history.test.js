const test = require("node:test");
const assert = require("node:assert/strict");

const redisPath = require.resolve("../src/config/redis");
const redisClient = { del: async function () {}, incr: async function () {} };
require.cache[redisPath] = {
  id: redisPath,
  filename: redisPath,
  loaded: true,
  exports: redisClient,
  children: [],
  paths: [],
};

const Link = require("../src/models/Link");
const safeBrowsing = require("../src/utils/safeBrowsing");
const {
  MAX_DESTINATION_HISTORY,
  appendDestinationHistory,
} = require("../src/utils/destinationHistory");

const { getDestinationHistory, restoreDestination } = (() => {
  safeBrowsing.checkUrlSafety = async () => ({ malicious: false, unavailable: false });
  return require("../src/controllers/link.controller");
})();

function makeResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function makeLink(overrides = {}) {
  return {
    _id: "link-1",
    userId: "owner-1",
    shortCode: "short1",
    longUrl: "https://current.example/",
    isActive: true,
    deactivatedBy: null,
    destinationHistory: [
      {
        url: "https://previous.example/",
        changedAt: new Date("2026-10-01T12:00:00.000Z"),
        changedBy: { name: "Owner" },
      },
    ],
    save: async function () {},
    ...overrides,
  };
}

test("destination history appends actor and trims to the most recent ten entries", () => {
  const link = {
    longUrl: "https://current.example/",
    destinationHistory: Array.from({ length: MAX_DESTINATION_HISTORY }, (_, index) => ({
      url: "https://old-" + index + ".example/",
      changedAt: new Date(index),
    })),
  };

  appendDestinationHistory(link, "owner-1");

  assert.equal(link.destinationHistory.length, MAX_DESTINATION_HISTORY);
  assert.equal(link.destinationHistory[0].url, "https://old-1.example/");
  assert.equal(link.destinationHistory.at(-1).url, "https://current.example/");
  assert.equal(link.destinationHistory.at(-1).changedBy, "owner-1");
});

test("history endpoint scopes lookup to the authenticated owner and returns change details", async (t) => {
  const originalFindOne = Link.findOne;
  const link = makeLink();
  let filter;
  Link.findOne = function (query) {
    filter = query;
    return {
      populate: async function (path, fields) {
        assert.equal(path, "destinationHistory.changedBy");
        assert.equal(fields, "name");
        return link;
      },
    };
  };
  t.after(() => { Link.findOne = originalFindOne; });

  const response = makeResponse();
  await getDestinationHistory(
    { params: { id: "link-1" }, session: { userId: "owner-1" } },
    response,
  );

  assert.deepEqual(filter, { _id: "link-1", userId: "owner-1" });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.currentUrl, link.longUrl);
  assert.equal(response.body.history[0].changedBy, "Owner");
});

test("rollback rejects stale history snapshots without mutating the link", async (t) => {
  const originalFindOne = Link.findOne;
  const link = makeLink();
  let saves = 0;
  link.save = async function () { saves += 1; };
  Link.findOne = async () => link;
  t.after(() => { Link.findOne = originalFindOne; });

  const response = makeResponse();
  await restoreDestination(
    {
      params: { id: "link-1", historyIndex: "0" },
      session: { userId: "owner-1" },
      body: {
        expectedUrl: "https://changed.example/",
        expectedChangedAt: link.destinationHistory[0].changedAt.toISOString(),
      },
    },
    response,
  );

  assert.equal(response.statusCode, 409);
  assert.equal(link.longUrl, "https://current.example/");
  assert.equal(saves, 0);
});

test("rollback restores an owned saved URL, records the current URL, and clears redirect cache", async (t) => {
  const originalFindOne = Link.findOne;
  const originalDelete = redisClient.del;
  const link = makeLink();
  let saved = false;
  let deletedKey;
  link.save = async function () { saved = true; };
  Link.findOne = async (filter) => {
    assert.deepEqual(filter, { _id: "link-1", userId: "owner-1" });
    return link;
  };
  redisClient.del = async (key) => { deletedKey = key; };
  t.after(() => {
    Link.findOne = originalFindOne;
    redisClient.del = originalDelete;
  });

  const response = makeResponse();
  await restoreDestination(
    {
      params: { id: "link-1", historyIndex: "0" },
      session: { userId: "owner-1" },
      body: {
        expectedUrl: "https://previous.example/",
        expectedChangedAt: link.destinationHistory[0].changedAt.toISOString(),
      },
    },
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.longUrl, "https://previous.example/");
  assert.equal(link.longUrl, "https://previous.example/");
  assert.equal(link.destinationHistory.at(-1).url, "https://current.example/");
  assert.equal(link.destinationHistory.at(-1).changedBy, "owner-1");
  assert.equal(saved, true);
  assert.equal(deletedKey, "short:short1");
});
