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
    "w-full bg-surface-raised border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-signal";

  return (
    <div className="space-y-2">
      <input
        value={search}
        onChange={function (e) {
          setSearch(e.target.value);
        }}
        placeholder="Search by URL or short code..."
        className="w-full bg-surface-raised border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-signal"
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
