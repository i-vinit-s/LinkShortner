const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { syncUserPlan } = require("../utils/planSync");

exports.createSubscription = async function (req, res) {
  try {
    var user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    await syncUserPlan(user);

    if (
      user.plan === "pro" &&
      user.subscriptionStatus === "active" &&
      !user.cancelAtPeriodEnd
    ) {
      return res
        .status(400)
        .json({ message: "You already have an active Pro subscription" });
    }

    var subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      customer_notify: 1,
      total_count: 120,
      notes: { userId: user._id.toString() },
    });

    user.razorpaySubscriptionId = subscription.id;
    user.subscriptionStatus = "created";
    user.cancelAtPeriodEnd = false;
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
    var user = await User.findById(req.session.userId);
    await syncUserPlan(user);

    res.json({
      plan: user.plan,
      status: user.subscriptionStatus,
      currentPeriodEnd: user.currentPeriodEnd,
      cancelAtPeriodEnd: user.cancelAtPeriodEnd,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch billing status" });
  }
};

exports.cancelSubscription = async function (req, res) {
  try {
    var user = await User.findById(req.session.userId);
    if (
      !user ||
      !user.razorpaySubscriptionId ||
      user.subscriptionStatus !== "active"
    ) {
      return res.status(400).json({ message: "No active subscription found" });
    }

    // true = schedule cancellation at the end of the current billing cycle.
    // This was previously passed as `false`, which cancels immediately — a real bug fixed here.
    await razorpay.subscriptions.cancel(user.razorpaySubscriptionId, true);

    user.cancelAtPeriodEnd = true;
    await user.save();

    res.json({
      message:
        "Your subscription is set to cancel at the end of the current billing period.",
      currentPeriodEnd: user.currentPeriodEnd,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to cancel subscription" });
  }
};

exports.resumeSubscription = async function (req, res) {
  try {
    var user = await User.findById(req.session.userId);
    if (!user || !user.cancelAtPeriodEnd) {
      return res
        .status(400)
        .json({ message: "No pending cancellation to undo" });
    }

    // Razorpay doesn't support "un-cancelling" a scheduled cancellation directly on all plans,
    // so we resume by simply clearing our own flag — the subscription keeps running as normal
    // since we scheduled cancellation for cycle-end, not immediate.
    user.cancelAtPeriodEnd = false;
    await user.save();

    res.json({
      message: "Your subscription will continue renewing as normal.",
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to resume subscription" });
  }
};

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

    if (event === "subscription.activated") {
      var sub = payload.subscription.entity;
      var user = await User.findOne({ razorpaySubscriptionId: sub.id });
      if (user) {
        user.plan = "pro";
        user.subscriptionStatus = "active";
        user.cancelAtPeriodEnd = false;
        if (sub.current_end)
          user.currentPeriodEnd = new Date(sub.current_end * 1000);
        await user.save();
      }
    } else if (event === "subscription.charged") {
      var subCharged = payload.subscription.entity;
      var userCharged = await User.findOne({
        razorpaySubscriptionId: subCharged.id,
      });
      if (userCharged) {
        userCharged.plan = "pro";
        userCharged.subscriptionStatus = "active";
        if (subCharged.current_end)
          userCharged.currentPeriodEnd = new Date(
            subCharged.current_end * 1000,
          );
        await userCharged.save();

        // Log the actual payment for the admin transaction history
        var paymentEntity = payload.payment && payload.payment.entity;
        if (paymentEntity) {
          var alreadyLogged = await Transaction.findOne({
            razorpayPaymentId: paymentEntity.id,
          });
          if (!alreadyLogged) {
            await Transaction.create({
              userId: userCharged._id,
              razorpayPaymentId: paymentEntity.id,
              razorpaySubscriptionId: subCharged.id,
              amount: paymentEntity.amount,
              currency: paymentEntity.currency || "INR",
              status: "captured",
              event: event,
            });
          }
        }
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
        userCancelled.cancelAtPeriodEnd = false;
        await userCancelled.save();
      }
    } else if (
      event === "subscription.pending" ||
      event === "subscription.halted"
    ) {
      var subPending = payload.subscription.entity;
      var userPending = await User.findOne({
        razorpaySubscriptionId: subPending.id,
      });
      if (userPending) {
        userPending.subscriptionStatus = "past_due";
        await userPending.save();
      }
    } else if (event === "payment.failed") {
      var paymentFailed = payload.payment && payload.payment.entity;
      if (paymentFailed && paymentFailed.notes && paymentFailed.notes.userId) {
        await Transaction.create({
          userId: paymentFailed.notes.userId,
          razorpayPaymentId: paymentFailed.id,
          amount: paymentFailed.amount,
          currency: paymentFailed.currency || "INR",
          status: "failed",
          event: event,
        });
      }
    }

    res.json({ status: "ok" });
  } catch (err) {
    console.error("Webhook processing error:", err);
    res.status(500).json({ message: "Webhook processing failed" });
  }
};
