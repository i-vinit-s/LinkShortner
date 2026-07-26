const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const BASE = ALPHABET.length; // 62

function encode(num) {
  if (num === 0) return ALPHABET[0];
  let str = "";
  while (num > 0) {
    str = ALPHABET[num % BASE] + str;
    num = Math.floor(num / BASE);
  }
  return str;
}

module.exports = { encode };
