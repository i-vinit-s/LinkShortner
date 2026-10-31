"use client";

import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import BioBuilder from "@/components/BioBuilder";

export default function EditBioPage() {
  var params = useParams();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-ink">
        <Navbar />
        <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
          <div className="mb-6">
            <p className="mb-2 text-sm text-text-muted">Bio page</p>
            <h1 className="text-3xl font-display font-semibold tracking-tight text-white">Edit page</h1>
          </div>
          <BioBuilder pageId={params.id} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
