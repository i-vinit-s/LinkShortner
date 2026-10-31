const test = require("node:test");
const assert = require("node:assert/strict");
const originGuard = require("../src/middleware/originGuard");

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

function runGuard({ method = "POST", path = "/api/v1/links", origin } = {}) {
  const req = { method, path, headers: origin === undefined ? {} : { origin } };
  const res = makeResponse();
  let nextCalled = false;
  originGuard(req, res, () => {
    nextCalled = true;
  });
  return { res, nextCalled };
}

test("originGuard requires the configured origin on unsafe requests", (t) => {
  const originalClientUrl = process.env.CLIENT_URL;
  process.env.CLIENT_URL = "https://app.example.com/";
  t.after(() => {
    if (originalClientUrl === undefined) delete process.env.CLIENT_URL;
    else process.env.CLIENT_URL = originalClientUrl;
  });

  assert.equal(runGuard().res.statusCode, 403);
  assert.equal(runGuard({ origin: "https://attacker.example" }).res.statusCode, 403);
  assert.equal(runGuard({ origin: "null" }).res.statusCode, 403);
  assert.equal(runGuard({ origin: "https://app.example.com" }).nextCalled, true);
});

test("originGuard permits safe methods and only the exact Razorpay webhook exemption", (t) => {
  const originalClientUrl = process.env.CLIENT_URL;
  process.env.CLIENT_URL = "https://app.example.com";
  t.after(() => {
    if (originalClientUrl === undefined) delete process.env.CLIENT_URL;
    else process.env.CLIENT_URL = originalClientUrl;
  });

  assert.equal(runGuard({ method: "GET", origin: "https://attacker.example" }).nextCalled, true);
  assert.equal(
    runGuard({ method: "POST", path: "/api/v1/billing/webhook" }).nextCalled,
    true,
  );
  assert.equal(
    runGuard({ method: "POST", path: "/api/v1/billing/webhook/extra" }).res.statusCode,
    403,
  );
});
