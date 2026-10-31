const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { verifyWebhookSignature } = require("../src/utils/webhookSignature");

const secret = "local-test-webhook-secret";
const rawBody = Buffer.from('{"event":"subscription.activated"}');
const validSignature = crypto
  .createHmac("sha256", secret)
  .update(rawBody)
  .digest("hex");

test("webhook signature verification accepts the exact raw body HMAC", () => {
  assert.equal(verifyWebhookSignature(rawBody, validSignature, secret), true);
});

test("webhook signature verification rejects tampered bodies and malformed inputs", () => {
  assert.equal(
    verifyWebhookSignature(Buffer.from('{"event":"subscription.cancelled"}'), validSignature, secret),
    false,
  );
  assert.equal(verifyWebhookSignature(rawBody, "not-a-signature", secret), false);
  assert.equal(verifyWebhookSignature(rawBody, validSignature, ""), false);
  assert.equal(verifyWebhookSignature(null, validSignature, secret), false);
});
