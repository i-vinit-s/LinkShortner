const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const User = require("../models/User");

exports.createSubscription = async function (req, res) {
  try {
    var user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.plan === "pro" && user.subscriptionStatus === "active") {
      return res
        .status(400)
        .json({ message: "You already have an active Pro subscription" });
    }

    var subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      customer_notify: 1,
      total_count: 120, // effectively "until cancelled" — 120 monthly cycles (10 years)
      notes: {
        userId: user._id.toString(),
      },
    });

    user.razorpaySubscriptionId = subscription.id;
    user.subscriptionStatus = "created";
    await user.save();

    res.json({
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create subscription" });
  }
};

exports.getBillingStatus = async function (req, res) {
  try {
    var user = await User.findById(req.session.userId).select(
      "plan subscriptionStatus currentPeriodEnd",
    );
    res.json({
      plan: user.plan,
      status: user.subscriptionStatus,
      currentPeriodEnd: user.currentPeriodEnd,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch billing status" });
  }
};

exports.cancelSubscription = async function (req, res) {
  try {
    var user = await User.findById(req.session.userId);
    if (!user || !user.razorpaySubscriptionId) {
      return res.status(400).json({ message: "No active subscription found" });
    }

    await razorpay.subscriptions.cancel(user.razorpaySubscriptionId, false); // false = cancel at end of current cycle, not immediately

    res.json({
      message:
        "Your subscription will end at the close of the current billing period",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to cancel subscription" });
  }
};

// --- Webhook: the actual source of truth for subscription state ---
exports.handleWebhook = async function (req, res) {
  try {
    var signature = req.headers["x-razorpay-signature"];
    var expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Invalid Razorpay webhook signature");
      return res.status(400).json({ message: "Invalid signature" });
    }

    var event = req.body.event;
    var payload = req.body.payload;

    if (
      event === "subscription.activated" ||
      event === "subscription.charged"
    ) {
      var sub = payload.subscription.entity;
      var user = await User.findOne({ razorpaySubscriptionId: sub.id });
      if (user) {
        user.plan = "pro";
        user.subscriptionStatus = "active";
        if (sub.current_end) {
          user.currentPeriodEnd = new Date(sub.current_end * 1000);
        }
        await user.save();
      }
    } else if (
      event === "subscription.cancelled" ||
      event === "subscription.completed"
    ) {
      var subCancelled = payload.subscription.entity;
      var userCancelled = await User.findOne({
        razorpaySubscriptionId: subCancelled.id,
      });
      if (userCancelled) {
        userCancelled.plan = "free";
        userCancelled.subscriptionStatus = "cancelled";
        await userCancelled.save();
      }
    } else if (
      event === "subscription.pending" ||
      event === "subscription.halted"
    ) {
      // Payment failed / retry window — downgrade to be safe, but don't hard-delete anything
      var subPending = payload.subscription.entity;
      var userPending = await User.findOne({
        razorpaySubscriptionId: subPending.id,
      });
      if (userPending) {
        userPending.subscriptionStatus = "past_due";
        await userPending.save();
      }
    }

    res.json({ status: "ok" });
  } catch (err) {
    console.error("Webhook processing error:", err);
    res.status(500).json({ message: "Webhook processing failed" });
  }
};
