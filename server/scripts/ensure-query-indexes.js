require("dotenv").config();

const mongoose = require("mongoose");
mongoose.set("autoIndex", false);

const models = [
  require("../src/models/Link"),
  require("../src/models/ClickEvent"),
  require("../src/models/Report"),
  require("../src/models/BioPage"),
  require("../src/models/User"),
  require("../src/models/Transaction"),
];
const { validateEnvironment } = require("../src/config/env");

async function main() {
  const apply = process.argv.includes("--apply");
  validateEnvironment();

  if (
    apply &&
    process.env.NODE_ENV === "production" &&
    process.env.CONFIRM_INDEX_BUILD !== "true"
  ) {
    throw new Error(
      "Production index creation requires CONFIRM_INDEX_BUILD=true after reviewing deployment impact",
    );
  }

  const indexes = models.flatMap((model) =>
    model.schema
      .indexes()
      .filter(([, options]) => options.name && options.name.startsWith("query_"))
      .map(([keys, options]) => ({
        collection: model.collection.name,
        keys,
        options,
      })),
  );

  await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
  try {
    for (const index of indexes) {
      if (apply) {
        await mongoose.connection.db
          .collection(index.collection)
          .createIndex(index.keys, index.options);
      }
      process.stdout.write(
        `${apply ? "Ensured" : "Planned"} ${index.collection}.${index.options.name}\n`,
      );
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error("Query index task failed:", err.message);
  process.exitCode = 1;
});
