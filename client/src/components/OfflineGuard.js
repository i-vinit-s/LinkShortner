"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const HEALTH_URL = `${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/v1\/?$/, "")}/health`;
const ROUTE_STORAGE_KEY = "shortlink:last-route";
const ONLINE_INTERVAL_MS = 7000;
const OFFLINE_INTERVAL_MS = 4000;
const REQUEST_TIMEOUT_MS = 5000;

function currentRoute(search) {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
}

function saveRoute(route) {
  try {
    window.localStorage.setItem(ROUTE_STORAGE_KEY, route);
  } catch {
    // The current in-memory route still works when storage is unavailable.
  }
}

function getSavedRoute() {
  try {
    const route = window.localStorage.getItem(ROUTE_STORAGE_KEY);
    if (!route || !route.startsWith("/") || route.startsWith("//")) return null;
    const parsed = new URL(route, window.location.origin);
    if (parsed.origin !== window.location.origin) return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

function routeLabel(route) {
  if (!route || typeof window === "undefined") return "";
  try {
    return new URL(route, window.location.origin).pathname;
  } catch {
    return "";
  }
}

function OfflineScreen({ route, onRetry, checking }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-5 py-12" role="main">
      <section className="w-full max-w-lg border-y border-white/15 py-9 sm:py-12" aria-labelledby="offline-title">
        <div className="mb-7 flex h-11 w-11 items-center justify-center rounded-xl border border-signal/30 bg-signal/10 text-signal" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9a14 14 0 0 1 18 0M6.5 12.5a9 9 0 0 1 11 0M10 16a3.8 3.8 0 0 1 4 0M3 3l18 18" />
          </svg>
        </div>
        <p className="mb-2 text-sm font-medium text-signal">Connection interrupted</p>
        <h1 id="offline-title" className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">ShortLink is temporarily offline.</h1>
        <p className="mt-4 max-w-md leading-7 text-text-muted">We can’t reach the service right now. We’ll keep checking in the background and return you to the page you were using as soon as it’s available.</p>
        {routeLabel(route) ? <p className="mt-6 text-sm text-text-muted">We’ll return to <span className="break-all font-mono text-white">{routeLabel(route)}</span></p> : null}
        <div className="mt-8 flex items-center gap-4">
          <button onClick={onRetry} disabled={checking} className="ui-button-primary focus-ring min-w-32">
            {checking ? "Checking..." : "Try again"}
          </button>
          <span className="text-sm text-text-muted" role="status" aria-live="polite">{checking ? "Checking connection" : "Retrying automatically"}</span>
        </div>
      </section>
    </main>
  );
}

function OfflineMonitor({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams.toString();
  const currentPath = `${pathname || "/"}${search ? `?${search}` : ""}`;
  const currentPathRef = useRef(currentPath);
  const offlineRef = useRef(false);
  const checkRef = useRef(null);
  const [offline, setOffline] = useState(false);
  const [offlineRoute, setOfflineRoute] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const rememberRoute = () => {
      const route = currentRoute(search);
      currentPathRef.current = route;
      if (!offlineRef.current) saveRoute(route);
    };

    rememberRoute();
    window.addEventListener("hashchange", rememberRoute);
    window.addEventListener("popstate", rememberRoute);
    return () => {
      window.removeEventListener("hashchange", rememberRoute);
      window.removeEventListener("popstate", rememberRoute);
    };
  }, [currentPath, search]);

  useEffect(() => {
    let stopped = false;
    let retryTimer;
    let requestTimer;

    const checkConnection = async (manual = false) => {
      if (stopped) return;
      if (manual) {
        clearTimeout(retryTimer);
        setChecking(true);
      }

      const controller = new AbortController();
      requestTimer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      let isOnline = false;

      try {
        const response = await fetch(HEALTH_URL, {
          cache: "no-store",
          signal: controller.signal,
        });
        isOnline = response.ok;
      } catch {
        isOnline = false;
      } finally {
        clearTimeout(requestTimer);
      }

      if (stopped) return;
      setChecking(false);

      if (isOnline) {
        if (offlineRef.current) {
          const savedRoute = getSavedRoute() || currentPathRef.current;
          offlineRef.current = false;
          setOffline(false);
          setOfflineRoute("");
          if (savedRoute !== currentPathRef.current) {
            router.replace(savedRoute, { scroll: false });
          }
          try {
            window.localStorage.removeItem(ROUTE_STORAGE_KEY);
          } catch {
            // Route restoration has already been scheduled.
          }
        } else {
          saveRoute(currentRoute(search));
        }
      } else {
        const route = getSavedRoute() || currentRoute(search);
        saveRoute(route);
        setOfflineRoute(route);
        offlineRef.current = true;
        setOffline(true);
      }

      retryTimer = setTimeout(
        () => checkConnection(),
        offlineRef.current ? OFFLINE_INTERVAL_MS : ONLINE_INTERVAL_MS,
      );
    };

    checkRef.current = checkConnection;
    checkConnection();

    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      clearTimeout(requestTimer);
      checkRef.current = null;
    };
  }, [router, search]);

  if (offline) {
    return <OfflineScreen route={offlineRoute} onRetry={() => checkRef.current?.(true)} checking={checking} />;
  }

  return children;
}

export default function OfflineGuard({ children }) {
  return (
    <Suspense fallback={children}>
      <OfflineMonitor>{children}</OfflineMonitor>
    </Suspense>
  );
}
