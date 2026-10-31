"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Pagination from "@/components/Pagination";
import api from "@/lib/api";
import { ListSkeleton } from "@/components/LoadingSkeleton";

function BioPagesList() {
  var [pages, setPages] = useState([]);
  var [loading, setLoading] = useState(true);
  var [loadError, setLoadError] = useState("");
  var [reloadKey, setReloadKey] = useState(0);
  var [page, setPage] = useState(1);
  var [pageInfo, setPageInfo] = useState({ total: 0, pages: 0, limit: 20 });
  var [deletingId, setDeletingId] = useState(null);
  var [deleteFeedback, setDeleteFeedback] = useState(null);

  useEffect(function () {
    var cancelled = false;
    var loadPages = async function () {
      try {
        var res = await api.get("/bio/mine", { params: { page: page } });
        if (!cancelled) {
          setPages(res.data.pages);
          setPageInfo({
            total: res.data.total,
            pages: res.data.pages_count,
            limit: res.data.limit,
          });
          if (res.data.page !== page) setPage(res.data.page);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setLoadError("We couldn't load your bio pages. Check your connection and try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadPages();
    return function () {
      cancelled = true;
    };
  }, [page, reloadKey]);

  var handleDelete = async function (id) {
    if (!confirm("Delete this page? This cannot be undone.")) return;
    setDeleteFeedback(null);
    setDeletingId(id);
    try {
      await api.delete("/bio/" + id);
      setReloadKey(function (key) { return key + 1; });
      setDeleteFeedback({ type: "success", message: "Bio page deleted." });
    } catch (err) {
      setDeleteFeedback({
        type: "error",
        message: err.response?.data?.message || "We couldn’t delete this bio page. Please try again.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <ListSkeleton label="Loading bio pages" rows={2} />;
  }

  if (loadError) {
    return <div className="flex flex-col gap-3 rounded-xl border border-danger/25 bg-danger/5 p-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-text-muted" role="alert">{loadError}</p><button onClick={function () { setLoadError(""); setLoading(true); setReloadKey(function (key) { return key + 1; }); }} className="ui-button-secondary focus-ring w-fit text-sm">Retry</button></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-white">
          Your bio pages <span className="ml-2 font-mono text-base font-normal text-text-muted">{pageInfo.total}</span>
        </h1>
        <Link
          href="/dashboard/bio/new"
          className="ui-button-primary focus-ring inline-flex items-center text-sm"
        >
          New page
        </Link>
      </div>

      {deleteFeedback ? (
        <p
          className={`rounded-lg border px-4 py-3 text-sm ${deleteFeedback.type === "error" ? "border-danger/25 bg-danger/5 text-danger" : "border-led/25 bg-led/5 text-led"}`}
          role={deleteFeedback.type === "error" ? "alert" : "status"}
          aria-live={deleteFeedback.type === "error" ? "assertive" : "polite"}
        >
          {deleteFeedback.message}
        </p>
      ) : null}

      {pageInfo.total === 0 ? (
        <div className="border border-dashed border-white/15 rounded-lg p-8 text-center">
          <p className="text-text-muted text-sm">
            No bio pages yet. Create your first one.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pages.map(function (p) {
            var publicUrl = process.env.NEXT_PUBLIC_APP_URL + "/u/" + p.slug;
            return (
              <div
                key={p._id}
                className="bg-surface border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {p.displayName || p.slug}
                  </p>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-wire text-xs font-mono hover:underline"
                  >
                    {publicUrl}
                  </a>
                  <p className="text-text-muted text-xs mt-1">
                    {p.views} views
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
                  <Link
                    href={"/dashboard/bio/" + p._id}
                    className="ui-button-secondary focus-ring text-sm"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={function () {
                      handleDelete(p._id);
                    }}
                    disabled={deletingId === p._id}
                    className="focus-ring min-h-11 rounded-md border border-danger/30 px-3 text-sm text-danger hover:bg-danger/10 disabled:cursor-wait disabled:opacity-50"
                  >
                    {deletingId === p._id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Pagination
        page={page}
        pages={pageInfo.pages}
        total={pageInfo.total}
        limit={pageInfo.limit}
        onPageChange={setPage}
        label="Bio pages"
      />
    </div>
  );
}

export default function BioPagesListPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-ink">
        <Navbar />
        <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
          <BioPagesList />
        </div>
      </div>
    </ProtectedRoute>
  );
}
