const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildLinkListFilter,
  escapeRegex,
  getLinkListSort,
  parseLinkListQuery,
} = require("../src/utils/linkListQuery");

test("link-list query parsing accepts supported filters and bounds text inputs", () => {
  const options = parseLinkListQuery({
    page: "3",
    search: "  spring sale  ",
    status: "active",
    sort: "most-clicks",
    tag: "Campaign",
    source: "qr",
  });

  assert.deepEqual(options, {
    page: "3",
    search: "spring sale",
    status: "active",
    sort: "most-clicks",
    tag: "Campaign",
    source: "qr",
  });
  assert.equal(parseLinkListQuery({ search: "x".repeat(120) }).search.length, 100);
  assert.equal(parseLinkListQuery({ tag: "x".repeat(25) }).tag.length, 20);
});

test("link-list query parsing rejects repeated values and unsupported filters", () => {
  assert.match(parseLinkListQuery({ status: ["active", "expired"] }).error, /single string/);
  assert.match(parseLinkListQuery({ status: "admin" }).error, /status filter/);
  assert.match(parseLinkListQuery({ sort: "random" }).error, /sort order/);
  assert.match(parseLinkListQuery({ source: "admin" }).error, /source filter/);
});

test("link-list search is treated as literal text, not a user-provided regex", () => {
  const literal = "campaign.*(spring)";
  const escaped = new RegExp(escapeRegex(literal), "i");
  assert.equal(escaped.test("CAMPAIGN.*(SPRING)"), true);
  assert.equal(escaped.test("campaign something spring"), false);
});

test("link-list Mongo filters always bind owner and compose status, tag, and source", () => {
  const now = new Date("2026-10-31T00:00:00.000Z");
  const filter = buildLinkListFilter("owner-1", {
    search: "abc",
    status: "active",
    tag: "launch",
    source: "qr",
  }, now);

  assert.equal(filter.userId, "owner-1");
  assert.deepEqual(filter.$and[1], {
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  });
  assert.deepEqual(filter.$and[2], { tags: "launch" });
  assert.deepEqual(filter.$and[3], { source: "qr" });
  assert.equal(filter.$and[0].$or[0].longUrl instanceof RegExp, true);
});

test("link-list sorting has stable tie breakers", () => {
  assert.deepEqual(getLinkListSort("newest"), { createdAt: -1, _id: -1 });
  assert.deepEqual(getLinkListSort("oldest"), { createdAt: 1, _id: 1 });
  assert.deepEqual(getLinkListSort("most-clicks"), { clickCount: -1, _id: -1 });
  assert.deepEqual(getLinkListSort("least-clicks"), { clickCount: 1, _id: 1 });
});
