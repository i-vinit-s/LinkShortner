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
    <div className="border border-white/10 bg-surface rounded-lg p-4 flex justify-between items-center gap-4">
      <div className="min-w-0 flex items-center gap-3">
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
          <p className="text-xs text-text-muted/70 mt-1 font-mono">
            <OdometerCount value={link.clickCount} /> clicks -{" "}
            {new Date(link.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
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
