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

    // Also blocks while a cancellation is pending: a second subscription would bill
    // the user again for the period they already paid for.
    if (user.plan === "pro" && user.subscriptionStatus === "active") {
      return res.status(400).json({
        message: user.cancelAtPeriodEnd
          ? "Your Pro plan is still active until the end of the current period. You can subscribe again after that."
          : "You already have an active Pro subscription",
      });
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

    var id = user.razorpaySubscriptionId;
    try {
      // true = cancel at the end of the current billing cycle (Pro stays until then)
      await razorpay.subscriptions.cancel(id, true);
    } catch (err) {
      var reason = err && err.error && err.error.description;
      console.error(
        "Razorpay cancel failed:",
        err && err.statusCode,
        reason || err,
      );

      // Razorpay may already be ending this subscription (cancelled earlier, or a
      // cancellation is already scheduled). Then only our flag is out of sync: fix it.
      var remote = await razorpay.subscriptions.fetch(id).catch(function () {
        return null;
      });
      var alreadyEnding =
        remote &&
        (remote.status === "cancelled" ||
          remote.status === "completed" ||
          remote.has_scheduled_changes);
      if (!alreadyEnding) {
        return res
          .status(502)
          .json({ message: reason || "Failed to cancel subscription" });
      }
    }

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

    // Clearing only our own flag would be a lie: Razorpay would still cancel at the
    // end of the period. Ask Razorpay to drop the scheduled cancellation, and only
    // clear our flag if it agrees.
    try {
      await razorpay.subscriptions.cancelScheduledChanges(
        user.razorpaySubscriptionId,
      );
    } catch (err) {
      console.error(
        "Razorpay resume failed:",
        err && err.statusCode,
        (err && err.error && err.error.description) || err,
      );
      return res.status(409).json({
        message:
          "This cancellation can't be undone. Your Pro plan stays active until the end of the current period; you can subscribe again after that.",
      });
    }

    user.cancelAtPeriodEnd = false;
    await user.save();

    res.json({
      message: "Your subscription will continue renewing as normal.",
    });
  } catch (err) {
    console.error(err);
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
        // halted = Razorpay gave up retrying the payment; "pending" is still a retry, so keep Pro for that
        if (event === "subscription.halted") userPending.plan = "free";
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
