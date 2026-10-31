const test = require("node:test");
const assert = require("node:assert/strict");
const { getPageBounds } = require("../src/utils/pagination");

test("pagination defaults invalid page values to page one", () => {
  assert.deepEqual(getPageBounds(undefined, 45, 20), { page: 1, pages: 3 });
  assert.deepEqual(getPageBounds("not-a-page", 45, 20), { page: 1, pages: 3 });
  assert.deepEqual(getPageBounds("-4", 45, 20), { page: 1, pages: 3 });
});

test("pagination clamps oversized page requests and handles empty collections", () => {
  assert.deepEqual(getPageBounds("999999999", 45, 20), { page: 3, pages: 3 });
  assert.deepEqual(getPageBounds("9", 0, 20), { page: 1, pages: 0 });
});
