const test = require("node:test");
const assert = require("node:assert/strict");
const notFound = require("../src/middleware/notFound");

test("unknown API routes return a JSON 404 response", () => {
  const res = {
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

  notFound({ method: "GET", path: "/unknown" }, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { message: "Route not found" });
});
