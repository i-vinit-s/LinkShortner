const https = require("https");
const http = require("http");

function startKeepAlive() {
  var url = process.env.APP_URL; // your own public backend URL
  if (!url) {
    console.log("Keep-alive skipped: APP_URL not set");
    return;
  }

  var intervalMs = 10 * 60 * 1000; // 10 minutes — comfortably under Render's 15-minute sleep threshold

  setInterval(function () {
    var client = url.indexOf("https") === 0 ? https : http;
    var target = url + "/health";

    client
      .get(target, function (res) {
        console.log("[keep-alive] pinged " + target + " -> " + res.statusCode);
      })
      .on("error", function (err) {
        console.error("[keep-alive] ping failed:", err.message);
      });
  }, intervalMs);

  console.log("Keep-alive started: pinging every 10 minutes");
}

module.exports = { startKeepAlive };
