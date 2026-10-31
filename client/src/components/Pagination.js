"use client";

export default function Pagination({
  page,
  pages,
  total,
  limit = 20,
  onPageChange,
  label,
}) {
  if (!total) return null;

  var first = (page - 1) * limit + 1;
  var last = Math.min(page * limit, total);

  return (
    <nav
      aria-label={label + " pagination"}
      className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-text-muted" aria-live="polite">
        Showing {first}–{last} of {total}
      </p>
      {pages > 1 ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="ui-button-secondary focus-ring min-h-10 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="min-w-20 text-center text-sm text-text-muted" aria-current="page">
            Page {page} of {pages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pages}
            className="ui-button-secondary focus-ring min-h-10 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      ) : null}
    </nav>
  );
}
