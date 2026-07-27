"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

export default function QrModal({ linkId, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [shortUrl, setShortUrl] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadQr = async () => {
      try {
        const res = await api.get("/qr/" + linkId);
        setQrDataUrl(res.data.qrDataUrl);
        setShortUrl(res.data.shortUrl);
        setShortCode(res.data.shortCode);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadQr();
  }, [linkId]);

  const handleDownload = function () {
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = (shortCode || "qr-code") + ".png";
    a.click();
  };

  const handleCopy = async function () {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(function () {
      setCopied(false);
    }, 1500);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-white/10 rounded-xl p-6 max-w-sm w-full text-center space-y-5 shadow-2xl"
        onClick={function (e) {
          e.stopPropagation();
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display font-medium text-white text-sm">
            QR Code
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-text-muted hover:text-white transition-colors w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/10"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="5" y1="5" x2="19" y2="19" />
              <line x1="19" y1="5" x2="5" y2="19" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="py-10">
            <div className="w-8 h-8 mx-auto border-2 border-white/10 border-t-signal rounded-full animate-spin" />
            <p className="text-text-muted text-xs mt-3">Generating...</p>
          </div>
        ) : qrDataUrl ? (
          <>
            <div className="bg-white rounded-lg p-4 inline-block mx-auto">
              <img
                src={qrDataUrl}
                alt="QR code"
                className="w-full max-w-[220px]"
              />
            </div>

            <div className="bg-surface-raised border border-white/10 rounded-md pl-3 pr-1.5 py-1.5 flex items-center gap-2">
              <p className="text-xs font-mono text-wire break-all flex-1 text-left">
                {shortUrl}
              </p>
              <button
                onClick={handleCopy}
                aria-label="Copy link"
                title={copied ? "Copied" : "Copy link"}
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded text-text-muted hover:text-white hover:bg-white/10 transition-colors"
              >
                {copied ? (
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="flex-1 text-sm bg-signal text-ink font-display font-medium rounded-md py-2.5 hover:brightness-110 transition"
              >
                Download
              </button>
              <button
                onClick={onClose}
                className="flex-1 text-sm border border-white/15 text-text-muted rounded-md py-2.5 hover:text-white hover:border-white/30 transition-colors"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <div className="py-8 space-y-3">
            <p className="text-danger text-sm">Failed to load QR code</p>
            <button
              onClick={onClose}
              className="text-sm border border-white/15 text-text-muted rounded-md px-4 py-2 hover:text-white hover:border-white/30 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
