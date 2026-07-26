"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import CreateLinkForm from "@/components/CreateLinkForm";
import LinkCard from "@/components/LinkCard";
import api from "@/lib/api";

function DashboardContent() {
  var [links, setLinks] = useState([]);
  var [loading, setLoading] = useState(true);
  var [selectedIds, setSelectedIds] = useState([]);
  var [bulkLoading, setBulkLoading] = useState(false);

  useEffect(function () {
    var loadLinks = async function () {
      try {
        var res = await api.get("/links/mine");
        setLinks(res.data.links);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadLinks();
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

  var toggleSelectAll = function () {
    if (selectedIds.length === links.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(
        links.map(function (l) {
          return l._id;
        }),
      );
    }
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

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-wire font-mono mb-1">
            Dashboard
          </p>
          <h1 className="text-2xl font-display font-bold text-white">
            Your links
          </h1>
        </div>

        <CreateLinkForm onCreated={handleCreated} />

        {loading ? (
          <p className="text-text-muted text-sm">Loading links...</p>
        ) : links.length === 0 ? (
          <div className="border border-dashed border-white/15 rounded-lg p-8 text-center">
            <p className="text-text-muted text-sm">
              No links yet. Paste a URL above to patch your first one in.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.length === links.length && links.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="accent-signal w-4 h-4"
                />
                {selectedIds.length > 0
                  ? selectedIds.length + " selected"
                  : "Select all"}
              </label>

              {selectedIds.length > 0 ? (
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkLoading}
                  className="text-sm border border-danger/30 text-danger rounded-md px-3 py-1.5 hover:bg-danger/10 transition-colors disabled:opacity-50"
                >
                  {bulkLoading ? "Deactivating..." : "Deactivate selected"}
                </button>
              ) : null}
            </div>

            <div className="space-y-3">
              {links.map(function (link) {
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
          </>
        )}
      </div>
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
