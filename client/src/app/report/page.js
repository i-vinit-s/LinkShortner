"use client";

import { useState } from "react";
import api from "@/lib/api";
import PublicHeader from "@/components/PublicHeader";

export default function ReportPage() {
  var [form, setForm] = useState({
    shortCodeOrUrl: "",
    reason: "",
    reporterEmail: "",
  });
  var [status, setStatus] = useState("idle"); // idle | submitting | success | error
  var [errorMsg, setErrorMsg] = useState("");

  var handleChange = function (e) {
    var next = Object.assign({}, form);
    next[e.target.name] = e.target.value;
    setForm(next);
  };

  var handleSubmit = async function (e) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    try {
      await api.post("/reports", form);
      setStatus("success");
      setForm({ shortCodeOrUrl: "", reason: "", reporterEmail: "" });
    } catch (err) {
      var msg = "Failed to submit report";
      if (err.response && err.response.data && err.response.data.message) {
        msg = err.response.data.message;
      }
      setErrorMsg(msg);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-ink">
      <PublicHeader />
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-5 py-12">
      <div className="max-w-md w-full space-y-6">
        <div>
          <p className="mb-2 text-sm text-text-muted">Help keep the network useful</p>
          <h1 className="text-3xl font-display font-semibold tracking-tight text-white">Report a link</h1>
          <p className="text-sm text-text-muted mt-2">
            If a short link is being used for phishing, malware, or other
            harmful purposes, let us know and we&apos;ll investigate.
          </p>
        </div>

        {status === "success" ? (
          <div className="bg-led/10 border border-led/30 rounded-md p-4 text-sm text-led" role="status" aria-live="polite">
            Thank you — your report has been submitted and will be reviewed
            shortly.
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            aria-busy={status === "submitting"}
            className="bg-surface border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl"
          >
            {errorMsg ? (
              <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2" role="alert" aria-live="assertive">
                {errorMsg}
              </p>
            ) : null}

            <label className="block text-sm font-medium text-white">Short link or code<input
              name="shortCodeOrUrl"
              value={form.shortCodeOrUrl}
              onChange={handleChange}
              placeholder="shortlink.app/abc123"
              className="ui-input focus-ring mt-2"
              required
            /></label>

            <label className="block text-sm font-medium text-white">What should we know?<textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              placeholder="Tell us what looks harmful or misleading"
              rows={4}
              className="ui-input focus-ring mt-2 h-28 resize-none py-3"
              required
            /></label>

            <label className="block text-sm font-medium text-white">Email <span className="font-normal text-text-muted">optional</span><input
              name="reporterEmail"
              type="email"
              value={form.reporterEmail}
              onChange={handleChange}
              placeholder="you@example.com"
              className="ui-input focus-ring mt-2"
            /></label>

            <button
              type="submit"
              disabled={status === "submitting"}
              aria-busy={status === "submitting"}
              className="ui-button-primary focus-ring w-full"
            >
              {status === "submitting" ? "Submitting..." : "Submit report"}
            </button>
          </form>
        )}
      </div>
      </main>
    </div>
  );
}
