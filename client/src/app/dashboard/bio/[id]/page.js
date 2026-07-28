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
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-widest text-wire font-mono mb-1">
              Bio Page
            </p>
            <h1 className="text-2xl font-display font-bold text-white">
              Edit page
            </h1>
          </div>
          <BioBuilder pageId={params.id} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
