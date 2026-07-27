var crypto = require("crypto");
var ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateRandomCode(length) {
  var len = length || 7;
  var code = "";
  for (var i = 0; i < len; i++) {
    var idx = crypto.randomInt(0, ALPHABET.length);
    code += ALPHABET[idx];
  }
  return code;
}

module.exports = { generateRandomCode };
