async function syncUserPlan(user) {
  if (user.plan === "pro" && user.cancelAtPeriodEnd && user.currentPeriodEnd) {
    if (new Date(user.currentPeriodEnd) < new Date()) {
      user.plan = "free";
      user.subscriptionStatus = "cancelled";
      user.cancelAtPeriodEnd = false;
      await user.save();
    }
  }
  return user;
}

module.exports = { syncUserPlan };
