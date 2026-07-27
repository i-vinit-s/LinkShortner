const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    shortCodeOrUrl: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true },
    reporterEmail: { type: String, default: null, trim: true },
    status: {
      type: String,
      enum: ["pending", "reviewed", "actioned"],
      default: "pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Report", reportSchema);
