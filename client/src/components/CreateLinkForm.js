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
  const [loading, setLoading] = useState(false);
  var [tags, setTags] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = { longUrl };
      if (customAlias) payload.customAlias = customAlias;
      if (password) payload.password = password;
      if (expiresAt) payload.expiresAt = new Date(expiresAt).toISOString();
      if (tags.length > 0) payload.tags = tags;

      const res = await api.post("/links", payload);
      onCreated(res.data.link);

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
      className="bg-surface border border-white/10 rounded-lg p-5 space-y-3"
    >
      <input
        value={longUrl}
        onChange={(e) => setLongUrl(e.target.value)}
        placeholder="Paste a long URL to shorten..."
        className="w-full bg-surface-raised border border-white/10 rounded-md px-3 py-2.5 text-white placeholder:text-text-muted focus:outline-none focus:border-signal transition-colors"
        required
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-xs uppercase tracking-wide text-text-muted hover:text-wire transition-colors"
      >
        {showAdvanced ? "Hide" : "Show"} advanced options
      </button>

      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            value={customAlias}
            onChange={(e) => setCustomAlias(e.target.value)}
            placeholder="Custom alias"
            className="bg-surface-raised border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-signal"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password protect"
            className="bg-surface-raised border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-signal"
          />
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="bg-surface-raised border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-signal"
          />
          <TagInput tags={tags} setTags={setTags} />
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-signal text-ink font-display font-medium rounded-md px-4 py-2.5 hover:brightness-110 transition disabled:opacity-50"
      >
        {loading ? "Patching in..." : "Shorten URL"}
      </button>
    </form>
  );
}
