const test = require("node:test");
const assert = require("node:assert/strict");

const redisPath = require.resolve("../src/config/redis");
require.cache[redisPath] = {
  id: redisPath,
  filename: redisPath,
  loaded: true,
  exports: { del: async function () {}, incr: async function () {} },
  children: [],
  paths: [],
};

const BioPage = require("../src/models/BioPage");
const { trackPublicBioLinkClick } = require("../src/controllers/bio.controller");

function response() {
  return {
    statusCode: 200,
    body: null,
    location: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    redirect(code, url) {
      this.statusCode = code;
      this.location = url;
      return this;
    },
  };
}

test("bio link click increments the saved link and redirects to its stored URL", async (t) => {
  const originalFindOne = BioPage.findOne;
  const originalUpdateOne = BioPage.updateOne;
  t.after(() => {
    BioPage.findOne = originalFindOne;
    BioPage.updateOne = originalUpdateOne;
  });

  let lookup;
  let update;
  BioPage.findOne = async (filter) => {
    lookup = filter;
    return {
      _id: "page-1",
      links: [{ id: "link-1", url: "https://destination.example/path" }],
    };
  };
  BioPage.updateOne = async (...args) => {
    update = args;
    return { matchedCount: 1 };
  };

  const res = response();
  await trackPublicBioLinkClick(
    { params: { slug: "my-page", linkId: "link-1" } },
    res,
  );

  assert.deepEqual(lookup, {
    slug: "my-page",
    isPublished: true,
    "links.id": "link-1",
  });
  assert.deepEqual(update, [
    { _id: "page-1", isPublished: true, "links.id": "link-1" },
    { $inc: { "links.$.clicks": 1 } },
  ]);
  assert.equal(res.statusCode, 302);
  assert.equal(res.location, "https://destination.example/path");
});

test("bio link click returns 404 for an unknown or unpublished page", async (t) => {
  const originalFindOne = BioPage.findOne;
  const originalUpdateOne = BioPage.updateOne;
  t.after(() => {
    BioPage.findOne = originalFindOne;
    BioPage.updateOne = originalUpdateOne;
  });

  BioPage.findOne = async () => null;
  BioPage.updateOne = async () => {
    assert.fail("must not increment a missing page");
  };

  const res = response();
  await trackPublicBioLinkClick(
    { params: { slug: "missing", linkId: "link-1" } },
    res,
  );

  assert.equal(res.statusCode, 404);
});
