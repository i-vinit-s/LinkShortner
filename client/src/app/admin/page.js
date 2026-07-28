"use client";

import { useState, useEffect } from "react";
import RequireAdmin from "@/components/RequireAdmin";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";

function StatCard(props) {
  return (
    <div className="bg-surface border border-white/10 rounded-lg p-4">
      <p className="text-xs uppercase tracking-wide text-text-muted font-mono">
        {props.label}
      </p>
      <p className="text-2xl font-display font-bold text-white mt-1">
        {props.value}
      </p>
    </div>
  );
}

function UsersTab() {
  var [users, setUsers] = useState([]);
  var [search, setSearch] = useState("");
  var [page, setPage] = useState(1);
  var [pages, setPages] = useState(1);
  var [loading, setLoading] = useState(true);

  var loadUsers = async function () {
    setLoading(true);
    try {
      var res = await api.get("/admin/users", {
        params: { search: search, page: page },
      });
      setUsers(res.data.users);
      setPages(res.data.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(
    function () {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- loadUsers is also called from the search form and ban toggle; refetching on page change is the intended behavior here
      loadUsers();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadUsers is redefined each render but only `page` should retrigger this fetch
    [page],
  );

  var handleSearch = function (e) {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  var handleToggleBan = async function (id) {
    try {
      await api.post("/admin/users/" + id + "/toggle-ban");
      loadUsers();
    } catch (err) {
      alert(
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : "Failed to update user",
      );
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={search}
          onChange={function (e) {
            setSearch(e.target.value);
          }}
          placeholder="Search by name or email..."
          className="flex-1 bg-surface-raised border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-signal"
        />
        <button
          type="submit"
          className="text-sm border border-white/15 rounded-md px-3 py-2 text-white"
        >
          Search
        </button>
      </form>

      {loading ? (
        <p className="text-text-muted text-sm">Loading...</p>
      ) : (
        <div className="space-y-2">
          {users.map(function (u) {
            return (
              <div
                key={u._id}
                className="bg-surface border border-white/10 rounded-lg p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-white text-sm truncate">
                    {u.name}{" "}
                    {u.isAdmin ? (
                      <span className="text-signal text-xs ml-1">(admin)</span>
                    ) : null}
                  </p>
                  <p className="text-text-muted text-xs truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={
                      "text-xs px-2 py-0.5 rounded " +
                      (u.verified
                        ? "bg-led/10 text-led"
                        : "bg-danger/10 text-danger")
                    }
                  >
                    {u.verified ? "Active" : "Banned/Unverified"}
                  </span>
                  {!u.isAdmin ? (
                    <button
                      onClick={function () {
                        handleToggleBan(u._id);
                      }}
                      className="text-xs border border-white/15 rounded-md px-2 py-1 text-text-muted hover:text-white"
                    >
                      {u.verified ? "Ban" : "Reinstate"}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pages > 1 ? (
        <div className="flex gap-2 justify-center pt-2">
          <button
            onClick={function () {
              setPage(function (p) {
                return Math.max(1, p - 1);
              });
            }}
            disabled={page <= 1}
            className="text-xs border border-white/15 rounded-md px-3 py-1 text-text-muted disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-xs text-text-muted self-center">
            Page {page} of {pages}
          </span>
          <button
            onClick={function () {
              setPage(function (p) {
                return Math.min(pages, p + 1);
              });
            }}
            disabled={page >= pages}
            className="text-xs border border-white/15 rounded-md px-3 py-1 text-text-muted disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}

function LinksTab() {
  var [links, setLinks] = useState([]);
  var [search, setSearch] = useState("");
  var [page, setPage] = useState(1);
  var [pages, setPages] = useState(1);
  var [loading, setLoading] = useState(true);

  var loadLinks = async function () {
    setLoading(true);
    try {
      var res = await api.get("/admin/links", {
        params: { search: search, page: page },
      });
      setLinks(res.data.links);
      setPages(res.data.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(
    function () {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- loadLinks is also called from the search form and toggle handler; refetching on page change is intended
      loadLinks();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadLinks is redefined each render but only `page` should retrigger this fetch
    [page],
  );

  var handleSearch = function (e) {
    e.preventDefault();
    setPage(1);
    loadLinks();
  };

  var handleToggle = async function (id) {
    try {
      await api.post("/admin/links/" + id + "/toggle-active");
      loadLinks();
    } catch (err) {
      alert("Failed to update link");
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={search}
          onChange={function (e) {
            setSearch(e.target.value);
          }}
          placeholder="Search by short code or URL..."
          className="flex-1 bg-surface-raised border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-signal"
        />
        <button
          type="submit"
          className="text-sm border border-white/15 rounded-md px-3 py-2 text-white"
        >
          Search
        </button>
      </form>

      {loading ? (
        <p className="text-text-muted text-sm">Loading...</p>
      ) : (
        <div className="space-y-2">
          {links.map(function (link) {
            return (
              <div
                key={link._id}
                className="bg-surface border border-white/10 rounded-lg p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-mono text-wire text-sm">
                    /{link.shortCode}
                  </p>
                  <p className="text-text-muted text-xs truncate max-w-md">
                    {link.longUrl}
                  </p>
                  <p className="text-text-muted text-xs mt-0.5">
                    {link.userId ? link.userId.email : "anonymous"} &middot;{" "}
                    {link.clickCount} clicks
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={
                      "text-xs px-2 py-0.5 rounded " +
                      (link.isActive
                        ? "bg-led/10 text-led"
                        : "bg-danger/10 text-danger")
                    }
                  >
                    {link.isActive ? "Active" : "Deactivated"}
                  </span>
                  <button
                    onClick={function () {
                      handleToggle(link._id);
                    }}
                    className="text-xs border border-white/15 rounded-md px-2 py-1 text-text-muted hover:text-white"
                  >
                    {link.isActive ? "Deactivate" : "Reactivate"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pages > 1 ? (
        <div className="flex gap-2 justify-center pt-2">
          <button
            onClick={function () {
              setPage(function (p) {
                return Math.max(1, p - 1);
              });
            }}
            disabled={page <= 1}
            className="text-xs border border-white/15 rounded-md px-3 py-1 text-text-muted disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-xs text-text-muted self-center">
            Page {page} of {pages}
          </span>
          <button
            onClick={function () {
              setPage(function (p) {
                return Math.min(pages, p + 1);
              });
            }}
            disabled={page >= pages}
            className="text-xs border border-white/15 rounded-md px-3 py-1 text-text-muted disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ReportsTab() {
  var [reports, setReports] = useState([]);
  var [statusFilter, setStatusFilter] = useState("pending");
  var [loading, setLoading] = useState(true);

  var loadReports = async function () {
    setLoading(true);
    try {
      var res = await api.get("/admin/reports", {
        params: { status: statusFilter },
      });
      setReports(res.data.reports);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(
    function () {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- loadReports is also called from action/dismiss handlers; refetching on filter change is intended
      loadReports();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadReports is redefined each render but only `statusFilter` should retrigger this fetch
    [statusFilter],
  );

  var handleAction = async function (id) {
    if (!confirm("Deactivate the reported link?")) return;
    try {
      await api.post("/admin/reports/" + id + "/action");
      loadReports();
    } catch (err) {
      alert("Failed to action report");
    }
  };

  var handleDismiss = async function (id) {
    try {
      await api.post("/admin/reports/" + id + "/dismiss");
      loadReports();
    } catch (err) {
      alert("Failed to dismiss report");
    }
  };

  return (
    <div className="space-y-3">
      <select
        value={statusFilter}
        onChange={function (e) {
          setStatusFilter(e.target.value);
        }}
        className="bg-surface-raised border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-signal"
      >
        <option value="pending">Pending</option>
        <option value="reviewed">Reviewed</option>
        <option value="actioned">Actioned</option>
        <option value="all">All</option>
      </select>

      {loading ? (
        <p className="text-text-muted text-sm">Loading...</p>
      ) : reports.length === 0 ? (
        <p className="text-text-muted text-sm">No reports here.</p>
      ) : (
        <div className="space-y-2">
          {reports.map(function (r) {
            return (
              <div
                key={r._id}
                className="bg-surface border border-white/10 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="font-mono text-wire text-sm">
                    {r.shortCodeOrUrl}
                  </p>
                  <span className="text-xs text-text-muted">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-white">{r.reason}</p>
                {r.reporterEmail ? (
                  <p className="text-xs text-text-muted">
                    From: {r.reporterEmail}
                  </p>
                ) : null}

                {r.status === "pending" ? (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={function () {
                        handleAction(r._id);
                      }}
                      className="text-xs border border-danger/30 text-danger rounded-md px-3 py-1 hover:bg-danger/10"
                    >
                      Deactivate link
                    </button>
                    <button
                      onClick={function () {
                        handleDismiss(r._id);
                      }}
                      className="text-xs border border-white/15 rounded-md px-3 py-1 text-text-muted hover:text-white"
                    >
                      Dismiss
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-text-muted uppercase tracking-wide">
                    {r.status}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BioPagesTab() {
  var [pages, setPages] = useState([]);
  var [search, setSearch] = useState("");
  var [page, setPage] = useState(1);
  var [pages_count, setPagesCount] = useState(1);
  var [loading, setLoading] = useState(true);

  var loadPages = async function () {
    setLoading(true);
    try {
      var res = await api.get("/admin/bio-pages", {
        params: { search: search, page: page },
      });
      setPages(res.data.pages);
      setPagesCount(res.data.pages_count);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(
    function () {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loadPages is also called from the search form and toggle/delete handlers; refetching on page change is intended
      loadPages();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadPages is redefined each render but only `page` should retrigger this fetch
    [page],
  );

  var handleSearch = function (e) {
    e.preventDefault();
    setPage(1);
    loadPages();
  };

  var handleTogglePublish = async function (id) {
    try {
      await api.post("/admin/bio-pages/" + id + "/toggle-publish");
      loadPages();
    } catch (err) {
      alert("Failed to update page");
    }
  };

  var handleDelete = async function (id) {
    if (!confirm("Delete this bio page permanently?")) return;
    try {
      await api.delete("/admin/bio-pages/" + id);
      loadPages();
    } catch (err) {
      alert("Failed to delete page");
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={search}
          onChange={function (e) {
            setSearch(e.target.value);
          }}
          placeholder="Search by slug..."
          className="flex-1 bg-surface-raised border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-signal"
        />
        <button
          type="submit"
          className="text-sm border border-white/15 rounded-md px-3 py-2 text-white"
        >
          Search
        </button>
      </form>

      {loading ? (
        <p className="text-text-muted text-sm">Loading...</p>
      ) : (
        <div className="space-y-2">
          {pages.map(function (p) {
            return (
              <div
                key={p._id}
                className="bg-surface border border-white/10 rounded-lg p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-mono text-wire text-sm">/u/{p.slug}</p>
                  <p className="text-text-muted text-xs truncate">
                    {p.userId ? p.userId.email : "unknown"} &middot; {p.views}{" "}
                    views
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={
                      "text-xs px-2 py-0.5 rounded " +
                      (p.isPublished
                        ? "bg-led/10 text-led"
                        : "bg-text-muted/10 text-text-muted")
                    }
                  >
                    {p.isPublished ? "Published" : "Unpublished"}
                  </span>
                  <button
                    onClick={function () {
                      handleTogglePublish(p._id);
                    }}
                    className="text-xs border border-white/15 rounded-md px-2 py-1 text-text-muted hover:text-white"
                  >
                    {p.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={function () {
                      handleDelete(p._id);
                    }}
                    className="text-xs border border-danger/30 text-danger rounded-md px-2 py-1 hover:bg-danger/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pages_count > 1 ? (
        <div className="flex gap-2 justify-center pt-2">
          <button
            onClick={function () {
              setPage(function (p) {
                return Math.max(1, p - 1);
              });
            }}
            disabled={page <= 1}
            className="text-xs border border-white/15 rounded-md px-3 py-1 text-text-muted disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-xs text-text-muted self-center">
            Page {page} of {pages_count}
          </span>
          <button
            onClick={function () {
              setPage(function (p) {
                return Math.min(pages_count, p + 1);
              });
            }}
            disabled={page >= pages_count}
            className="text-xs border border-white/15 rounded-md px-3 py-1 text-text-muted disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}

function AdminDashboard() {
  var [tab, setTab] = useState("overview");
  var [stats, setStats] = useState(null);

  useEffect(function () {
    var loadStats = async function () {
      try {
        var res = await api.get("/admin/stats");
        setStats(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadStats();
  }, []);

  var tabs = [
    { key: "overview", label: "Overview" },
    { key: "users", label: "Users" },
    { key: "links", label: "Links" },
    { key: "reports", label: "Reports" },
  ];

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-wire font-mono mb-1">
            Admin
          </p>
          <h1 className="text-2xl font-display font-bold text-white">
            Control panel
          </h1>
        </div>

        <div className="flex gap-2 border-b border-white/10">
          {tabs.map(function (t) {
            return (
              <button
                key={t.key}
                onClick={function () {
                  setTab(t.key);
                }}
                className={
                  "text-sm px-3 py-2 border-b-2 transition-colors " +
                  (tab === t.key
                    ? "border-signal text-white"
                    : "border-transparent text-text-muted hover:text-white")
                }
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "overview" ? (
          stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard label="Total users" value={stats.totalUsers} />
              <StatCard label="Total links" value={stats.totalLinks} />
              <StatCard label="Active links" value={stats.activeLinks} />
              <StatCard label="Total clicks" value={stats.totalClicks} />
              <StatCard label="Pending reports" value={stats.pendingReports} />
            </div>
          ) : (
            <p className="text-text-muted text-sm">Loading stats...</p>
          )
        ) : null}

        {tab === "users" ? <UsersTab /> : null}
        {tab === "links" ? <LinksTab /> : null}
        {tab === "reports" ? <ReportsTab /> : null}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAdmin>
      <AdminDashboard />
    </RequireAdmin>
  );
}
