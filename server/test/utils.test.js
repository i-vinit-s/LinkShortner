const test = require("node:test");
const assert = require("node:assert/strict");
const { encode } = require("../src/utils/base62");
const { AUTO_SHORT_CODE_LENGTH, generateRandomCode } = require("../src/utils/randomCode");
const { generateUniqueShortCode } = require("../src/utils/shortCode");
const { validatePasswordStrength } = require("../src/utils/validators");

test("base62 encoding is stable for zero and positive integers", () => {
  assert.equal(encode(0), "A");
  assert.equal(encode(61), "9");
  assert.equal(encode(62), "BA");
});

test("random codes use the requested length and base62 alphabet", () => {
  const code = generateRandomCode(32);
  assert.equal(code.length, 32);
  assert.match(code, /^[A-Za-z0-9]+$/);
});

test("automatic short codes are random, unique against canonical and legacy codes, and at least seven characters", async () => {
  assert.equal(AUTO_SHORT_CODE_LENGTH, 7);
  assert.equal(generateRandomCode().length, 7);
  assert.throws(() => generateRandomCode(6), /at least 7 characters/);

  const queries = [];
  const generated = await generateUniqueShortCode({
    findOne: async (query) => {
      queries.push(query);
      return queries.length === 1 ? { _id: "collision" } : null;
    },
  });

  assert.equal(generated.length, 7);
  assert.match(generated, /^[A-Za-z0-9]{7}$/);
  assert.equal(queries.length, 2);
  assert.deepEqual(Object.keys(queries[0]), ["$or"]);
  assert.deepEqual(queries[0].$or[1], { legacyShortCodes: queries[0].$or[0].shortCode });
});

test("password validation accepts strong passwords and explains weak ones", () => {
  assert.equal(validatePasswordStrength("Correct-Horse7!").valid, true);

  const result = validatePasswordStrength("weak");
  assert.equal(result.valid, false);
  assert.match(result.message, /8 characters/);
  assert.match(result.message, /uppercase letter/);
  assert.match(result.message, /number/);
  assert.match(result.message, /special character/);
});
