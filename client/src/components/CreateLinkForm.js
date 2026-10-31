"use client";

import { useState } from "react";
import api from "@/lib/api";
import TagInput from "./TagInput";

export default function CreateLinkForm({ onCreated }) {
  const [longUrl, setLongUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const payload = { longUrl };
      if (customAlias) payload.customAlias = customAlias;
      if (password) payload.password = password;
      if (expiresAt) payload.expiresAt = new Date(expiresAt).toISOString();
      if (tags.length > 0) payload.tags = tags;

      const res = await api.post("/links", payload);
      onCreated(res.data.link);
      setSuccess("Your short link is ready.");

      setLongUrl("");
      setCustomAlias("");
      setPassword("");
      setExpiresAt("");
      setTags([]);
    } catch (err) {
      if (err.response?.status === 429) {
        setError(
          `Rate limited — try again in ${err.response.data.retryAfter}s`,
        );
      } else {
        setError(err.response?.data?.message || "Failed to create link");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-white/10 bg-[#181818] p-5 space-y-4 sm:p-6"
    >
      <div className="space-y-2">
        <label htmlFor="dashboard-long-url" className="text-sm font-medium text-white">Destination URL</label>
        <input
          id="dashboard-long-url"
          type="url"
          inputMode="url"
          value={longUrl}
          onChange={(e) => setLongUrl(e.target.value)}
          placeholder="https://example.com/your-destination"
          className="focus-ring min-h-12 w-full rounded-lg border border-white/10 bg-[#1F1F1F] px-4 text-white placeholder:text-[#777777] focus:border-signal focus:outline-none transition-colors"
          required
          aria-invalid={!!error}
          aria-describedby={error ? "create-link-error" : undefined}
        />
        {error && <p id="create-link-error" className="text-sm text-danger" role="alert">{error}</p>}
        {success ? <p className="text-sm text-led" role="status" aria-live="polite">{success}</p> : null}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="focus-ring rounded text-sm text-[#9B9B9B] hover:text-white transition-colors"
        >
          {showAdvanced ? "Hide" : "Show"} advanced options
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label htmlFor="create-link-alias" className="sr-only">Custom alias</label>
              <input
                id="create-link-alias"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                placeholder="Custom alias"
                className="bg-surface-raised border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-signal"
              />
              <label htmlFor="create-link-password" className="sr-only">Link password</label>
              <input
                id="create-link-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password protect"
                className="bg-surface-raised border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-signal"
              />
              <label htmlFor="create-link-expiry" className="sr-only">Link expiration date and time</label>
              <input
                id="create-link-expiry"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="bg-surface-raised border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-signal"
              />
            </div>

            <TagInput tags={tags} setTags={setTags} />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="focus-ring min-h-11 w-full rounded-lg bg-signal px-4 text-base font-semibold text-ink transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-50 sm:w-auto"
      >
        {loading ? "Creating link…" : "Shorten URL"}
      </button>
    </form>
  );
}
