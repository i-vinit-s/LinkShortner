const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];
const RAZORPAY_WEBHOOK_PATH = "/api/v1/billing/webhook";

function normalizeOrigin(value) {
  if (!value || value === "null") return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

module.exports = function originGuard(req, res, next) {
  if (SAFE_METHODS.includes(req.method)) return next();

  // Razorpay authenticates this server-to-server POST with its HMAC signature.
  if (req.method === "POST" && req.path === RAZORPAY_WEBHOOK_PATH) {
    return next();
  }

  const requestOrigin = normalizeOrigin(req.headers.origin);
  const clientOrigin = normalizeOrigin(process.env.CLIENT_URL);
  if (!requestOrigin || !clientOrigin || requestOrigin !== clientOrigin) {
    return res.status(403).json({ message: "Cross-site request blocked" });
  }
  next();
};
