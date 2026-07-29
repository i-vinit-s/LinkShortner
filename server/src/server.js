require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const { startClickWorker } = require("./workers/clickWorker");
const { startKeepAlive } = require("./utils/keepAlive");

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  startClickWorker();
  if (process.env.NODE_ENV === "production") {
    startKeepAlive();
  }
});
