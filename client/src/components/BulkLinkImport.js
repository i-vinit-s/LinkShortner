"use client";

import { useState } from "react";
import Papa from "papaparse";
import api from "@/lib/api";

const MAX_FILE_BYTES = 9000;
const MAX_ROWS = 25;
const RESERVED_ALIASES = new Set([
  "api", "login", "signup", "dashboard", "admin", "health",
]);

function inspectCsv(text) {
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim().toLowerCase(),
  });
  if (parsed.errors.some((error) => error.code !== "UndetectableDelimiter")) {
    return { error: "CSV formatting is invalid. Check quoted fields and row widths." };
  }

  const fields = parsed.meta.fields || [];
  if (!fields.includes("url")) return { error: "The CSV needs a url column." };
  if (fields.some((field) => !["url", "alias", "tags"].includes(field))) {
    return { error: "Supported columns are url, alias, and tags." };
  }
  if (parsed.data.length === 0) return { error: "The CSV has no rows to import." };
  if (parsed.data.length > MAX_ROWS) return { error: `Import up to ${MAX_ROWS} rows at a time.` };

  const seenUrls = new Set();
  const seenAliases = new Set();
  const rows = parsed.data.map((record, index) => {
    const url = typeof record.url === "string" ? record.url.trim() : "";
    const alias = typeof record.alias === "string" ? record.alias.trim() : "";
    const tags = typeof record.tags === "string" ? parseTags(record.tags) : [];
    const errors = [];
    const aliasKey = alias.toLowerCase();

    if (!url) errors.push("URL is required.");
    else {
      try {
        const parsedUrl = new URL(url);
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
          errors.push("Only HTTP and HTTPS URLs are supported.");
        }
      } catch {
        errors.push("Enter a valid URL.");
      }
      if (url.length > 2048) errors.push("URL is longer than 2,048 characters.");
      if (seenUrls.has(url)) errors.push("Duplicate URL in this file.");
    }

    if (alias) {
      if (!/^[a-zA-Z0-9_-]{3,20}$/.test(alias)) errors.push("Alias must be 3–20 letters, numbers, dashes, or underscores.");
      else if (RESERVED_ALIASES.has(aliasKey)) errors.push("This alias is reserved.");
      else if (seenAliases.has(aliasKey)) errors.push("Duplicate alias in this file.");
    }

    if (tags.length > 5 || tags.some((tag) => tag.length > 20)) {
      errors.push("Use up to five tags; each tag can be at most 20 characters.");
    }

    if (errors.length === 0) {
      seenUrls.add(url);
      if (alias) seenAliases.add(aliasKey);
    }

    return { row: index + 2, url, alias, tags, errors };
  });

  return { rows };
}

function parseTags(value) {
  const tags = [];
  let current = "";
  let escaped = false;
  for (const character of value) {
    if (escaped) {
      current += character;
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    } else if (character === "|") {
      tags.push(current);
      current = "";
    } else {
      current += character;
    }
  }
  if (escaped) current += "\\";
  tags.push(current);
  return tags.map((tag) => tag.trim()).filter(Boolean);
}

