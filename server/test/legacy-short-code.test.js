const test = require("node:test");
const assert = require("node:assert/strict");

const redisPath = require.resolve("../src/config/redis");
const redisWrites = [];
const incrementedKeys = [];
const fakeRedis = {
  get: async () => null,
  set: async (key, value) => redisWrites.push({ key, value }),
  setEx: async (key, _ttl, value) => redisWrites.push({ key, value }),
  incr: async (key) => { incrementedKeys.push(key); return 1; },
  rPush: async (_key, value) => redisWrites.push({ key: "click:queue", value }),
};
require.cache[redisPath] = {
  id: redisPath,
  filename: redisPath,
  loaded: true,
  exports: fakeRedis,
  children: [],
  paths: [],
};

const Link = require("../src/models/Link");
const { resolveLink } = require("../src/controllers/redirect.controller");

function makeResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("previous generated codes resolve to the new canonical code and keep click attribution", async (t) => {
  const originalFindOne = Link.findOne;
  const link = {
    _id: "link-id",
    shortCode: "r4Nd0m7",
    legacyShortCodes: ["A"],
    longUrl: "https://example.com/",
    isActive: true,
    passwordHash: null,
    expiresAt: null,
    save: async () => {},
  };
  let lookup;
  Link.findOne = async (filter) => {
    lookup = filter;
    return link;
  };
  t.after(() => { Link.findOne = originalFindOne; });
  redisWrites.length = 0;
  incrementedKeys.length = 0;

  const response = makeResponse();
  await resolveLink(
    {
      params: { shortCode: "A" },
      headers: { "user-agent": "test browser" },
      query: {},
      ip: "127.0.0.1",
    },
    response,
  );
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(lookup, {
    isActive: true,
    $or: [{ shortCode: "A" }, { legacyShortCodes: "A" }],
  });
  assert.deepEqual(response.body, { longUrl: "https://example.com/" });
  assert.equal(JSON.parse(redisWrites[0].value).shortCode, "r4Nd0m7");
  assert.deepEqual(incrementedKeys, ["clicks:r4Nd0m7"]);
  const queuedEvent = JSON.parse(redisWrites.find((entry) => entry.key === "click:queue").value);
  assert.equal(queuedEvent.shortCode, "r4Nd0m7");
});
