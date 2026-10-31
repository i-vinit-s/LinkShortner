const MAX_DESTINATION_HISTORY = 10;

function appendDestinationHistory(link, changedBy) {
  if (!Array.isArray(link.destinationHistory)) link.destinationHistory = [];

  link.destinationHistory.push({
    url: link.longUrl,
    changedAt: new Date(),
    changedBy: changedBy || null,
  });
  if (link.destinationHistory.length > MAX_DESTINATION_HISTORY) {
    link.destinationHistory = link.destinationHistory.slice(-MAX_DESTINATION_HISTORY);
  }
}

module.exports = { MAX_DESTINATION_HISTORY, appendDestinationHistory };
