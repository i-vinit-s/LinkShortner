"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { SkeletonBlock } from "@/components/LoadingSkeleton";

export default function BillingStatus() {
  var [status, setStatus] = useState(null);
  var [loading, setLoading] = useState(true);
  var [actionLoading, setActionLoading] = useState(false);
  var [feedback, setFeedback] = useState(null);

  var loadStatus = async function () {
    try {
      var res = await api.get("/billing/status");
      setStatus(res.data);
    } catch (err) {
      console.error(err);
      setFeedback({
        type: "error",
        text: "We couldn’t load your billing status. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(function () {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    setFeedback(null);
    try {
      var res = await api.post("/billing/cancel");
      setFeedback({ type: "success", text: res.data.message });
      await loadStatus();
    } catch (err) {
      setFeedback({
        type: "error",
        text:
          err.response && err.response.data && err.response.data.message
            ? err.response.data.message
            : "We couldn’t cancel your subscription. Please try again.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  var handleResume = async function () {
    setActionLoading(true);
    setFeedback(null);
    try {
      var res = await api.post("/billing/resume");
      setFeedback({ type: "success", text: res.data.message });
      await loadStatus();
    } catch (err) {
      setFeedback({
        type: "error",
        text:
          err.response && err.response.data && err.response.data.message
            ? err.response.data.message
            : "We couldn’t resume your subscription. Please try again.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !status) {
    return (
      <div className="rounded-lg border border-white/10 bg-surface p-4 text-sm text-text-muted" role="status">
        <span className="sr-only">Loading billing status</span>
        <div className="flex items-center justify-between gap-4" aria-hidden="true">
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-3 w-40" />
          </div>
          <SkeletonBlock className="h-10 w-28 rounded-md" />
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="rounded-lg border border-white/10 bg-surface p-4">
        <p className="text-sm text-danger" role="alert">
          {feedback?.text || "Billing status is unavailable."}
        </p>
        <button
          type="button"
          onClick={loadStatus}
          className="mt-3 text-sm font-medium text-signal underline-offset-4 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

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
              You&apos;re on Pro until {periodEndStr}, then your account moves to
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
              Your last payment didn&apos;t go through — please resubscribe.
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

      {feedback ? (
        <p
          className={`basis-full text-sm ${feedback.type === "error" ? "text-danger" : "text-signal"}`}
          role={feedback.type === "error" ? "alert" : "status"}
          aria-live={feedback.type === "error" ? "assertive" : "polite"}
        >
          {feedback.text}
        </p>
      ) : null}
    </div>
  );
}
