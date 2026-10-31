"use client";

import { useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

export default function QuickShortenForm() {
  const [longUrl, setLongUrl] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const response = await api.post("/links", { longUrl });
      setResult(response.data.link);
      setLongUrl("");
    } catch (requestError) {
      if (requestError.response?.status === 429) {
        setError(`Too many links created. Try again in ${requestError.response.data.retryAfter}s.`);
      } else {
        setError(requestError.response?.data?.message || "We could not shorten that URL.");
      }
    } finally {
      setLoading(false);
    }
  };

  const shortUrl = result ? `${process.env.NEXT_PUBLIC_APP_URL}/${result.shortCode}` : "";

  const handleCopy = async () => {
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopyError(true);
    }
  };

  return (
    <div id="shorten" className="w-full max-w-xl space-y-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row" aria-label="Shorten a URL">
        <label htmlFor="quick-short-url" className="sr-only">Long URL</label>
        <input
          id="quick-short-url"
          type="url"
          inputMode="url"
          value={longUrl}
          onChange={(event) => setLongUrl(event.target.value)}
          placeholder="Paste a long URL"
          className="focus-ring min-h-12 flex-1 rounded-lg border border-white/15 bg-[#1F1F1F] px-4 text-base text-white placeholder:text-[#777777] transition-colors focus:border-signal focus:outline-none"
          required
          aria-describedby="quick-short-help"
        />
        <button type="submit" disabled={loading} className="focus-ring min-h-12 shrink-0 rounded-lg bg-signal px-5 text-base font-semibold text-ink transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-50">
          {loading ? "Shortening..." : "Shorten link"}
        </button>
      </form>

      {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}

      {result ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-led/25 bg-led/5 p-3" role="status" aria-live="polite">
          <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="focus-ring truncate rounded text-sm text-led">{shortUrl}</a>
          <button type="button" onClick={handleCopy} aria-label={copied ? "Short link copied" : "Copy short link"} className="focus-ring shrink-0 rounded-md border border-white/15 px-3 py-2 text-sm text-[#B7B7B7] hover:text-white">{copied ? "Copied" : "Copy"}</button>
        </div>
      ) : null}

      {copyError ? <p className="text-sm text-danger" role="alert">Couldn’t copy the link. Check clipboard permissions and try again.</p> : null}

      <p id="quick-short-help" className="text-pretty text-sm leading-6 text-[#777777]">Anonymous links expire in 14 days. <Link href="/signup" className="text-wire hover:underline">Create a free account</Link> for permanent links, custom aliases, password protection, QR codes, and analytics.</p>
    </div>
  );
}
