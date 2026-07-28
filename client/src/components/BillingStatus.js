"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export default function BillingStatus() {
  var [status, setStatus] = useState(null);
  var [loading, setLoading] = useState(true);

  useEffect(function () {
    var load = async function () {
      try {
        var res = await api.get("/billing/status");
        setStatus(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  var handleCancel = async function () {
    if (
      !confirm(
        "Cancel your Pro subscription? You'll keep access until the end of the current billing period.",
      )
    )
      return;
    try {
      var res = await api.post("/billing/cancel");
      alert(res.data.message);
    } catch (err) {
      alert("Failed to cancel subscription");
    }
  };

  if (loading || !status) return null;

  return (
    <div className="bg-surface border border-white/10 rounded-lg p-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-sm text-white font-medium">
          {status.plan === "pro" ? "Pro plan" : "Free plan"}
        </p>
        {status.plan === "pro" && status.currentPeriodEnd ? (
          <p className="text-xs text-text-muted mt-0.5">
            Renews {new Date(status.currentPeriodEnd).toLocaleDateString()}
          </p>
        ) : null}
      </div>

      {status.plan === "free" ? (
        <Link
          href="/pricing"
          className="text-sm bg-signal text-ink font-display font-medium rounded-md px-4 py-2 hover:brightness-110 transition"
        >
          Upgrade to Pro
        </Link>
      ) : (
        <button
          onClick={handleCancel}
          className="text-sm border border-white/15 text-text-muted rounded-md px-4 py-2 hover:text-white"
        >
          Cancel plan
        </button>
      )}
    </div>
  );
}
