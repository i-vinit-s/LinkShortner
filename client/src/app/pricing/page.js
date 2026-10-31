"use client";

import { useState } from "react";
import Script from "next/script";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import PublicHeader from "@/components/PublicHeader";

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
        theme: { color: "#F1B84B" },
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
      <div className="min-h-screen bg-ink">
        <PublicHeader />
        <main className="px-5 py-16 sm:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-10 max-w-xl">
            <p className="mb-2 text-sm text-text-muted">Plans that scale with your links</p>
            <h1 className="text-4xl font-display font-semibold tracking-tight text-white">Keep the useful parts close.</h1>
            <p className="mt-3 text-base leading-7 text-text-muted">Start free. Upgrade when you need more bio pages and a cleaner public presence.</p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="bg-surface border border-white/10 rounded-2xl p-6 space-y-5 sm:p-8">
              <h2 className="font-display font-semibold text-white text-xl">
                Free
              </h2>
              <p className="text-4xl font-display font-semibold tracking-tight text-white">
                Rs.0
                <span className="text-sm text-text-muted font-body">/mo</span>
              </p>
              <ul className="space-y-3 border-t border-white/10 pt-5 text-sm leading-6 text-text-muted">
                <li>Unlimited shortened links</li>
                <li>Full analytics dashboard</li>
                <li>Password protection &amp; expiry</li>
                <li>1 bio page</li>
                <li>&quot;Made with ShortLink&quot; branding on your bio page</li>
              </ul>
            </div>

            <div className="bg-surface border border-signal/50 rounded-2xl p-6 space-y-5 relative sm:p-8">
              <span className="absolute -top-3 left-6 bg-signal text-ink text-xs font-display font-medium px-2 py-0.5 rounded">
                Pro
              </span>
              <h2 className="font-display font-semibold text-white text-xl">Pro</h2>
              <p className="text-4xl font-display font-semibold tracking-tight text-white">
                Rs.99
                <span className="text-sm text-text-muted font-body">/mo</span>
              </p>
              <ul className="space-y-3 border-t border-white/10 pt-5 text-sm leading-6 text-text-muted">
                <li>Everything in Free</li>
                <li>Unlimited bio pages</li>
                <li>No branding on your bio pages</li>
                <li>Priority for future features</li>
              </ul>

              {error ? <p className="text-sm text-danger" role="alert" aria-live="assertive">{error}</p> : null}

              <button
                onClick={handleUpgrade}
                disabled={loading}
                aria-busy={loading}
                className="ui-button-primary focus-ring w-full"
              >
                {loading ? "Loading..." : "Upgrade to Pro"}
              </button>
            </div>
          </div>
        </div>
        </main>
      </div>
    </>
  );
}
