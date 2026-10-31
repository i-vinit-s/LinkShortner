const test = require("node:test");
const assert = require("node:assert/strict");
const { validateEnvironment } = require("../src/config/env");

const originalEnv = { ...process.env };

function restoreEnvironment() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
}

test.afterEach(restoreEnvironment);

test("environment validation reports missing required values", () => {
  process.env.NODE_ENV = "development";
  delete process.env.MONGO_URI;
  delete process.env.REDIS_URL;
  assert.throws(() => validateEnvironment(), /MONGO_URI, REDIS_URL/);
});

test("production requires a long session secret", () => {
  process.env.NODE_ENV = "production";
  process.env.MONGO_URI = "mongodb://example";
  process.env.REDIS_URL = "redis://example";
  process.env.CLIENT_URL = "https://example.com";
  process.env.RAZORPAY_WEBHOOK_SECRET = "webhook-secret";
  process.env.SESSION_SECRET = "too-short";
  assert.throws(() => validateEnvironment(), /at least 32 characters/);
});
