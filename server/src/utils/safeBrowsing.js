const axios = require("axios");

/**
 * Check a URL against Google Safe Browsing.
 *
 * Returns { malicious: boolean, unavailable: boolean }
 *   - malicious: true  → the URL matched a known threat
 *   - unavailable: true → the safety check could not be performed
 *                          (missing key in production, or API error in production)
 *
 * Behaviour by environment:
 *   - development: silently skips if key is missing (returns safe)
 *   - production:  fails closed — missing key or API error returns unavailable:true
 */
async function checkUrlSafety(url) {
  var isProduction = process.env.NODE_ENV === "production";

  if (!process.env.SAFE_BROWSING_API_KEY) {
    if (isProduction) {
      console.error(
        "SAFE_BROWSING_API_KEY is not set — failing closed in production",
      );
      return { malicious: false, unavailable: true };
    }
    // Development: skip the check entirely
    return { malicious: false, unavailable: false };
  }

  try {
    var response = await axios.post(
      "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=" +
        process.env.SAFE_BROWSING_API_KEY,
      {
        client: { clientId: "url-shortener", clientVersion: "1.0.0" },
        threatInfo: {
          threatTypes: [
            "MALWARE",
            "SOCIAL_ENGINEERING",
            "UNWANTED_SOFTWARE",
          ],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url: url }],
        },
      },
    );

    var isMalicious = !!(response.data.matches && response.data.matches.length > 0);
    return { malicious: isMalicious, unavailable: false };
  } catch (err) {
    console.error("Safe Browsing check failed:", err.message);
    if (isProduction) {
      // Fail closed in production — don't let potentially dangerous URLs through
      return { malicious: false, unavailable: true };
    }
    // Development: fail open so devs aren't blocked by API issues
    return { malicious: false, unavailable: false };
  }
}

module.exports = { checkUrlSafety };
