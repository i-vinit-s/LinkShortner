var crypto = require("crypto");
var ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
var AUTO_SHORT_CODE_LENGTH = 7;

function generateRandomCode(length) {
  var len = length || AUTO_SHORT_CODE_LENGTH;
  if (!Number.isInteger(len) || len < AUTO_SHORT_CODE_LENGTH) {
    throw new RangeError("Generated short codes must be at least 7 characters long");
  }
  var code = "";
  for (var i = 0; i < len; i++) {
    var idx = crypto.randomInt(0, ALPHABET.length);
    code += ALPHABET[idx];
  }
  return code;
}

module.exports = { AUTO_SHORT_CODE_LENGTH, generateRandomCode };
