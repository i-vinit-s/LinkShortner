const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const session = require("express-session");
const { RedisStore } = require("connect-redis");
const redisClient = require("./config/redis");
const sanitizeRequest = require("./middleware/sanitize");
const originGuard = require("./middleware/originGuard");
const requestContext = require("./middleware/requestContext");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const linkRoutes = require("./routes/link.routes");
const redirectRoutes = require("./routes/redirect.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const reportRoutes = require("./routes/report.routes");
const qrRoutes = require("./routes/qr.routes");
const adminRoutes = require("./routes/admin.routes");
const bioRoutes = require("./routes/bio.routes");
const billingRoutes = require("./routes/billing.routes");

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
      },
    },
  }),
);
app.use(morgan("dev"));
app.use(requestContext);
app.use(sanitizeRequest);
app.use(originGuard);
app.use(compression());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true, // required for session cookies cross-origin
  }),
);
app.use(
  express.json({
    limit: "10kb",
    verify: function (req, res, buf) {
      req.rawBody = buf; // preserved for webhook signature verification
    },
  }),
);

app.use(
  session({
    store: new RedisStore({ client: redisClient, prefix: "sess:" }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.get("/health", async (req, res) => {
  const mongoose = require("mongoose");
  const mongoUp = mongoose.connection.readyState === 1;
  const redisUp = redisClient.isReady;
  const healthy = mongoUp && redisUp;

  let clickWorker = null;
  if (redisUp) {
    try {
      const [queueDepth, processingDepth, retryDepth, deadLetterDepth, metrics] =
        await Promise.all([
          redisClient.lLen("click:queue"),
          redisClient.lLen("click:processing"),
          redisClient.zCard("click:retry"),
          redisClient.lLen("click:dead-letter"),
          redisClient.hGetAll("click:worker:metrics"),
        ]);
      clickWorker = {
        queueDepth,
        processingDepth,
        retryDepth,
        deadLetterDepth,
        processedBatches: Number(metrics.processedBatches || 0),
        processedEvents: Number(metrics.processedEvents || 0),
        insertedEvents: Number(metrics.insertedEvents || 0),
        failedBatches: Number(metrics.failedBatches || 0),
        retriedEvents: Number(metrics.retriedEvents || 0),
        deadLetterEvents: Number(metrics.deadLetterEvents || 0),
        orphanEvents: Number(metrics.orphanEvents || 0),
        lastSuccessAt: metrics.lastSuccessAt || null,
        lastFailureAt: metrics.lastFailureAt || null,
        lastBatchDurationMs: Number(metrics.lastBatchDurationMs || 0),
      };
    } catch (err) {
      clickWorker = { available: false };
    }
  }

  // 503 when a dependency is down, so uptime monitors alert without keyword matching
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    mongo: mongoUp ? "connected" : "down",
    redis: redisUp ? "connected" : "down",
    clickWorker,
    timestamp: Date.now(),
  });
});

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/links", linkRoutes);

app.use("/", redirectRoutes);

app.use("/api/v1/analytics", analyticsRoutes);

app.use('/api/v1/qr', qrRoutes);

app.use("/api/v1/reports", reportRoutes);

app.use("/api/v1/admin", adminRoutes);

app.use("/api/v1/bio", bioRoutes);

app.use("/api/v1/billing", billingRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
