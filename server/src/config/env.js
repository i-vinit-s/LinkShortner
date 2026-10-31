const requiredByEnvironment = {
  development: ["MONGO_URI", "REDIS_URL", "SESSION_SECRET", "CLIENT_URL"],
  test: ["MONGO_URI", "REDIS_URL", "SESSION_SECRET", "CLIENT_URL"],
  production: [
    "MONGO_URI",
    "REDIS_URL",
    "SESSION_SECRET",
    "CLIENT_URL",
    "RAZORPAY_WEBHOOK_SECRET",
  ],
};

function validateEnvironment() {
  const environment = process.env.NODE_ENV || "development";
  const required = requiredByEnvironment[environment] || requiredByEnvironment.production;
  const missing = required.filter((name) => !process.env[name]?.trim());

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables for ${environment}: ${missing.join(", ")}`,
    );
  }

  if (environment === "production" && process.env.SESSION_SECRET.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters in production");
  }
}

module.exports = { validateEnvironment };
