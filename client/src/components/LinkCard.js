"use client";

import { useState } from "react";
import Link from "next/link";
import QrModal from "./QrModal";
import Icon from "@/components/Icon";

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
  var [copyError, setCopyError] = useState(false);
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
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(function () {
        setCopied(false);
      }, 1500);
    } catch {
      setCopyError(true);
    }
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
        "border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 transition-colors " +
        (selected
          ? "border-signal/70 bg-[#272727]"
          : "border-white/10 bg-[#181818]")
      }
    >
      <div className="min-w-0 flex items-center gap-3">
        <input
          type="checkbox"
          checked={selected}
          aria-label={`Select short link ${link.shortCode}`}
          onChange={function () {
            onToggleSelect(link._id);
          }}
          className="accent-signal w-4 h-4 shrink-0"
        />
        <span className={dotClass} title={dotLabel} role="img" aria-label={`Status: ${dotLabel}`}></span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <a
              href={shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring rounded-md border border-wire/30 bg-wire/10 px-2.5 py-1 font-mono text-sm text-wire transition-colors hover:border-wire"
            >
              /{link.shortCode}
            </a>
          </div>
          {editing ? (
            <div className="mt-1 w-full max-w-md">
              <input
                id={`destination-${link._id}`}
                autoFocus
                value={draft}
                aria-label="Destination URL"
                aria-invalid={!!editError}
                aria-describedby={editError ? `destination-error-${link._id}` : undefined}
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
                <p id={`destination-error-${link._id}`} className="text-xs text-danger mt-1" role="alert">{editError}</p>
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
            <p className="mt-2 max-w-md truncate text-sm text-[#B7B7B7]">
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
          <p className="mt-2 text-xs text-[#777777]">
            <OdometerCount value={link.clickCount} /> clicks ·{" "}
            {new Date(link.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 justify-end sm:justify-normal w-full sm:w-auto">
        <button
          onClick={handleCopy}
          aria-live="polite"
          className="focus-ring ui-button-secondary inline-flex items-center gap-2 text-sm"
        >
          <Icon name={copied ? "check" : "copy"} size={16} />{copyLabel}
        </button>
        <button
          onClick={function () {
            setShowQr(true);
          }}
          className="focus-ring ui-button-secondary inline-flex items-center gap-2 text-sm"
        >
          <Icon name="qr" size={16} />QR
        </button>
        {link.deactivatedBy !== "admin" ? (
          <button
            onClick={startEdit}
            disabled={editing}
            className="focus-ring ui-button-secondary inline-flex items-center gap-2 text-sm disabled:opacity-40"
          >
            <Icon name="edit" size={16} />Edit
          </button>
        ) : null}
        <Link
          href={"/dashboard/" + link._id}
          className="focus-ring ui-button-secondary inline-flex items-center gap-2 text-sm"
        >
          <Icon name="chart" size={16} />Analytics
        </Link>
        {link.isActive ? (
          <button
            onClick={function () {
              onDelete(link._id);
            }}
            className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg border border-danger/30 px-3 text-sm text-danger transition-colors hover:bg-danger/10"
          >
            <Icon name="power" size={16} />Deactivate
          </button>
        ) : !isExpired && link.deactivatedBy === "user" ? (
          <button
            onClick={function () {
              onReactivate(link._id);
            }}
            className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg border border-led/40 px-3 text-sm text-led transition-colors hover:bg-led/10"
          >
            <Icon name="check" size={16} />Activate
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

      {copyError ? (
        <p className="basis-full text-xs text-danger" role="alert">
          Couldn’t copy the link. Check clipboard permissions and try again.
        </p>
      ) : null}

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
