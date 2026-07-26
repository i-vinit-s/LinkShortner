"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function QrModal({ linkId, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [shortUrl, setShortUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQr = async () => {
      try {
        const res = await api.get("/qr/" + linkId);
        setQrDataUrl(res.data.qrDataUrl);
        setShortUrl(res.data.shortUrl);
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
    a.download = "qr-code.png";
    a.click();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-sm w-full text-center space-y-4"
        onClick={function (e) {
          e.stopPropagation();
        }}
      >
        <h2 className="font-semibold">QR Code</h2>

        {loading ? (
          <p className="text-gray-500 text-sm">Generating...</p>
        ) : qrDataUrl ? (
          <>
            <img src={qrDataUrl} alt="QR code" className="mx-auto" />
            <p className="text-xs text-gray-500 break-all">{shortUrl}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleDownload}
                className="text-sm bg-black text-white rounded px-4 py-2"
              >
                Download
              </button>
              <button
                onClick={onClose}
                className="text-sm border rounded px-4 py-2"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <p className="text-red-500 text-sm">Failed to load QR code</p>
        )}
      </div>
    </div>
  );
}
