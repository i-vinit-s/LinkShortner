"use client";

import { useEffect, useState, useRef } from "react";

var HEALTH_URL =
  (process.env.NEXT_PUBLIC_API_URL || "").replace("/api/v1", "") + "/health";
var CHECK_INTERVAL_MS = 7000;

export default function LatencyIndicator() {
  var [status, setStatus] = useState("checking"); // checking | online | offline
  var [latency, setLatency] = useState(null);
  var timeoutRef = useRef(null);

  useEffect(function () {
    var cancelled = false;

    var checkHealth = async function () {
      var start = performance.now();
      try {
        var controller = new AbortController();
        var timeoutId = setTimeout(function () {
          controller.abort();
        }, 5000);

        var res = await fetch(HEALTH_URL, { signal: controller.signal });
        clearTimeout(timeoutId);

        var elapsed = Math.round(performance.now() - start);

        if (cancelled) return;

        if (res.ok) {
          setStatus("online");
          setLatency(elapsed);
        } else {
          setStatus("offline");
          setLatency(null);
        }
      } catch (err) {
        if (cancelled) return;
        setStatus("offline");
        setLatency(null);
      }

      if (!cancelled) {
        timeoutRef.current = setTimeout(checkHealth, CHECK_INTERVAL_MS);
      }
    };

    checkHealth();

    return function () {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  var dotColor = "bg-text-muted";
  var label = "Checking...";

  if (status === "online") {
    if (latency < 200) {
      dotColor = "bg-led";
      label = latency + "ms";
    } else if (latency < 600) {
      dotColor = "bg-signal";
      label = latency + "ms";
    } else {
      dotColor = "bg-signal";
      label = latency + "ms (slow)";
    }
  } else if (status === "offline") {
    dotColor = "bg-danger";
    label = "Server unreachable";
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-2 bg-surface border border-white/10 rounded-full px-3 py-1.5 shadow-lg">
        <span
          className={
            "w-2 h-2 rounded-full shrink-0 " +
            dotColor +
            (status === "checking" ? " animate-pulse" : "")
          }
        />
        <span className="text-xs font-mono text-text-muted">{label}</span>
      </div>
    </div>
  );
}
