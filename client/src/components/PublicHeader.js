"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

export default function PublicHeader() {
  const { user, loading } = useAuth();

  if (user && !loading) return <Navbar />;

  if (loading) {
    return (
      <header className="border-b border-white/10 px-5 sm:px-8" aria-busy="true">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4">
          <Link href="/" aria-label="ShortLink home" className="focus-ring rounded-md font-display text-lg font-semibold tracking-tight text-white">
            <span aria-hidden="true" className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-signal" />
            ShortLink
          </Link>
          <span aria-hidden="true" className="h-9 w-28 animate-pulse rounded-md bg-surface motion-reduce:animate-none" />
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-white/10 px-5 sm:px-8">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4">
        <Link href="/" aria-label="ShortLink home" className="focus-ring rounded-md font-display text-lg font-semibold tracking-tight text-white">
          <span aria-hidden="true" className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-signal" />
          ShortLink
        </Link>
        <nav aria-label="Public navigation" className="flex items-center gap-2 sm:gap-4">
          <Link href="/pricing" className="focus-ring rounded-md px-3 py-2 text-sm text-text-muted transition-colors hover:text-white">
            Pricing
          </Link>
          <Link href="/login" className="focus-ring rounded-md border border-white/15 px-3 py-2 text-sm text-white transition-colors hover:border-white/30">
            Log in
          </Link>
        </nav>
      </div>
    </header>
  );
}
