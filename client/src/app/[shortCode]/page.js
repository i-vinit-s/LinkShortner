"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { SkeletonBlock } from "@/components/LoadingSkeleton";

export default function ShortLinkPage() {
  const params = useParams();
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const resolve = async () => {
      try {
        const response = await api.get("/resolve/" + params.shortCode, { params: { ref: document.referrer } });
        if (response.data.requiresPassword) setStatus("password");
        else window.location.href = response.data.longUrl;
      } catch (error) {
        const data = error.response?.data;
        setErrorMsg(data?.message || "This link could not be found.");
        setStatus(data?.expired ? "expired" : "error");
      }
    };
    resolve();
  }, [params.shortCode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    try {
      const response = await api.post("/resolve/" + params.shortCode + "/verify", { password, ref: document.referrer });
      window.location.href = response.data.longUrl;
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Incorrect password");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B0D10] px-5" role="status" aria-label="Checking this link" aria-busy="true">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-surface p-8">
          <SkeletonBlock className="mx-auto h-3 w-3 rounded-full" />
          <SkeletonBlock className="mx-auto h-6 w-48 max-w-full" />
          <SkeletonBlock className="mx-auto h-4 w-64 max-w-full" />
        </div>
      </main>
    );
  }

  if (status === "error" || status === "expired") {
    return <div className="flex min-h-screen items-center justify-center bg-[#0B0D10] px-5"><div className="w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-surface p-8 text-center shadow-2xl"><div aria-hidden="true" className="mx-auto h-3 w-3 rounded-full bg-danger" /><p className="font-display text-lg font-semibold text-white">{status === "expired" ? "This link has expired" : "This link is unavailable"}</p><p className="text-sm leading-6 text-text-muted">{errorMsg}</p><p className="text-sm text-text-muted">{status === "expired" ? "This destination is no longer accessible." : "Double check the URL and try again."}</p></div></div>;
  }

  return <div className="flex min-h-screen items-center justify-center bg-[#0B0D10] px-5"><form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl sm:p-8"><div><p className="mb-2 text-sm text-text-muted">A private destination</p><h1 className="font-display text-2xl font-semibold tracking-tight text-white">Enter the link password</h1></div>{errorMsg ? <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{errorMsg}</p> : null}<label htmlFor="protected-link-password" className="sr-only">Link password</label><input id="protected-link-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" className="ui-input focus-ring" required /><button type="submit" disabled={submitting} className="ui-button-primary focus-ring w-full">{submitting ? "Checking..." : "Continue"}</button></form></div>;
}
