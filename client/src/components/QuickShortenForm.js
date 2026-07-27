"use client";

import { useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

export default function QuickShortenForm() {
  var [longUrl, setLongUrl] = useState("");
  var [result, setResult] = useState(null);
  var [error, setError] = useState("");
  var [loading, setLoading] = useState(false);
  var [copied, setCopied] = useState(false);

  var handleSubmit = async function (e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setResult(null);
    try {
      var res = await api.post("/links", { longUrl: longUrl });
      setResult(res.data.link);
      setLongUrl("");
    } catch (err) {
      if (err.response && err.response.status === 429) {
        setError(
          "Too many links created — try again in " +
            err.response.data.retryAfter +
            "s, or sign up for a higher limit.",
        );
      } else {
        var msg = "Failed to shorten URL";
        if (err.response && err.response.data && err.response.data.message) {
          msg = err.response.data.message;
        }
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  var shortUrl = result
    ? process.env.NEXT_PUBLIC_APP_URL + "/" + result.shortCode
    : "";

  var handleCopy = async function () {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(function () {
      setCopied(false);
    }, 1500);
  };

  return (
    <div className="w-full max-w-md space-y-3">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          value={longUrl}
          onChange={function (e) {
            setLongUrl(e.target.value);
          }}
          placeholder="Paste a long URL..."
          className="flex-1 bg-surface-raised border border-white/10 rounded-md px-3 py-2.5 text-white placeholder:text-text-muted focus:outline-none focus:border-signal"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-signal text-ink font-display font-medium rounded-md px-5 py-2.5 hover:brightness-110 transition disabled:opacity-50 shrink-0"
        >
          {loading ? "Shortening..." : "Shorten"}
        </button>
      </form>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {result ? (
        <div className="bg-surface border border-white/10 rounded-md p-3 flex items-center justify-between gap-3">
          <a
            href={shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm text-wire truncate"
          >
            {shortUrl}
          </a>
          <button
            onClick={handleCopy}
            className="text-xs border border-white/15 rounded-md px-3 py-1.5 text-text-muted hover:text-white shrink-0"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      ) : null}

      <p className="text-xs text-text-muted text-center">
        Anonymous links expire in 14 days.{" "}
        <Link href="/signup" className="text-wire hover:underline">
          Sign up
        </Link>{" "}
        for permanent links, custom aliases, password protection, QR codes, and
        click analytics.
      </p>
    </div>
  );
}
