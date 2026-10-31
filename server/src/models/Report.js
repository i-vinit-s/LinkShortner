const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    shortCodeOrUrl: { type: String, required: true, trim: true },
    linkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Link",
      default: null,
    },
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

reportSchema.index(
  { status: 1, createdAt: -1 },
  { name: "query_status_created_at_desc" },
);

module.exports = mongoose.model("Report", reportSchema);
