require("dotenv").config();

const mongoose = require("mongoose");
mongoose.set("autoIndex", false);

const Link = require("../src/models/Link");
const { AUTO_SHORT_CODE_LENGTH, generateUniqueShortCode } = require("../src/utils/shortCode");

const apply = process.argv.includes("--apply");

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
  if (apply && !process.env.REDIS_URL) throw new Error("REDIS_URL is required for cache invalidation");
  if (
    apply &&
    process.env.NODE_ENV === "production" &&
    process.env.CONFIRM_SHORT_CODE_MIGRATION !== "true"
  ) {
    throw new Error(
      "Production migration requires CONFIRM_SHORT_CODE_MIGRATION=true after reviewing the planned changes",
    );
  }

  let redisClient;
  try {
    await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
    if (apply) {
      const { createClient } = require("redis");
      redisClient = createClient({ url: process.env.REDIS_URL });
      redisClient.on("error", (err) => console.error("Redis migration error:", err.message));
      await redisClient.connect();
    }

    let scanned = 0;
    let candidates = 0;
    let migrated = 0;
    const cursor = Link.find({
      customAlias: { $ne: true },
      $expr: { $lt: [{ $strLenCP: "$shortCode" }, AUTO_SHORT_CODE_LENGTH] },
    })
      .select("_id shortCode legacyShortCodes")
      .lean()
      .cursor();

    for await (const record of cursor) {
      scanned += 1;
      candidates += 1;
      if (!apply) continue;

      const previousCode = record.shortCode;
      const legacyShortCodes = Array.from(
        new Set([...(record.legacyShortCodes || []), previousCode]),
      );

      // Remove any pre-migration cache entry before changing the canonical code.
      await redisClient.del("short:" + previousCode);

      let updated = false;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const nextCode = await generateUniqueShortCode(Link);
        try {
          const result = await Link.updateOne(
            { _id: record._id, shortCode: previousCode },
            { $set: { shortCode: nextCode, legacyShortCodes } },
          );
          if (result.modifiedCount === 1) {
            migrated += 1;
            updated = true;
          }
          break;
        } catch (err) {
          if (err.code !== 11000 || attempt === 4) throw err;
        }
      }

      if (!updated) {
        process.stdout.write("Skipped one code changed by another writer during migration.\n");
      }
    }

    process.stdout.write(
      JSON.stringify({ mode: apply ? "apply" : "plan", scanned, candidates, migrated }) + "\n",
    );
  } finally {
    if (redisClient && redisClient.isOpen) await redisClient.quit();
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error("Short-code migration failed:", err.message);
  process.exitCode = 1;
});
