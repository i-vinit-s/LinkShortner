const axios = require("axios");

async function isUrlMalicious(url) {
  if (!process.env.SAFE_BROWSING_API_KEY) return false; // skip check if not configured

  try {
    const response = await axios.post(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.SAFE_BROWSING_API_KEY}`,
      {
        client: { clientId: "url-shortener", clientVersion: "1.0.0" },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }],
        },
      },
    );
    return !!(response.data.matches && response.data.matches.length > 0);
  } catch (err) {
    console.error("Safe Browsing check failed:", err.message);
    return false; // fail open — don't block link creation if the API itself is down
  }
}

module.exports = { isUrlMalicious };
