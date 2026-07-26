"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import CreateLinkForm from "@/components/CreateLinkForm";
import LinkCard from "@/components/LinkCard";
import api from "@/lib/api";

function DashboardContent() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLinks = async () => {
    try {
      const res = await api.get("/links/mine");
      setLinks(res.data.links);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadLinks = async () => {
      try {
        const res = await api.get("/links/mine");
        setLinks(res.data.links);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadLinks();
  }, []);

  const handleCreated = (newLink) => {
    setLinks((prev) => [newLink, ...prev]);
  };

  const handleDelete = async (id) => {
    if (!confirm("Deactivate this link?")) return;
    try {
      await api.delete(`/links/${id}`);
      setLinks((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      console.error(err);
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
          <div className="space-y-3">
            {links.map(function (link) {
              return (
                <LinkCard key={link._id} link={link} onDelete={handleDelete} />
              );
            })}
          </div>
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
