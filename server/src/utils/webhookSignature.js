const crypto = require("crypto");

function verifyWebhookSignature(rawBody, signature, secret) {
  if (
    !Buffer.isBuffer(rawBody) ||
    !signature ||
    !/^[a-f0-9]{64}$/i.test(signature) ||
    !secret
  ) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest();
  const received = Buffer.from(signature, "hex");

  return (
    received.length === expected.length &&
    crypto.timingSafeEqual(received, expected)
  );
}

module.exports = { verifyWebhookSignature };
