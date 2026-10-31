const mongoose = require("mongoose");

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    event: { type: String, required: true },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("WebhookEvent", webhookEventSchema);
