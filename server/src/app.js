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

app.get("/health", (req, res) => {
  const mongoose = require("mongoose");
  const mongoUp = mongoose.connection.readyState === 1;
  const redisUp = redisClient.isReady;
  const healthy = mongoUp && redisUp;

  // 503 when a dependency is down, so uptime monitors alert without keyword matching
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    mongo: mongoUp ? "connected" : "down",
    redis: redisUp ? "connected" : "down",
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

module.exports = app;
