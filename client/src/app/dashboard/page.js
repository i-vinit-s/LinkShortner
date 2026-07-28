"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import CreateLinkForm from "@/components/CreateLinkForm";
import QuickQrForm from "@/components/QuickQrForm";
import LinkCard from "@/components/LinkCard";
import LinkFilterBar from "@/components/LinkFilterBar";
import api from "@/lib/api";
import BillingStatus from "@/components/BillingStatus";

function DashboardContent() {
  var [links, setLinks] = useState([]);
  var [loading, setLoading] = useState(true);
  var [selectedIds, setSelectedIds] = useState([]);
  var [bulkLoading, setBulkLoading] = useState(false);

  var [search, setSearch] = useState("");
  var [statusFilter, setStatusFilter] = useState("all");
  var [sortBy, setSortBy] = useState("newest");

  var [availableTags, setAvailableTags] = useState([]);
  var [tagFilter, setTagFilter] = useState("all");

  var [activeTab, setActiveTab] = useState("url"); // "url" | "qr"

  useEffect(function () {
    var loadData = async function () {
      try {
        var linksRes = await api.get("/links/mine");
        setLinks(linksRes.data.links);
        var tagsRes = await api.get("/links/tags");
        setAvailableTags(tagsRes.data.tags);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  var handleCreated = function (newLink) {
    setLinks(function (prev) {
      return [newLink].concat(prev);
    });
  };

  var handleDelete = async function (id) {
    if (!confirm("Deactivate this link?")) return;
    try {
      await api.delete("/links/" + id);
      setLinks(function (prev) {
        return prev.filter(function (l) {
          return l._id !== id;
        });
      });
      setSelectedIds(function (prev) {
        return prev.filter(function (sid) {
          return sid !== id;
        });
      });
    } catch (err) {
      console.error(err);
    }
  };

  var toggleSelect = function (id) {
    setSelectedIds(function (prev) {
      if (prev.indexOf(id) === -1) {
        return prev.concat([id]);
      }
      return prev.filter(function (sid) {
        return sid !== id;
      });
    });
  };

  var handleBulkDelete = async function () {
    if (selectedIds.length === 0) return;
    if (!confirm("Deactivate " + selectedIds.length + " selected link(s)?"))
      return;

    setBulkLoading(true);
    try {
      await api.post("/links/bulk-delete", { ids: selectedIds });
      setLinks(function (prev) {
        return prev.filter(function (l) {
          return selectedIds.indexOf(l._id) === -1;
        });
      });
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      alert("Bulk delete failed");
    } finally {
      setBulkLoading(false);
    }
  };

  var getFilteredLinks = function () {
    var result = links.slice();

    if (search.trim() !== "") {
      var query = search.trim().toLowerCase();
      result = result.filter(function (link) {
        return (
          link.longUrl.toLowerCase().indexOf(query) !== -1 ||
          link.shortCode.toLowerCase().indexOf(query) !== -1
        );
      });
    }

    if (statusFilter === "active") {
      result = result.filter(function (link) {
        var expired = link.expiresAt && new Date(link.expiresAt) < new Date();
        return link.isActive && !expired;
      });
    } else if (statusFilter === "expired") {
      result = result.filter(function (link) {
        var expired = link.expiresAt && new Date(link.expiresAt) < new Date();
        return !link.isActive || expired;
      });
    } else if (statusFilter === "password") {
      result = result.filter(function (link) {
        return !!link.passwordHash;
      });
    }

    if (tagFilter !== "all") {
      result = result.filter(function (link) {
        return link.tags && link.tags.indexOf(tagFilter) !== -1;
      });
    }

    if (sortBy === "newest") {
      result.sort(function (a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    } else if (sortBy === "oldest") {
      result.sort(function (a, b) {
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
    } else if (sortBy === "most-clicks") {
      result.sort(function (a, b) {
        return b.clickCount - a.clickCount;
      });
    } else if (sortBy === "least-clicks") {
      result.sort(function (a, b) {
        return a.clickCount - b.clickCount;
      });
    }

    return result;
  };

  var filteredLinks = getFilteredLinks();
  var allSelected =
    selectedIds.length === filteredLinks.length && filteredLinks.length > 0;

  var toggleSelectAllFiltered = function () {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(
        filteredLinks.map(function (l) {
          return l._id;
        }),
      );
    }
  };

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-5 sm:space-y-6 pb-28 sm:pb-10">
        <div>
          <p className="text-xs uppercase tracking-widest text-wire font-mono mb-1">
            Dashboard
          </p>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-white">
            Your links
          </h1>
        </div>

        <div className="space-y-4">
          <BillingStatus />
          <div className="flex gap-2 border-b border-white/10">
            <button
              onClick={function () {
                setActiveTab("url");
              }}
              className={
                "text-sm px-3 py-2 border-b-2 transition-colors " +
                (activeTab === "url"
                  ? "border-signal text-white"
                  : "border-transparent text-text-muted hover:text-white")
              }
            >
              Shorten URL
            </button>

            <button
              onClick={function () {
                setActiveTab("qr");
              }}
              className={
                "text-sm px-3 py-2 border-b-2 transition-colors " +
                (activeTab === "qr"
                  ? "border-signal text-white"
                  : "border-transparent text-text-muted hover:text-white")
              }
            >
              Generate QR
            </button>
          </div>

          {activeTab === "url" ? (
            <>
              <CreateLinkForm onCreated={handleCreated} />

              {loading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-16 bg-surface rounded-lg" />
                  <div className="h-16 bg-surface rounded-lg" />
                  <div className="h-16 bg-surface rounded-lg" />
                </div>
              ) : links.length === 0 ? (
                <div className="border border-dashed border-white/15 rounded-lg p-8 text-center">
                  <p className="text-text-muted text-sm">
                    No links yet. Paste a URL above to patch your first one in.
                  </p>
                </div>
              ) : (
                <>
                  <LinkFilterBar
                    search={search}
                    setSearch={setSearch}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    availableTags={availableTags}
                    tagFilter={tagFilter}
                    setTagFilter={setTagFilter}
                  />

                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAllFiltered}
                        className="accent-signal w-4 h-4 shrink-0"
                      />
                      <span>
                        {selectedIds.length > 0
                          ? selectedIds.length + " selected"
                          : "Select all (" + filteredLinks.length + ")"}
                      </span>
                    </label>

                    {selectedIds.length > 0 ? (
                      <button
                        onClick={handleBulkDelete}
                        disabled={bulkLoading}
                        className="hidden sm:inline-flex text-sm border border-danger/30 text-danger rounded-md px-3 py-1.5 hover:bg-danger/10 transition-colors disabled:opacity-50 shrink-0"
                      >
                        {bulkLoading
                          ? "Deactivating..."
                          : "Deactivate selected"}
                      </button>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    {filteredLinks.length === 0 ? (
                      <div className="border border-dashed border-white/15 rounded-lg p-8 text-center">
                        <p className="text-text-muted text-sm">
                          No links match your search or filters.
                        </p>
                      </div>
                    ) : (
                      filteredLinks.map(function (link) {
                        return (
                          <LinkCard
                            key={link._id}
                            link={link}
                            onDelete={handleDelete}
                            selected={selectedIds.indexOf(link._id) !== -1}
                            onToggleSelect={toggleSelect}
                          />
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="space-y-6">
              <QuickQrForm
                onSaved={function () {
                  // Refresh the link list so the new QR-sourced link shows up immediately
                  api.get("/links/mine").then(function (res) {
                    setLinks(res.data.links);
                  });
                }}
              />

              <div>
                <h2 className="text-sm font-display font-medium text-white mb-3">
                  My QR Codes
                </h2>
                {(function () {
                  var qrLinks = links.filter(function (l) {
                    return l.source === "qr";
                  });
                  if (qrLinks.length === 0) {
                    return (
                      <p className="text-text-muted text-sm">
                        No QR codes generated yet.
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      {qrLinks.map(function (link) {
                        return (
                          <LinkCard
                            key={link._id}
                            link={link}
                            onDelete={handleDelete}
                            selected={selectedIds.indexOf(link._id) !== -1}
                            onToggleSelect={toggleSelect}
                          />
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile-only sticky bulk-action bar — appears at the thumb-reachable bottom of the screen */}
      {selectedIds.length > 0 ? (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-white/10 px-4 py-3 flex items-center justify-between z-40">
          <span className="text-sm text-text-muted">
            {selectedIds.length} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={function () {
                setSelectedIds([]);
              }}
              className="text-sm border border-white/15 rounded-md px-3 py-1.5 text-text-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkLoading}
              className="text-sm border border-danger/30 text-danger rounded-md px-3 py-1.5 disabled:opacity-50"
            >
              {bulkLoading ? "..." : "Deactivate"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
