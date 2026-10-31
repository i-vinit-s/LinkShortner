"use client";

export default function LinkFilterBar(props) {
  var search = props.search;
  var setSearch = props.setSearch;
  var statusFilter = props.statusFilter;
  var setStatusFilter = props.setStatusFilter;
  var sortBy = props.sortBy;
  var setSortBy = props.setSortBy;
  var availableTags = props.availableTags || [];
  var tagFilter = props.tagFilter;
  var setTagFilter = props.setTagFilter;

  var selectClass =
    "focus-ring min-h-11 w-full rounded-md border border-white/10 bg-[#1F1F1F] px-3 text-sm text-white focus:border-signal focus:outline-none";

  return (
    <div className="space-y-3">
      <label htmlFor="link-search" className="text-sm font-medium text-white">Find a link</label>
      <input
        id="link-search"
        value={search}
        onChange={function (e) {
          setSearch(e.target.value);
        }}
        placeholder="Search by URL or short code"
        className="focus-ring min-h-11 w-full rounded-md border border-white/10 bg-[#1F1F1F] px-3 text-sm text-white placeholder:text-[#777777] focus:border-signal focus:outline-none"
      />

      <div
        className={
          "grid gap-2 " +
          (availableTags.length > 0
            ? "grid-cols-2 sm:grid-cols-3"
            : "grid-cols-2")
        }
      >
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={function (e) {
            setStatusFilter(e.target.value);
          }}
          className={selectClass}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="password">Password protected</option>
        </select>

        <select
          aria-label="Sort links"
          value={sortBy}
          onChange={function (e) {
            setSortBy(e.target.value);
          }}
          className={selectClass}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="most-clicks">Most clicks</option>
          <option value="least-clicks">Least clicks</option>
        </select>

        {availableTags.length > 0 ? (
          <select
            aria-label="Filter by tag"
            value={tagFilter}
            onChange={function (e) {
              setTagFilter(e.target.value);
            }}
            className={selectClass + " col-span-2 sm:col-span-1"}
          >
            <option value="all">All tags</option>
            {availableTags.map(function (tag) {
              return (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              );
            })}
          </select>
        ) : null}
      </div>
    </div>
  );
}