function downloadTemplate() {
  const blob = new Blob(
    ["url,alias,tags\r\nhttps://example.com,,campaign|launch\r\n"],
    { type: "text/csv;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "shortlink-import-template.csv";
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function resultLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function BulkLinkImport({ onImported }) {
  const [fileName, setFileName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [rows, setRows] = useState([]);
  const [parseError, setParseError] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setFileName("");
    setCsvText("");
    setRows([]);
    setResults(null);
    setParseError("");
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setParseError("Choose a CSV file smaller than 9 KB.");
      return;
    }

    try {
      const text = await file.text();
      const preview = inspectCsv(text);
      if (preview.error) {
        setParseError(preview.error);
        return;
      }
      setFileName(file.name);
      setCsvText(text);
      setRows(preview.rows);
    } catch {
      setParseError("Couldn't read this file. Try saving it as UTF-8 CSV.");
    }
  };

  const handleImport = async () => {
    if (!csvText || !rows.some((row) => row.errors.length === 0)) return;
    setLoading(true);
    setParseError("");
    setResults(null);
    try {
      const response = await api.post("/links/import", csvText, {
        headers: { "Content-Type": "text/csv" },
      });
      setResults(response.data);
      if (response.data.summary.created > 0 && onImported) onImported();
    } catch (error) {
      const partial = error.response?.data;
      if (partial?.results) {
        setResults(partial);
        if (partial.summary?.created > 0 && onImported) onImported();
      }
      setParseError(partial?.message || "Import failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <details className="rounded-xl border border-white/10 bg-[#181818]">
      <summary className="focus-ring cursor-pointer list-none rounded-xl px-5 py-4 text-sm font-medium text-white marker:hidden">
        Import links from CSV
      </summary>
      <div className="space-y-4 border-t border-white/10 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-2xl text-sm leading-6 text-text-muted">
            Preview up to {MAX_ROWS} rows before importing. Required column: <code className="font-mono text-white">url</code>. Optional columns: <code className="font-mono text-white">alias</code> and <code className="font-mono text-white">tags</code> (separate tags with |; escape a literal pipe as \|).
          </p>
          <button type="button" onClick={downloadTemplate} className="ui-button-secondary focus-ring min-h-10 text-sm">
            Download template
          </button>
        </div>
        <label htmlFor="bulk-link-csv" className="block text-sm font-medium text-white">CSV file</label>
        <input
          id="bulk-link-csv"
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          className="focus-ring block min-h-11 w-full rounded-lg border border-white/10 bg-[#1F1F1F] p-2 text-sm text-text-muted file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:text-white"
          aria-describedby="bulk-link-csv-help"
        />
        <p id="bulk-link-csv-help" className="text-xs text-text-muted">Maximum file size: 9 KB. Duplicate URLs and aliases are skipped.</p>
        {fileName ? <p className="text-sm text-text-muted">Previewing {fileName}</p> : null}
        {parseError ? <p className="text-sm text-danger" role="alert">{parseError}</p> : null}

        {rows.length ? (
          <div className="space-y-3">
            <div className="max-h-72 overflow-auto rounded-lg border border-white/10">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <caption className="sr-only">CSV import preview and row validation</caption>
                <thead className="sticky top-0 bg-surface-raised text-xs text-text-muted">
                  <tr><th className="px-3 py-2">Row</th><th className="px-3 py-2">Destination</th><th className="px-3 py-2">Alias</th><th className="px-3 py-2">Preview</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rows.map((row) => (
                    <tr key={row.row}>
                      <td className="px-3 py-2 font-mono text-text-muted">{row.row}</td>
                      <td className="max-w-80 break-all px-3 py-2 text-white">{row.url || "—"}</td>
                      <td className="px-3 py-2 font-mono text-text-muted">{row.alias || "—"}</td>
                      <td className={`px-3 py-2 ${row.errors.length ? "text-danger" : "text-led"}`}>
                        {row.errors.length ? row.errors.join(" ") : "Ready"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={handleImport}
              disabled={loading || !rows.some((row) => row.errors.length === 0)}
              className="ui-button-primary focus-ring min-h-11 disabled:cursor-wait disabled:opacity-50"
            >
              {loading ? "Importing links…" : `Import ${rows.filter((row) => row.errors.length === 0).length} valid rows`}
            </button>
          </div>
        ) : null}

        {results ? (
          <div className="space-y-2" role="status" aria-live="polite">
            <p className="text-sm text-white">
              Import complete: {results.summary.created || 0} created, {results.summary.duplicate || 0} duplicates, {results.summary.invalid || 0} invalid, {results.summary.unsafe || 0} unsafe, {results.summary.blocked || 0} blocked, {results.summary.failed || 0} failed.
            </p>
            <ul className="max-h-36 space-y-1 overflow-auto text-xs text-text-muted">
              {results.results.map((result) => (
                <li key={`${result.row}-${result.status}`}>
                  Row {result.row}: {resultLabel(result.status)}{result.shortCode ? ` — /${result.shortCode}` : ""}{result.message ? ` — ${result.message}` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </details>
  );
}
