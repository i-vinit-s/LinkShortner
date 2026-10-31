const { AUTO_SHORT_CODE_LENGTH, generateRandomCode } = require("./randomCode");

const MAX_GENERATION_ATTEMPTS = 5;

async function generateUniqueShortCode(Link) {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const shortCode = generateRandomCode(AUTO_SHORT_CODE_LENGTH);
    const existing = await Link.findOne({
      $or: [{ shortCode }, { legacyShortCodes: shortCode }],
    });
    if (!existing) return shortCode;
  }

  throw new Error("Could not generate a unique short code after several attempts");
}

module.exports = { AUTO_SHORT_CODE_LENGTH, generateUniqueShortCode };
