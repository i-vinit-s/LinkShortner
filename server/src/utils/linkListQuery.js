const LINK_LIST_STATUSES = new Set(["all", "active", "expired", "password"]);
const LINK_LIST_SORTS = new Set([
  "newest",
  "oldest",
  "most-clicks",
  "least-clicks",
]);

function readStringParam(query, key, fallback) {
  const value = query[key];
  if (value === undefined) return { value: fallback };
  if (typeof value !== "string") return { error: true };
  return { value };
}

function parseLinkListQuery(query = {}) {
  const page = readStringParam(query, "page", "1");
  const search = readStringParam(query, "search", "");
  const status = readStringParam(query, "status", "all");
  const sort = readStringParam(query, "sort", "newest");
  const tag = readStringParam(query, "tag", "all");
  const source = readStringParam(query, "source", "all");

  if ([page, search, status, sort, tag, source].some((param) => param.error)) {
    return { error: "List filters must be single string values." };
  }
  if (!LINK_LIST_STATUSES.has(status.value)) {
    return { error: "Unsupported link status filter." };
  }
  if (!LINK_LIST_SORTS.has(sort.value)) {
    return { error: "Unsupported link sort order." };
  }
  if (source.value !== "all" && source.value !== "qr") {
    return { error: "Unsupported link source filter." };
  }

  return {
    page: page.value,
    search: search.value.trim().slice(0, 100),
    status: status.value,
    sort: sort.value,
    tag: tag.value === "all" ? "all" : tag.value.trim().slice(0, 20),
    source: source.value,
  };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildLinkListFilter(userId, options, now = new Date()) {
  const filter = { userId };
  const clauses = [];

  if (options.search) {
    const search = new RegExp(escapeRegex(options.search), "i");
    clauses.push({
      $or: [{ longUrl: search }, { shortCode: search }],
    });
  }
  if (options.status === "active") {
    clauses.push({
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    });
  } else if (options.status === "expired") {
    clauses.push({
      $or: [{ isActive: false }, { expiresAt: { $lte: now } }],
    });
  } else if (options.status === "password") {
    clauses.push({ passwordHash: { $type: "string" } });
  }

  if (options.tag !== "all") clauses.push({ tags: options.tag });
  if (options.source === "qr") clauses.push({ source: "qr" });
  if (clauses.length > 0) filter.$and = clauses;

  return filter;
}

function getLinkListSort(sort) {
  switch (sort) {
    case "oldest":
      return { createdAt: 1, _id: 1 };
    case "most-clicks":
      return { clickCount: -1, _id: -1 };
    case "least-clicks":
      return { clickCount: 1, _id: 1 };
    default:
      return { createdAt: -1, _id: -1 };
  }
}

module.exports = {
  buildLinkListFilter,
  escapeRegex,
  getLinkListSort,
  parseLinkListQuery,
};
