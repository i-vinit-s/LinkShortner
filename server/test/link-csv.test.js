const test = require("node:test");
const assert = require("node:assert/strict");
const {
  MAX_IMPORT_ROWS,
  escapeCsvCell,
  parseDelimitedTags,
  parseLinkImportCsv,
  serializeDelimitedTags,
} = require("../src/utils/linkCsv");

test("CSV import accepts only supported headers and returns normalized rows", () => {
  const parsed = parseLinkImportCsv(
    " URL , Alias , Tags\r\nhttps://example.com/path,Launch_1,news|spring\r\n",
  );

  assert.equal(parsed.error, undefined);
  assert.deepEqual(parsed.rows, [
    { rowNumber: 2, url: "https://example.com/path", alias: "Launch_1", tags: "news|spring" },
  ]);
  assert.match(parseLinkImportCsv("destination\r\nhttps://example.com").error, /url column/);
  assert.match(parseLinkImportCsv("url,password\r\nhttps://example.com,secret").error, /only be url, alias, and tags/);
});

test("CSV import rejects malformed, oversized, and over-limit files", () => {
  assert.equal(parseLinkImportCsv("").status, 400);
  assert.equal(parseLinkImportCsv("url\r\n" + "x".repeat(9001)).status, 413);

  const tooManyRows = "url\r\n" + Array.from({ length: MAX_IMPORT_ROWS + 1 }, (_, index) => `https://example.com/${index}`).join("\r\n");
  assert.equal(parseLinkImportCsv(tooManyRows).status, 413);
});

test("CSV export quotes cells and neutralizes spreadsheet formulas", () => {
  assert.equal(escapeCsvCell("normal, value"), '"normal, value"');
  assert.equal(escapeCsvCell('a"b'), '"a""b"');
  assert.equal(escapeCsvCell("=HYPERLINK(\"https://bad.example\")"), '"\'=HYPERLINK(""https://bad.example"")"');
  assert.equal(escapeCsvCell("-cmd"), '"\'-cmd"');
});

test("CSV tag delimiter preserves literal pipes and backslashes", () => {
  const tags = ["campaign", "spring|summer", "path\\tag"];
  assert.deepEqual(parseDelimitedTags(serializeDelimitedTags(tags)), tags);
});
