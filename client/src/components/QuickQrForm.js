"use client";

import { useState } from "react";
import api from "@/lib/api";

export default function QuickQrForm() {
  var [url, setUrl] = useState("");
  var [qrDataUrl, setQrDataUrl] = useState(null);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState("");

  var handleSubmit = async function (e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setQrDataUrl(null);
    try {
      var res = await api.post("/qr/generate", { url: url });
      setQrDataUrl(res.data.qrDataUrl);
    } catch (err) {
      if (err.response && err.response.status === 429) {
        setError(
          "Too many QR codes generated — try again in " +
            err.response.data.retryAfter +
            "s",
        );
      } else {
        var msg = "Failed to generate QR code";
        if (err.response && err.response.data && err.response.data.message) {
          msg = err.response.data.message;
        }
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  var handleDownload = function () {
    var a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "qr-code.png";
    a.click();
  };

  return (
    <div className="bg-surface border border-white/10 rounded-lg p-5 space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          value={url}
          onChange={function (e) {
            setUrl(e.target.value);
          }}
          placeholder="Paste any URL to generate a QR code..."
          className="flex-1 bg-surface-raised border border-white/10 rounded-md px-3 py-2.5 text-white placeholder:text-text-muted focus:outline-none focus:border-signal"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-signal text-ink font-display font-medium rounded-md px-5 py-2.5 hover:brightness-110 transition disabled:opacity-50 shrink-0"
        >
          {loading ? "Generating..." : "Generate QR"}
        </button>
      </form>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {qrDataUrl ? (
        <div className="flex flex-col items-center gap-3 pt-2">
          <div className="bg-white rounded-lg p-4">
            <img
              src={qrDataUrl}
              alt="QR code"
              className="w-full max-w-50"
            />
          </div>
          <button
            onClick={handleDownload}
            className="text-sm border border-white/15 rounded-md px-4 py-2 text-text-muted hover:text-white hover:border-white/30 transition-colors"
          >
            Download PNG
          </button>
        </div>
      ) : null}
    </div>
  );
}
