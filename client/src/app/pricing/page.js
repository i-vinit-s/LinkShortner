"use client";

import { useState } from "react";
import Script from "next/script";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function PricingPage() {
  var authState = useAuth();
  var router = useRouter();
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState("");

  var handleUpgrade = async function () {
    if (!authState.user) {
      router.push("/login");
      return;
    }

    setError("");
    setLoading(true);
    try {
      var res = await api.post("/billing/create-subscription");
      var subscriptionId = res.data.subscriptionId;
      var keyId = res.data.keyId;

      var options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: "ShortLink Pro",
        description: "Monthly subscription",
        theme: { color: "#F5A623" },
        handler: function () {
          // Webhook confirms activation server-side; just send them to the dashboard
          router.push("/dashboard?upgraded=true");
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      var rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      var msg = "Failed to start checkout";
      if (err.response && err.response.data && err.response.data.message) {
        msg = err.response.data.message;
      }
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      <div className="min-h-screen bg-ink flex items-center justify-center px-4 py-16">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest text-wire font-mono mb-2">
              Pricing
            </p>
            <h1 className="text-3xl font-display font-bold text-white">
              Simple, honest pricing
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-surface border border-white/10 rounded-xl p-6 space-y-4">
              <h2 className="font-display font-bold text-white text-lg">
                Free
              </h2>
              <p className="text-3xl font-display font-bold text-white">
                Rs.0
                <span className="text-sm text-text-muted font-body">/mo</span>
              </p>
              <ul className="space-y-2 text-sm text-text-muted">
                <li>Unlimited shortened links</li>
                <li>Full analytics dashboard</li>
                <li>Password protection &amp; expiry</li>
                <li>1 bio page</li>
                <li>&quot;Made with ShortLink&quot; branding on your bio page</li>
              </ul>
            </div>

            <div className="bg-surface border border-signal rounded-xl p-6 space-y-4 relative">
              <span className="absolute -top-3 left-6 bg-signal text-ink text-xs font-display font-medium px-2 py-0.5 rounded">
                Pro
              </span>
              <h2 className="font-display font-bold text-white text-lg">Pro</h2>
              <p className="text-3xl font-display font-bold text-white">
                Rs.99
                <span className="text-sm text-text-muted font-body">/mo</span>
              </p>
              <ul className="space-y-2 text-sm text-text-muted">
                <li>Everything in Free</li>
                <li>Unlimited bio pages</li>
                <li>No branding on your bio pages</li>
                <li>Priority for future features</li>
              </ul>

              {error ? <p className="text-sm text-danger">{error}</p> : null}

              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full bg-signal text-ink font-display font-medium rounded-md py-2.5 hover:brightness-110 transition disabled:opacity-50"
              >
                {loading ? "Loading..." : "Upgrade to Pro"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
