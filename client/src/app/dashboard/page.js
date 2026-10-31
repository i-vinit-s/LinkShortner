"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import CreateLinkForm from "@/components/CreateLinkForm";
import QuickQrForm from "@/components/QuickQrForm";
import LinkCard from "@/components/LinkCard";
import LinkFilterBar from "@/components/LinkFilterBar";
import Pagination from "@/components/Pagination";
import BulkLinkImport from "@/components/BulkLinkImport";
import api from "@/lib/api";
import BillingStatus from "@/components/BillingStatus";
import { ListSkeleton } from "@/components/LoadingSkeleton";

function DashboardContent() {
  var [links, setLinks] = useState([]);
  var [loading, setLoading] = useState(true);
  var [loadError, setLoadError] = useState("");
  var [reloadKey, setReloadKey] = useState(0);
  var [page, setPage] = useState(1);
  var [pageInfo, setPageInfo] = useState({ total: 0, allTotal: 0, pages: 0, limit: 20 });
  var [selectedIds, setSelectedIds] = useState([]);
  var [bulkLoading, setBulkLoading] = useState(false);
  var [exporting, setExporting] = useState(false);
  var [exportFeedback, setExportFeedback] = useState(null);
  var [actionFeedback, setActionFeedback] = useState(null);

  var [search, setSearch] = useState("");
  var [debouncedSearch, setDebouncedSearch] = useState("");
  var [statusFilter, setStatusFilter] = useState("all");
  var [sortBy, setSortBy] = useState("newest");

  var [availableTags, setAvailableTags] = useState([]);
  var [tagFilter, setTagFilter] = useState("all");

  var [activeTab, setActiveTab] = useState("url"); // "url" | "qr"

  useEffect(function () {
    var timer = setTimeout(function () {
      setDebouncedSearch(search.trim());
    }, 250);
    return function () { clearTimeout(timer); };
  }, [search]);

  useEffect(function () {
    var cancelled = false;
    var loadData = async function () {
      setLoading(true);
      setLoadError("");
      try {
        var params = {
          page: page,
          source: activeTab === "qr" ? "qr" : "all",
        };
        if (activeTab === "url") {
          params.search = debouncedSearch;
          params.status = statusFilter;
          params.sort = sortBy;
          params.tag = tagFilter;
        }
        var result = await api.get("/links/mine", { params: params });
        if (cancelled) return;
        setLinks(result.data.links);
        setPageInfo({
          total: result.data.total,
          allTotal: result.data.allTotal,
          pages: result.data.pages,
          limit: result.data.limit,
        });
        if (result.data.page !== page) setPage(result.data.page);
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
  }, [activeTab, debouncedSearch, page, reloadKey, sortBy, statusFilter, tagFilter]);

  useEffect(function () {
    var cancelled = false;
    api.get("/links/tags").then(function (result) {
      if (!cancelled) setAvailableTags(result.data.tags);
    }).catch(function (err) {
      console.error("Failed to load link tags", err);
    });
    return function () { cancelled = true; };
  }, [reloadKey]);

  var retryLoad = function () {
    setLoading(true);
    setLoadError("");
    setReloadKey(function (key) { return key + 1; });
  };

  var handleExportCsv = async function () {
    setExporting(true);
    setExportFeedback(null);
    try {
      var response = await api.get("/links/mine/export", {
        params: {
          search: search.trim(),
          status: statusFilter,
          sort: sortBy,
          tag: tagFilter,
        },
        responseType: "blob",
      });
      var objectUrl = URL.createObjectURL(
        new Blob([response.data], { type: "text/csv;charset=utf-8" }),
      );
      var anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = "shortlink-links.csv";
      anchor.click();
      window.setTimeout(function () { URL.revokeObjectURL(objectUrl); }, 1000);
      setExportFeedback({ type: "success", message: "CSV export started." });
    } catch (err) {
      setExportFeedback({
        type: "error",
        message: err.response?.status === 413
          ? "Export is limited to 5,000 links. Narrow your filters and try again."
          : "Could not export links. Please try again.",
      });
    } finally {
      setExporting(false);
    }
  };

  var handleCreated = function () {
    setSelectedIds([]);
    setPage(1);
    retryLoad();
  };

    var handleDelete = async function (id) {
      if (!confirm("Deactivate this link? You can activate it again later."))
        return;
      setActionFeedback(null);
      try {
        await api.delete("/links/" + id);
        setSelectedIds(function (prev) {
          return prev.filter(function (sid) {
            return sid !== id;
          });
        });
        retryLoad();
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
        await api.patch("/links/" + id, { longUrl: newUrl });
        retryLoad();
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
        retryLoad();
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

  var handleDestinationRestored = function (id, longUrl) {
    setLinks(function (previous) {
      return previous.map(function (link) {
        return link._id === id ? { ...link, longUrl: longUrl } : link;
      });
    });
    var query = search.trim().toLowerCase();
    var restoredLink = links.find(function (link) { return link._id === id; });
    if (
      query &&
      restoredLink &&
      !longUrl.toLowerCase().includes(query) &&
      !restoredLink.shortCode.toLowerCase().includes(query)
    ) {
      setActionFeedback({
        type: "success",
        message: "Destination restored. Refreshing the current search results.",
      });
      retryLoad();
    }
  };

  var handleBulkDelete = async function () {
    if (selectedIds.length === 0) return;
    if (!confirm("Deactivate " + selectedIds.length + " selected link(s)?"))
      return;

    setActionFeedback(null);
    setBulkLoading(true);
    try {
      await api.post("/links/bulk-delete", { ids: selectedIds });
      setSelectedIds([]);
      retryLoad();
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

  var filteredLinks = links;
  var allSelected =
    filteredLinks.length > 0 && filteredLinks.every(function (link) {
      return selectedIds.indexOf(link._id) !== -1;
    });

  var toggleSelectAllFiltered = function () {
    if (allSelected) {
      var visibleIds = filteredLinks.map(function (link) { return link._id; });
      setSelectedIds(function (previous) {
        return previous.filter(function (id) { return visibleIds.indexOf(id) === -1; });
      });
    } else {
      setSelectedIds(function (previous) {
        return Array.from(new Set(previous.concat(filteredLinks.map(function (link) { return link._id; }))));
      });
    }
  };

  var updateFilter = function (setter, value) {
    setter(value);
    setPage(1);
    setSelectedIds([]);
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
          <div className="text-left sm:text-right"><p className="font-mono text-2xl text-white">{pageInfo.allTotal}</p><p className="text-sm text-text-muted">total links</p></div>
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
                setPage(1);
                setSelectedIds([]);
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
                setPage(1);
                setSelectedIds([]);
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
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                <BulkLinkImport onImported={handleCreated} />
                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={exporting || loading || pageInfo.total === 0}
                  aria-busy={exporting}
                  className="ui-button-secondary focus-ring min-h-11 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {exporting ? "Preparing CSV…" : "Export filtered CSV"}
                </button>
              </div>
              {exportFeedback ? (
                <p
                  className={`text-sm ${exportFeedback.type === "error" ? "text-danger" : "text-led"}`}
                  role={exportFeedback.type === "error" ? "alert" : "status"}
                  aria-live="polite"
                >
                  {exportFeedback.message}
                </p>
              ) : null}
              {!loadError && pageInfo.allTotal > 0 ? (
                <LinkFilterBar
                  search={search}
                  setSearch={function (value) { updateFilter(setSearch, value); }}
                  statusFilter={statusFilter}
                  setStatusFilter={function (value) { updateFilter(setStatusFilter, value); }}
                  sortBy={sortBy}
                  setSortBy={function (value) { updateFilter(setSortBy, value); }}
                  availableTags={availableTags}
                  tagFilter={tagFilter}
                  setTagFilter={function (value) { updateFilter(setTagFilter, value); }}
                />
              ) : null}

              {loading ? (
                <ListSkeleton label="Loading links" rows={3} />
              ) : loadError ? (
                <div className="flex flex-col gap-3 rounded-xl border border-danger/25 bg-danger/5 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-text-muted" role="alert">{loadError}</p>
                  <button onClick={retryLoad} className="ui-button-secondary focus-ring w-fit text-sm">Retry</button>
                </div>
              ) : links.length === 0 && pageInfo.allTotal === 0 ? (
                <div className="border border-dashed border-white/15 rounded-lg p-8 text-center">
                  <p className="text-text-muted text-sm">
                    No links yet. Paste a URL above to patch your first one in.
                  </p>
                </div>
              ) : (
                <>
                  {filteredLinks.length > 0 ? <div className="flex items-center justify-between gap-3">
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
                          : "Select this page (" + filteredLinks.length + ")"}
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
                  </div> : null}

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
                            onDestinationRestored={handleDestinationRestored}
                            selected={selectedIds.indexOf(link._id) !== -1}
                            onToggleSelect={toggleSelect}
                          />
                        );
                      })
                    )}
                  </div>
                  <Pagination
                    page={page}
                    pages={pageInfo.pages}
                    total={pageInfo.total}
                    limit={pageInfo.limit}
                    onPageChange={setPage}
                    label="Links"
                  />
                </>
              )}
            </>
          ) : (
            <div className="space-y-6">
              <QuickQrForm
                onSaved={function () {
                  setPage(1);
                  retryLoad();
                }}
              />

              <div>
                <h2 className="text-sm font-display font-medium text-white mb-3">
                  My QR Codes
                </h2>
                {(function () {
                  var qrLinks = links;
                  if (loading) return <ListSkeleton label="Loading your QR codes" rows={2} />;
                  if (loadError) return <div className="flex flex-col gap-3 rounded-xl border border-danger/25 bg-danger/5 p-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-text-muted" role="alert">{loadError}</p><button onClick={retryLoad} className="ui-button-secondary focus-ring w-fit text-sm">Retry</button></div>;
                  if (qrLinks.length === 0 && pageInfo.allTotal === 0) {
                    return (
                      <p className="text-text-muted text-sm">
                        No QR codes generated yet.
                      </p>
                    );
                  }
                  if (qrLinks.length === 0) {
                    return <p className="text-text-muted text-sm">No QR codes generated yet.</p>;
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
                            onDestinationRestored={handleDestinationRestored}
                            selected={selectedIds.indexOf(link._id) !== -1}
                            onToggleSelect={toggleSelect}
                          />
                        );
                      })}
                    </div>
                  );
                })()}
                {!loading && !loadError ? (
                  <Pagination
                    page={page}
                    pages={pageInfo.pages}
                    total={pageInfo.total}
                    limit={pageInfo.limit}
                    onPageChange={setPage}
                    label="QR codes"
                  />
                ) : null}
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
