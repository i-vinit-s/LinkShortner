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
  var onReactivate = props.onReactivate;
  var selected = props.selected;
  var onToggleSelect = props.onToggleSelect;
  var onEditDestination = props.onEditDestination;

  var [copied, setCopied] = useState(false);
  var [showQr, setShowQr] = useState(false);
  var [editing, setEditing] = useState(false);
  var [draft, setDraft] = useState("");
  var [saving, setSaving] = useState(false);
  var [editError, setEditError] = useState("");

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

  var startEdit = function () {
    setDraft(link.longUrl);
    setEditError("");
    setEditing(true);
  };

  var cancelEdit = function () {
    setEditing(false);
    setEditError("");
  };

  var handleSave = async function () {
    var next = draft.trim();
    if (!next || next === link.longUrl) {
      cancelEdit();
      return;
    }
    setSaving(true);
    setEditError("");
    try {
      await onEditDestination(link._id, next);
      setEditing(false);
    } catch (err) {
      setEditError(err.message || "Failed to update link");
    } finally {
      setSaving(false);
    }
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
          {editing ? (
            <div className="mt-1 w-full max-w-md">
              <input
                autoFocus
                value={draft}
                onChange={function (e) {
                  setDraft(e.target.value);
                }}
                onKeyDown={function (e) {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") cancelEdit();
                }}
                placeholder="https://new-destination.com"
                className="w-full bg-surface-raised border border-white/10 rounded-md px-2 py-1 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-signal"
              />
              {editError ? (
                <p className="text-xs text-danger mt-1">{editError}</p>
              ) : null}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-xs border border-led/40 text-led rounded-md px-2 py-1 hover:bg-led/10 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="text-xs border border-white/15 text-text-muted rounded-md px-2 py-1 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-text-muted/70 mt-1">
                The short link and QR code stay the same. Only where they point
                changes.
              </p>
            </div>
          ) : (
            <p className="text-sm text-text-muted truncate max-w-md mt-1">
              {link.longUrl}
            </p>
          )}
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
        {link.deactivatedBy !== "admin" ? (
          <button
            onClick={startEdit}
            disabled={editing}
            className="text-sm border border-white/15 rounded-md px-3 py-1.5 text-text-muted hover:text-white hover:border-white/30 disabled:opacity-40 transition-colors"
          >
            Edit
          </button>
        ) : null}
        <Link
          href={"/dashboard/" + link._id}
          className="text-sm border border-white/15 rounded-md px-3 py-1.5 text-text-muted hover:text-white hover:border-white/30 transition-colors"
        >
          Analytics
        </Link>
        {link.isActive ? (
          <button
            onClick={function () {
              onDelete(link._id);
            }}
            className="text-sm border border-danger/30 text-danger rounded-md px-3 py-1.5 hover:bg-danger/10 transition-colors"
          >
            Deactivate
          </button>
        ) : !isExpired && link.deactivatedBy === "user" ? (
          <button
            onClick={function () {
              onReactivate(link._id);
            }}
            className="text-sm border border-led/40 text-led rounded-md px-3 py-1.5 hover:bg-led/10 transition-colors"
          >
            Activate
          </button>
        ) : link.deactivatedBy === "admin" ? (
          <span
            className="text-xs text-text-muted px-2"
            title="This link was disabled by an administrator"
          >
            Disabled by admin
          </span>
        ) : null}
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
