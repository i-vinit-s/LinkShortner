"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export default function BillingStatus() {
  var [status, setStatus] = useState(null);
  var [loading, setLoading] = useState(true);
  var [actionLoading, setActionLoading] = useState(false);

  var loadStatus = async function () {
    try {
      var res = await api.get("/billing/status");
      setStatus(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(function () {
    loadStatus();
  }, []);

  var handleCancel = async function () {
    if (
      !confirm(
        "Cancel your Pro subscription? You'll keep Pro access until the end of the current billing period, then move to Free.",
      )
    )
      return;
    setActionLoading(true);
    try {
      var res = await api.post("/billing/cancel");
      alert(res.data.message);
      loadStatus();
    } catch (err) {
      alert("Failed to cancel subscription");
    } finally {
      setActionLoading(false);
    }
  };

  var handleResume = async function () {
    setActionLoading(true);
    try {
      var res = await api.post("/billing/resume");
      alert(res.data.message);
      loadStatus();
    } catch (err) {
      alert("Failed to resume subscription");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !status) return null;

  var periodEndStr = status.currentPeriodEnd
    ? new Date(status.currentPeriodEnd).toLocaleDateString()
    : null;

  return (
    <div className="bg-surface border border-white/10 rounded-lg p-4 flex items-center justify-between gap-3 flex-wrap">
      <div>
        {status.plan === "pro" && status.cancelAtPeriodEnd ? (
          <>
            <p className="text-sm text-white font-medium">
              Pro plan (cancelling)
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              You're on Pro until {periodEndStr}, then your account moves to
              Free.
            </p>
          </>
        ) : status.plan === "pro" ? (
          <>
            <p className="text-sm text-white font-medium">Pro plan</p>
            {periodEndStr ? (
              <p className="text-xs text-text-muted mt-0.5">
                Renews {periodEndStr}
              </p>
            ) : null}
          </>
        ) : status.status === "past_due" ? (
          <>
            <p className="text-sm text-danger font-medium">Payment issue</p>
            <p className="text-xs text-text-muted mt-0.5">
              Your last payment didn't go through — please resubscribe.
            </p>
          </>
        ) : (
          <p className="text-sm text-white font-medium">Free plan</p>
        )}
      </div>

      {status.plan === "pro" && status.cancelAtPeriodEnd ? (
        <button
          onClick={handleResume}
          disabled={actionLoading}
          className="text-sm border border-signal text-signal rounded-md px-4 py-2 hover:bg-signal/10 disabled:opacity-50"
        >
          {actionLoading ? "..." : "Resume subscription"}
        </button>
      ) : status.plan === "pro" ? (
        <button
          onClick={handleCancel}
          disabled={actionLoading}
          className="text-sm border border-white/15 text-text-muted rounded-md px-4 py-2 hover:text-white disabled:opacity-50"
        >
          {actionLoading ? "..." : "Cancel plan"}
        </button>
      ) : (
        <Link
          href="/pricing"
          className="text-sm bg-signal text-ink font-display font-medium rounded-md px-4 py-2 hover:brightness-110 transition"
        >
          Upgrade to Pro
        </Link>
      )}
    </div>
  );
}
