const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const billing = require("../controllers/billing.controller");

router.post("/create-subscription", requireAuth, billing.createSubscription);
router.get("/status", requireAuth, billing.getBillingStatus);
router.post("/cancel", requireAuth, billing.cancelSubscription);
router.post("/resume", requireAuth, billing.resumeSubscription);
router.post("/webhook", billing.handleWebhook); // public — Razorpay calls this directly, no session exists

module.exports = router;
