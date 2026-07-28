"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";

function BioPagesList() {
  var [pages, setPages] = useState([]);
  var [loading, setLoading] = useState(true);

  var loadPages = async function () {
    try {
      var res = await api.get("/bio/mine");
      setPages(res.data.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(function () {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loadPages is also called from the search form and toggle/delete handlers; refetching on page change is intended
    loadPages();
  }, []);

  var handleDelete = async function (id) {
    if (!confirm("Delete this page? This cannot be undone.")) return;
    try {
      await api.delete("/bio/" + id);
      setPages(function (prev) {
        return prev.filter(function (p) {
          return p._id !== id;
        });
      });
    } catch (err) {
      alert("Failed to delete page");
    }
  };

  if (loading) {
    return <p className="text-text-muted text-sm">Loading...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-white">
          Your bio pages
        </h1>
        <Link
          href="/dashboard/bio/new"
          className="bg-signal text-ink font-display font-medium rounded-md px-4 py-2 hover:brightness-110 transition text-sm"
        >
          + New page
        </Link>
      </div>

      {pages.length === 0 ? (
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
                className="bg-surface border border-white/10 rounded-lg p-4 flex items-center justify-between gap-3"
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
                    className="text-xs border border-white/15 rounded-md px-3 py-1.5 text-text-muted hover:text-white"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={function () {
                      handleDelete(p._id);
                    }}
                    className="text-xs border border-danger/30 text-danger rounded-md px-3 py-1.5 hover:bg-danger/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function BioPagesListPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-ink">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <BioPagesList />
        </div>
      </div>
    </ProtectedRoute>
  );
}
