const test = require("node:test");
const assert = require("node:assert/strict");

const User = require("../src/models/User");
const Link = require("../src/models/Link");
const Report = require("../src/models/Report");
const { requireAdmin } = require("../src/middleware/requireAdmin");
const { submitReport } = require("../src/controllers/report.controller");

function makeResponse() {
  return {
    statusCode: 200,
    body: null,
    clearedCookie: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    clearCookie(name) {
      this.clearedCookie = name;
    },
  };
}

function makeRequest({ userId, body } = {}) {
  return { session: userId ? { userId } : {}, body: body || {} };
}

test("requireAdmin distinguishes unauthenticated, non-admin, and admin users", async (t) => {
  const originalFindById = User.findById;
  let user = null;
  User.findById = async () => user;
  t.after(() => {
    User.findById = originalFindById;
  });

  const unauthenticated = makeResponse();
  await requireAdmin(makeRequest(), unauthenticated, () => assert.fail("unexpected next"));
  assert.equal(unauthenticated.statusCode, 401);

  user = { isAdmin: false };
  const forbidden = makeResponse();
  await requireAdmin(makeRequest({ userId: "user-1" }), forbidden, () => assert.fail("unexpected next"));
  assert.equal(forbidden.statusCode, 403);

  user = { isAdmin: true };
  const allowed = makeResponse();
  let nextCalled = false;
  const req = makeRequest({ userId: "admin-1" });
  await requireAdmin(req, allowed, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
  assert.equal(req.adminUser, user);
});

test("report validation rejects missing fields, oversized reasons, and invalid email", async (t) => {
  const originalFindOne = Link.findOne;
  const originalCreate = Report.create;
  let lookupCount = 0;
  Link.findOne = async () => {
    lookupCount += 1;
    return { _id: "link-1" };
  };
  Report.create = async () => assert.fail("invalid reports must not be saved");
  t.after(() => {
    Link.findOne = originalFindOne;
    Report.create = originalCreate;
  });

  const missing = makeResponse();
  await submitReport({ body: {} }, missing);
  assert.equal(missing.statusCode, 400);

  const tooLong = makeResponse();
  await submitReport({ body: { shortCodeOrUrl: "abc123", reason: "x".repeat(1001) } }, tooLong);
  assert.equal(tooLong.statusCode, 400);

  const invalidEmail = makeResponse();
  await submitReport(
    { body: { shortCodeOrUrl: "abc123", reason: "Phishing", reporterEmail: "not-an-email" } },
    invalidEmail,
  );
  assert.equal(invalidEmail.statusCode, 400);
  assert.equal(lookupCount, 0);
});

test("report submission requires an existing short code and saves a valid report", async (t) => {
  const originalFindOne = Link.findOne;
  const originalCreate = Report.create;
  let savedReport = null;
  Link.findOne = async (query) =>
    query.$or.some((condition) => condition.shortCode === "abc123")
      ? { _id: "link-1" }
      : null;
  Report.create = async (report) => {
    savedReport = report;
    return report;
  };
  t.after(() => {
    Link.findOne = originalFindOne;
    Report.create = originalCreate;
  });

  const missingLink = makeResponse();
  await submitReport(
    { body: { shortCodeOrUrl: "unknown", reason: "Phishing" } },
    missingLink,
  );
  assert.equal(missingLink.statusCode, 404);
  assert.equal(savedReport, null);

  const accepted = makeResponse();
  await submitReport(
    {
      body: {
        shortCodeOrUrl: "https://short.example/abc123",
        reason: "Phishing destination",
        reporterEmail: "person@example.com",
      },
    },
    accepted,
  );

  assert.equal(accepted.statusCode, 201);
  assert.deepEqual(savedReport, {
    shortCodeOrUrl: "https://short.example/abc123",
    reason: "Phishing destination",
    reporterEmail: "person@example.com",
    linkId: "link-1",
  });
});
