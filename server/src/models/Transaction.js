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

module.exports = mongoose.model("Transaction", transactionSchema);
