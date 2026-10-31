const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeBioLinkUrl, isValidBioLinkDestination } = require("../src/utils/bioLinks");

test("bio email and phone actions normalize to safe native destinations", () => {
  assert.equal(normalizeBioLinkUrl("email", "person@example.com"), "mailto:person@example.com");
  assert.equal(normalizeBioLinkUrl("email", "mailto:person@example.com"), "mailto:person@example.com");
  assert.equal(normalizeBioLinkUrl("phone", "+1 (555) 123-4567"), "tel:+15551234567");
});

test("bio link destinations reject invalid contacts and non-web URLs", () => {
  assert.equal(normalizeBioLinkUrl("email", "not-an-email"), null);
  assert.equal(normalizeBioLinkUrl("phone", "123"), null);
  assert.equal(normalizeBioLinkUrl("website", "javascript:alert(1)"), null);
  assert.equal(isValidBioLinkDestination("email", "mailto:person@example.com"), true);
  assert.equal(isValidBioLinkDestination("phone", "tel:+15551234567"), true);
});
