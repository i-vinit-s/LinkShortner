"use client";

import { useEffect, useSyncExternalStore } from "react";
import Icon from "@/components/Icon";
import { applyMotionPreference, isMotionEnabled, MOTION_PREFERENCE_EVENT, setMotionEnabled } from "@/lib/motionPreference";

function subscribe(callback) {
  window.addEventListener(MOTION_PREFERENCE_EVENT, callback);
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (mediaQuery.addEventListener) mediaQuery.addEventListener("change", callback);
  else mediaQuery.addListener(callback);
  return () => {
    window.removeEventListener(MOTION_PREFERENCE_EVENT, callback);
    if (mediaQuery.removeEventListener) mediaQuery.removeEventListener("change", callback);
    else mediaQuery.removeListener(callback);
  };
}

function getServerSnapshot() {
  return null;
}

export default function MotionToggle({ compact = false, onlyWhenDisabled = false }) {
  const enabled = useSyncExternalStore(subscribe, isMotionEnabled, getServerSnapshot);
  useEffect(() => {
    applyMotionPreference();
  }, [enabled]);
  if (enabled === null || (onlyWhenDisabled && enabled)) return null;

  const label = compact ? "Enable motion" : `Motion ${enabled ? "on" : "off"}`;

  return (
    <button
      type="button"
      onClick={() => {
        const next = !isMotionEnabled();
        setMotionEnabled(next);
      }}
      aria-label={enabled ? "Turn motion off" : "Turn motion on"}
      aria-pressed={enabled}
      className={compact
        ? "focus-ring inline-flex h-10 w-10 items-center justify-center gap-2 rounded-md border border-signal/30 px-0 text-sm font-medium text-signal transition-colors hover:bg-signal/10 sm:h-auto sm:w-auto sm:px-3"
        : "focus-ring inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-xs text-text-muted transition-colors hover:text-white"}
    >
      <Icon name="sparkles" size={compact ? 16 : 15} />
      <span className={compact ? "sr-only sm:not-sr-only" : ""}>{label}</span>
    </button>
  );
}
