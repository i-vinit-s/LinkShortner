"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";

export default function ShortLinkPage() {
  const params = useParams();
  const [status, setStatus] = useState("loading"); // loading | password | error
  const [errorMsg, setErrorMsg] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const resolve = async () => {
      try {
        const res = await api.get("/resolve/" + params.shortCode);
        if (res.data.requiresPassword) {
          setStatus("password");
        } else {
          window.location.href = res.data.longUrl;
        }
      } catch (err) {
        const data = err.response && err.response.data;
        const msg =
          data && data.message ? data.message : "This link could not be found.";
        setErrorMsg(msg);
        setStatus(data && data.expired ? "expired" : "error");
      }
    };
    resolve();
  }, [params.shortCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await api.post("/resolve/" + params.shortCode + "/verify", {
        password,
      });
      window.location.href = res.data.longUrl;
    } catch (err) {
      const msg =
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : "Incorrect password";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Redirecting...</p>
      </div>
    );
  }

  if (status === "error" || status === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <p className="text-4xl">{status === "expired" ? "⏳" : "🔗"}</p>
          <p className="text-gray-700 font-medium">{errorMsg}</p>
          <p className="text-sm text-gray-400">
            {status === "expired"
              ? "This link is no longer accessible."
              : "Double-check the URL and try again."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm space-y-4"
      >
        <h1 className="text-lg font-semibold text-center">
          This link is password protected
        </h1>
        {errorMsg && (
          <p className="text-red-500 text-sm text-center">{errorMsg}</p>
        )}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          className="w-full border rounded px-3 py-2"
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-black text-white rounded py-2 disabled:opacity-50"
        >
          {submitting ? "Checking..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
