const mongoose = require("mongoose");

const clickEventSchema = new mongoose.Schema(
  {
    linkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Link",
      required: true,
      index: true,
    },
    shortCode: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now },
    referrer: { type: String, default: "direct" },
    device: { type: String, default: "unknown" }, // mobile / desktop / tablet
    browser: { type: String, default: "unknown" },
    os: { type: String, default: "unknown" },
    country: { type: String, default: "unknown" },
    city: { type: String, default: "unknown" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ClickEvent", clickEventSchema);
