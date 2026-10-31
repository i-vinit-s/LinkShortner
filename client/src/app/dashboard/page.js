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
import { ListSkeleton } from "@/components/LoadingSkeleton";

function DashboardContent() {
  var [links, setLinks] = useState([]);
  var [loading, setLoading] = useState(true);
  var [loadError, setLoadError] = useState("");
  var [reloadKey, setReloadKey] = useState(0);
  var [selectedIds, setSelectedIds] = useState([]);
  var [bulkLoading, setBulkLoading] = useState(false);
  var [actionFeedback, setActionFeedback] = useState(null);

  var [search, setSearch] = useState("");
  var [statusFilter, setStatusFilter] = useState("all");
  var [sortBy, setSortBy] = useState("newest");

  var [availableTags, setAvailableTags] = useState([]);
  var [tagFilter, setTagFilter] = useState("all");

  var [activeTab, setActiveTab] = useState("url"); // "url" | "qr"

  useEffect(function () {
    var cancelled = false;
    var loadData = async function () {
      try {
        var results = await Promise.all([
          api.get("/links/mine"),
          api.get("/links/tags"),
        ]);
        if (cancelled) return;
        setLinks(results[0].data.links);
        setAvailableTags(results[1].data.tags);
      } catch (err) {
        console.error(err);
        if (!cancelled) setLoadError("We couldn't load your links. Check your connection and try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadData();
    return function () {
      cancelled = true;
    };
  }, [reloadKey]);

  var retryLoad = function () {
    setLoading(true);
    setLoadError("");
    setReloadKey(function (key) { return key + 1; });
  };

  var handleCreated = function (newLink) {
    setLinks(function (prev) {
      return [newLink].concat(prev);
    });
  };

    var handleDelete = async function (id) {
      if (!confirm("Deactivate this link? You can activate it again later."))
        return;
      setActionFeedback(null);
      try {
        await api.delete("/links/" + id);
        // Keep the link in the list (greyed out) so it can be activated again
        setLinks(function (prev) {
          return prev.map(function (l) {
            return l._id === id
              ? { ...l, isActive: false, deactivatedBy: "user" }
              : l;
          });
        });
        setSelectedIds(function (prev) {
          return prev.filter(function (sid) {
            return sid !== id;
          });
        });
        setActionFeedback({ type: "success", message: "Link deactivated. You can reactivate it at any time." });
      } catch (err) {
        console.error(err);
        setActionFeedback({
          type: "error",
          message: err.response?.data?.message || "We couldn’t deactivate this link. Please try again.",
        });
      }
  };
  
    var handleEditDestination = async function (id, newUrl) {
      try {
        var res = await api.patch("/links/" + id, { longUrl: newUrl });
        setLinks(function (prev) {
          return prev.map(function (l) {
            return l._id === id ? { ...l, longUrl: res.data.longUrl } : l;
          });
        });
      } catch (err) {
        // LinkCard shows this message under the input
        throw new Error(
          err.response && err.response.data && err.response.data.message
            ? err.response.data.message
            : "Failed to update link",
        );
      }
    };

    var handleReactivate = async function (id) {
      setActionFeedback(null);
      try {
        await api.post("/links/" + id + "/reactivate");
        setLinks(function (prev) {
          return prev.map(function (l) {
            return l._id === id
              ? { ...l, isActive: true, deactivatedBy: null }
              : l;
          });
        });
        setActionFeedback({ type: "success", message: "Link reactivated." });
      } catch (err) {
        setActionFeedback({
          type: "error",
          message: err.response?.data?.message || "We couldn’t reactivate this link. Please try again.",
        });
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

    setActionFeedback(null);
    setBulkLoading(true);
    try {
      await api.post("/links/bulk-delete", { ids: selectedIds });
      setLinks(function (prev) {
        return prev.map(function (l) {
          return selectedIds.indexOf(l._id) !== -1 && l.isActive
            ? { ...l, isActive: false, deactivatedBy: "user" }
            : l;
        });
      });
      setSelectedIds([]);
      setActionFeedback({ type: "success", message: "Selected links deactivated." });
    } catch (err) {
      console.error(err);
      setActionFeedback({
        type: "error",
        message: err.response?.data?.message || "We couldn’t deactivate the selected links. Please try again.",
      });
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
        return !!link.hasPassword;
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
    <div className="min-h-screen bg-[#000000]">
      <Navbar />
      <div className="mx-auto max-w-5xl space-y-6 px-5 py-8 pb-28 sm:px-8 sm:py-12 sm:pb-12">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm text-text-muted">Your workspace</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">Links</h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-text-muted">Create, organize, and understand the links you share.</p>
          </div>
          <div className="text-left sm:text-right"><p className="font-mono text-2xl text-white">{links.length}</p><p className="text-sm text-text-muted">total links</p></div>
        </div>

        <div className="space-y-4">
          <BillingStatus />
          {actionFeedback ? (
            <div
              className={`flex items-start justify-between gap-4 rounded-lg border px-4 py-3 text-sm ${actionFeedback.type === "error" ? "border-danger/25 bg-danger/5 text-danger" : "border-led/25 bg-led/5 text-led"}`}
              role={actionFeedback.type === "error" ? "alert" : "status"}
              aria-live={actionFeedback.type === "error" ? "assertive" : "polite"}
            >
              <p>{actionFeedback.message}</p>
              <button
                type="button"
                onClick={function () { setActionFeedback(null); }}
                aria-label="Dismiss message"
                className="focus-ring -mr-1 -mt-1 shrink-0 rounded p-1 text-current/75 hover:text-current"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          ) : null}
          <div className="flex gap-1 border-b border-white/10">
            <button
              onClick={function () {
                setActiveTab("url");
              }}
              className={
                "focus-ring rounded-t-md px-3 py-3 text-sm transition-colors " +
                (activeTab === "url"
                  ? "bg-white/5 text-white"
                  : "text-[#777777] hover:bg-white/5 hover:text-white")
              }
            >
              Links
            </button>

            <button
              onClick={function () {
                setActiveTab("qr");
              }}
              className={
                "focus-ring rounded-t-md px-3 py-3 text-sm transition-colors " +
                (activeTab === "qr"
                  ? "bg-white/5 text-white"
                  : "text-[#777777] hover:bg-white/5 hover:text-white")
              }
            >
              QR codes
            </button>
          </div>

          {activeTab === "url" ? (
            <>
              <CreateLinkForm onCreated={handleCreated} />

              {loading ? (
                <ListSkeleton label="Loading links" rows={3} />
              ) : loadError ? (
                <div className="flex flex-col gap-3 rounded-xl border border-danger/25 bg-danger/5 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-text-muted" role="alert">{loadError}</p>
                  <button onClick={retryLoad} className="ui-button-secondary focus-ring w-fit text-sm">Retry</button>
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
                            onReactivate={handleReactivate}
                            onEditDestination={handleEditDestination}
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
                  retryLoad();
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
                  if (loading) {
                    return <ListSkeleton label="Loading your QR codes" rows={2} />;
                  }
                  if (loadError) {
                    return <div className="flex flex-col gap-3 rounded-xl border border-danger/25 bg-danger/5 p-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-text-muted" role="alert">{loadError}</p><button onClick={retryLoad} className="ui-button-secondary focus-ring w-fit text-sm">Retry</button></div>;
                  }
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
                            onReactivate={handleReactivate}
                            onEditDestination={handleEditDestination}
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
