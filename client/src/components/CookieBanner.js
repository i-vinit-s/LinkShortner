"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function CookieBanner() {
  var [mounted, setMounted] = useState(false);
  var [dismissed, setDismissed] = useState(true);

  useEffect(function () {
    var seen = localStorage.getItem("cookie_notice_seen");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(!!seen);
    setMounted(true);
  }, []);

  var handleDismiss = function () {
    localStorage.setItem("cookie_notice_seen", "true");
    setDismissed(true);
  };

  // On the server, and on the client's very first render, this is always true —
  // so server and client HTML match exactly. The real value is applied a moment
  // later, after hydration completes, via the effect above.
  if (!mounted || dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-white/10 px-4 py-3 z-50">
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-xs text-text-muted">
          We use a single essential cookie to keep you signed in. No ads, no
          tracking. See our{" "}
          <Link href="/cookies" className="text-wire hover:underline">
            Cookie Notice
          </Link>
          .
        </p>
        <button
          onClick={handleDismiss}
          className="text-xs bg-signal text-ink font-display font-medium rounded-md px-3 py-1.5 hover:brightness-110 shrink-0"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
