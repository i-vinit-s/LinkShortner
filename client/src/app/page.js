"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    );
  }

  if (user) {
    // Redirect is in flight via the effect above — render nothing to avoid a flash of landing content
    return null;
  }

  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-4 text-center gap-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-wire font-mono mb-2">
          URL Shortener
        </p>
        <h1 className="text-4xl font-display font-bold text-white">
          Short<span className="text-signal">Link</span>
        </h1>
        <p className="text-text-muted mt-3 max-w-sm mx-auto">
          Patch long URLs into short, trackable links — with analytics, password
          protection, and expiry built in.
        </p>
      </div>

      <div className="flex gap-3">
        <a
          href="/signup"
          className="bg-signal text-ink font-display font-medium rounded-md px-5 py-2.5 hover:brightness-110 transition"
        >
          Get started
        </a>
        <a
          href="/login"
          className="border border-white/15 text-white rounded-md px-5 py-2.5 hover:border-white/30 transition"
        >
          Log in
        </a>
      </div>
    </div>
  );
}
