// Session cookies are SameSite=None in production, so a malicious site could make a
// logged-in user's browser send state-changing requests (e.g. an admin ban). Browsers
// always attach Origin to those, so reject any that isn't our own frontend.
// Razorpay's webhook is server-to-server and sends no Origin, so it passes.
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

module.exports = function originGuard(req, res, next) {
  const origin = req.headers.origin;
  if (
    origin &&
    origin !== process.env.CLIENT_URL &&
    SAFE_METHODS.indexOf(req.method) === -1
  ) {
    return res.status(403).json({ message: "Cross-site request blocked" });
  }
  next();
};
