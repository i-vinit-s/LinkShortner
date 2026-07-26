"use client";

import { useState } from "react";
import Link from "next/link";
import QrModal from "./QrModal";

function OdometerCount(props) {
  var value = props.value;
  var digits = String(value).split("");
  return (
    <span className="font-mono tabular-nums">
      {digits.map(function (d, i) {
        return (
          <span key={i} className="odometer-digit">
            {d}
          </span>
        );
      })}
    </span>
  );
}

export default function LinkCard(props) {
  var link = props.link;
  var onDelete = props.onDelete;
  var selected = props.selected;
  var onToggleSelect = props.onToggleSelect;

  var [copied, setCopied] = useState(false);
  var [showQr, setShowQr] = useState(false);

  var shortUrl = process.env.NEXT_PUBLIC_APP_URL + "/" + link.shortCode;
  var now = new Date();
  var isExpired = false;
  if (link.expiresAt) {
    if (new Date(link.expiresAt) < now) {
      isExpired = true;
    }
  }
  var isLive = link.isActive && !isExpired;

  var dotClass = "w-2 h-2 rounded-full shrink-0 bg-text-muted/40";
  if (isLive) {
    dotClass = "w-2 h-2 rounded-full shrink-0 bg-led led-active";
  }

  var dotLabel = "Inactive";
  if (isLive) {
    dotLabel = "Active";
  }

  var handleCopy = async function () {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(function () {
      setCopied(false);
    }, 1500);
  };

  var copyLabel = "Copy";
  if (copied) {
    copyLabel = "Copied";
  }

  return (
    <div
      className={
        "border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 transition-colors " +
        (selected
          ? "border-signal bg-surface-raised"
          : "border-white/10 bg-surface")
      }
    >
      <div className="min-w-0 flex items-center gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={function () {
            onToggleSelect(link._id);
          }}
          className="accent-signal w-4 h-4 shrink-0"
        />
        <span className={dotClass} title={dotLabel}></span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <a
              href={shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm bg-surface-raised border border-white/10 rounded px-2 py-0.5 text-wire hover:border-wire transition-colors"
            >
              /{link.shortCode}
            </a>
          </div>
          <p className="text-sm text-text-muted truncate max-w-md mt-1">
            {link.longUrl}
          </p>
          {link.tags && link.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-1">
              {link.tags.map(function (tag) {
                return (
                  <span
                    key={tag}
                    className="text-xs bg-wire/10 text-wire rounded px-1.5 py-0.5 font-mono"
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          ) : null}
          <p className="text-xs text-text-muted/70 mt-1 font-mono">
            <OdometerCount value={link.clickCount} /> clicks -{" "}
            {new Date(link.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 justify-end sm:justify-normal w-full sm:w-auto">
        <button
          onClick={handleCopy}
          className="text-sm border border-white/15 rounded-md px-3 py-1.5 text-text-muted hover:text-white hover:border-white/30 transition-colors"
        >
          {copyLabel}
        </button>
        <button
          onClick={function () {
            setShowQr(true);
          }}
          className="text-sm border border-white/15 rounded-md px-3 py-1.5 text-text-muted hover:text-white hover:border-white/30 transition-colors"
        >
          QR
        </button>
        <Link
          href={"/dashboard/" + link._id}
          className="text-sm border border-white/15 rounded-md px-3 py-1.5 text-text-muted hover:text-white hover:border-white/30 transition-colors"
        >
          Analytics
        </Link>
        <button
          onClick={function () {
            onDelete(link._id);
          }}
          className="text-sm border border-danger/30 text-danger rounded-md px-3 py-1.5 hover:bg-danger/10 transition-colors"
        >
          Delete
        </button>
      </div>

      {showQr ? (
        <QrModal
          linkId={link._id}
          onClose={function () {
            setShowQr(false);
          }}
        />
      ) : null}
    </div>
  );
}
