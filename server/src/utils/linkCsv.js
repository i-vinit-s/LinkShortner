const Papa = require("papaparse");

const MAX_IMPORT_BYTES = 9000;
const MAX_IMPORT_ROWS = 25;
const ALLOWED_IMPORT_COLUMNS = new Set(["url", "alias", "tags"]);

function parseDelimitedTags(value) {
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

function serializeDelimitedTags(tags) {
  return (tags || []).map((tag) => String(tag).replace(/\\/g, "\\\\").replace(/\|/g, "\\|")).join("|");
}

function parseLinkImportCsv(csv) {
  if (typeof csv !== "string" || !csv.trim()) {
    return { status: 400, error: "Choose a non-empty CSV file." };
  }
  if (Buffer.byteLength(csv, "utf8") > MAX_IMPORT_BYTES) {
    return { status: 413, error: "CSV files must be 9 KB or smaller." };
  }

  const parsed = Papa.parse(csv, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim().toLowerCase(),
  });
  if (parsed.errors.some((error) => error.code !== "UndetectableDelimiter")) {
    return { status: 400, error: "CSV formatting is invalid. Check that each row matches the header." };
  }

  const fields = parsed.meta.fields || [];
  if (!fields.includes("url")) {
    return { status: 400, error: "CSV must include a url column." };
  }
  if (fields.some((field) => !ALLOWED_IMPORT_COLUMNS.has(field))) {
    return { status: 400, error: "CSV columns may only be url, alias, and tags." };
  }
  if (parsed.data.length === 0) return { status: 400, error: "CSV has no data rows." };
  if (parsed.data.length > MAX_IMPORT_ROWS) {
    return { status: 413, error: `Import up to ${MAX_IMPORT_ROWS} rows at a time.` };
  }

  return {
    rows: parsed.data.map((row, index) => ({
      rowNumber: index + 2,
      url: typeof row.url === "string" ? row.url.trim() : "",
      alias: typeof row.alias === "string" ? row.alias.trim() : "",
      tags: typeof row.tags === "string" ? row.tags.trim() : "",
    })),
  };
}

function escapeCsvCell(value) {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[\t\r\n ]*[=+\-@]/.test(text)) text = "'" + text;
  return `"${text.replace(/"/g, '""')}"`;
}

module.exports = {
  ALLOWED_IMPORT_COLUMNS,
  MAX_IMPORT_BYTES,
  MAX_IMPORT_ROWS,
  escapeCsvCell,
  parseDelimitedTags,
  parseLinkImportCsv,
  serializeDelimitedTags,
};
