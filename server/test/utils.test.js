const test = require("node:test");
const assert = require("node:assert/strict");
const { encode } = require("../src/utils/base62");
const { generateRandomCode } = require("../src/utils/randomCode");
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

test("password validation accepts strong passwords and explains weak ones", () => {
  assert.equal(validatePasswordStrength("Correct-Horse7!").valid, true);

  const result = validatePasswordStrength("weak");
  assert.equal(result.valid, false);
  assert.match(result.message, /8 characters/);
  assert.match(result.message, /uppercase letter/);
  assert.match(result.message, /number/);
  assert.match(result.message, /special character/);
});
