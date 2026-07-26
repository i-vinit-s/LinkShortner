"use client";

export default function LinkFilterBar(props) {
  var search = props.search;
  var setSearch = props.setSearch;
  var statusFilter = props.statusFilter;
  var setStatusFilter = props.setStatusFilter;
  var sortBy = props.sortBy;
  var setSortBy = props.setSortBy;

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <input
        value={search}
        onChange={function (e) {
          setSearch(e.target.value);
        }}
        placeholder="Search by URL or short code..."
        className="bg-surface-raised border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-signal w-full sm:w-64"
      />

      <div className="flex gap-2 shrink-0">
        <select
          value={statusFilter}
          onChange={function (e) {
            setStatusFilter(e.target.value);
          }}
          className="bg-surface-raised border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-signal"
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
          className="bg-surface-raised border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-signal"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="most-clicks">Most clicks</option>
          <option value="least-clicks">Least clicks</option>
        </select>
      </div>
    </div>
  );
}
