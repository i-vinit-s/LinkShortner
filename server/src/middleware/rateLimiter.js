const { RateLimiterRedis } = require("rate-limiter-flexible");
const redisClient = require("../config/redis");

// Anonymous users creating links: stricter limit
const anonymousLinkLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  useRedisPackage: true,
  keyPrefix: "rl:anon-create",
  points: 5,
  duration: 60,
});

const authLinkLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  useRedisPackage: true,
  keyPrefix: "rl:auth-create",
  points: 30,
  duration: 60,
});

const redirectLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  useRedisPackage: true,
  keyPrefix: "rl:redirect",
  points: 100,
  duration: 60,
});

const loginLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  useRedisPackage: true,
  keyPrefix: "rl:login",
  points: 5,
  duration: 300,
});

const otpLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  useRedisPackage: true,
  keyPrefix: "rl:otp-resend",
  points: 3,
  duration: 600, // 3 resends per 10 minutes
});

const reportLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  useRedisPackage: true,
  keyPrefix: "rl:report",
  points: 5,
  duration: 3600, // 5 reports per hour per IP
});

const qrGenLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  useRedisPackage: true,
  keyPrefix: "rl:qr-generate",
  points: 15,
  duration: 60, // 15 QR generations per minute per IP
});

function makeMiddleware(limiter, keyFn) {
  return async (req, res, next) => {
    try {
      const key = keyFn(req);
      await limiter.consume(key);
      next();
    } catch (rejRes) {
      // A real rate-limit rejection always has msBeforeNext as a number.
      // Anything else (undefined here) means an actual error occurred — not an actual limit hit.
      if (typeof rejRes?.msBeforeNext !== "number") {
        console.error(
          "Rate limiter error (not a real rate-limit hit):",
          rejRes,
        );
        return res.status(500).json({ message: "Internal server error" });
      }

      const retrySecs = Math.ceil(rejRes.msBeforeNext / 1000);
      res.set("Retry-After", String(retrySecs));
      res.status(429).json({
        message: "Too many requests. Please try again later.",
        retryAfter: retrySecs,
      });
    }
  };
}

// Key by IP for anonymous/redirect/login limits, by userId for authenticated limits
const getIp = (req) =>
  req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.ip;

module.exports = {
  limitAnonymousLinkCreation: makeMiddleware(anonymousLinkLimiter, getIp),
  limitAuthLinkCreation: makeMiddleware(
    authLinkLimiter,
    (req) => req.session.userId,
  ),
  limitRedirect: makeMiddleware(redirectLimiter, getIp),
  limitLogin: makeMiddleware(loginLimiter, getIp),
  limitOtpResend: makeMiddleware(
    otpLimiter,
    (req) => req.body.email || getIp(req),
  ),
  limitReport: makeMiddleware(reportLimiter, getIp),
  limitQrGenerate: makeMiddleware(qrGenLimiter, getIp),
};
