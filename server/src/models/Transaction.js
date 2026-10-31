const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    razorpayPaymentId: { type: String, default: null },
    razorpaySubscriptionId: { type: String, default: null },
    amount: { type: Number, required: true }, // in paise (Razorpay's smallest unit), convert to Rs. for display
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["captured", "failed", "refunded"],
      required: true,
    },
    event: { type: String, required: true }, // raw Razorpay event name, kept for auditing
  },
  { timestamps: true },
);

// Razorpay retries can resend the same payment event. A payment ID is stable
// across retries, while failed payments may not include one, hence sparse.
transactionSchema.index({ razorpayPaymentId: 1 }, { unique: true, sparse: true });
transactionSchema.index(
  { userId: 1, createdAt: -1 },
  { name: "query_user_created_at_desc" },
);
transactionSchema.index(
  { status: 1, createdAt: -1 },
  { name: "query_status_created_at_desc" },
);
transactionSchema.index({ createdAt: -1 }, { name: "query_created_at_desc" });

module.exports = mongoose.model("Transaction", transactionSchema);
