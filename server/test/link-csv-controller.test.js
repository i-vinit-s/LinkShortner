const test = require("node:test");
const assert = require("node:assert/strict");

const redisPath = require.resolve("../src/config/redis");
require.cache[redisPath] = {
  id: redisPath,
  filename: redisPath,
  loaded: true,
  exports: { set: async () => {}, del: async () => {} },
  children: [],
  paths: [],
};

const safeBrowsing = require("../src/utils/safeBrowsing");
const originalSafetyCheck = safeBrowsing.checkUrlSafety;
safeBrowsing.checkUrlSafety = async (url) => ({
  malicious: url.includes("unsafe"),
  unavailable: false,
});

const Link = require("../src/models/Link");
const { importLinksCsv, exportMyLinksCsv } = require("../src/controllers/link.controller");

function makeResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    set(name, value) { this.headers[name] = value; return this; },
    send(body) { this.body = body; return this; },
  };
}

test.after(() => { safeBrowsing.checkUrlSafety = originalSafetyCheck; });

test("CSV import scopes duplicates to the account and returns per-row outcomes", async (t) => {
  const originalFind = Link.find;
  const originalFindOne = Link.findOne;
  const originalCreate = Link.create;
  const created = [];
  Link.find = (filter) => {
    assert.equal(filter.userId, "owner-1");
    return { select: () => ({ lean: async () => [] }) };
  };
  Link.findOne = () => ({ select: () => ({ lean: async () => null }) });
  Link.create = async (data) => {
    created.push(data);
    return { ...data, shortCode: data.shortCode || "aB3xYz9" };
  };
  t.after(() => {
    Link.find = originalFind;
    Link.findOne = originalFindOne;
    Link.create = originalCreate;
  });

  const response = makeResponse();
  await importLinksCsv(
    {
      session: { userId: "owner-1" },
      body: [
        "url,alias,tags",
        "https://example.com,launch1,news|spring",
        "https://unsafe.example,,",
        "https://example.com,,",
        "not-a-url,,",
      ].join("\r\n"),
    },
    response,
  );

  assert.equal(response.statusCode, 201);
  assert.deepEqual(response.body.summary, { created: 1, unsafe: 1, duplicate: 1, invalid: 1 });
  assert.equal(created.length, 1);
  assert.equal(created[0].userId, "owner-1");
  assert.equal(created[0].customAlias, true);
  assert.deepEqual(created[0].tags, ["news", "spring"]);
});

test("CSV export is owner-scoped, filtered, bounded, and formula-safe", async (t) => {
  const originalFind = Link.find;
  let capturedFilter;
  let capturedLimit;
  Link.find = (filter) => {
    capturedFilter = filter;
    return {
      sort: () => ({
        limit: (limit) => {
          capturedLimit = limit;
          return {
            select: () => ({
              lean: async () => [{
                shortCode: "abc123",
                customAlias: false,
                longUrl: "https://example.com",
                tags: ["=HYPERLINK(\"bad\")"],
                createdAt: new Date("2026-01-01T00:00:00.000Z"),
                expiresAt: null,
                isActive: true,
                clickCount: 2,
              }],
            }),
          };
        },
      }),
    };
  };
  t.after(() => { Link.find = originalFind; });

  const response = makeResponse();
  await exportMyLinksCsv(
    {
      session: { userId: "owner-2" },
      query: { search: "example", status: "active", sort: "newest", tag: "all" },
    },
    response,
  );

  assert.equal(capturedFilter.userId, "owner-2");
  assert.equal(capturedLimit, 5001);
  assert.equal(response.headers["Content-Type"], "text/csv; charset=utf-8");
  assert.match(response.body, /'=HYPERLINK/);
  assert.match(response.body, /HYPERLINK/);
});
