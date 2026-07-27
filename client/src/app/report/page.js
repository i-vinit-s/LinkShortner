"use client";

import { useState } from "react";
import api from "@/lib/api";

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
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-wire font-mono mb-1">
            Trust &amp; safety
          </p>
          <h1 className="text-2xl font-display font-bold text-white">
            Report a link
          </h1>
          <p className="text-sm text-text-muted mt-2">
            If a short link is being used for phishing, malware, or other
            harmful purposes, let us know and we&apos;ll investigate.
          </p>
        </div>

        {status === "success" ? (
          <div className="bg-led/10 border border-led/30 rounded-md p-4 text-sm text-led">
            Thank you — your report has been submitted and will be reviewed
            shortly.
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-surface border border-white/10 rounded-lg p-6 space-y-3"
          >
            {errorMsg ? (
              <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2">
                {errorMsg}
              </p>
            ) : null}

            <input
              name="shortCodeOrUrl"
              value={form.shortCodeOrUrl}
              onChange={handleChange}
              placeholder="Short link or code (e.g. yourapp.com/abc123)"
              className="w-full bg-surface-raised border border-white/10 rounded-md px-3 py-2.5 text-white placeholder:text-text-muted focus:outline-none focus:border-signal"
              required
            />

            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              placeholder="Describe why you're reporting this link"
              rows={4}
              className="w-full bg-surface-raised border border-white/10 rounded-md px-3 py-2.5 text-white placeholder:text-text-muted focus:outline-none focus:border-signal resize-none"
              required
            />

            <input
              name="reporterEmail"
              type="email"
              value={form.reporterEmail}
              onChange={handleChange}
              placeholder="Your email (optional, for follow-up)"
              className="w-full bg-surface-raised border border-white/10 rounded-md px-3 py-2.5 text-white placeholder:text-text-muted focus:outline-none focus:border-signal"
            />

            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full bg-signal text-ink font-display font-medium rounded-md py-2.5 hover:brightness-110 disabled:opacity-50"
            >
              {status === "submitting" ? "Submitting..." : "Submit report"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
