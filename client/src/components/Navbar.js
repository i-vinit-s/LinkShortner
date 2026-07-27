"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <nav className="border-b border-white/10 bg-ink px-6 py-4 flex justify-between items-center">
      <Link
        href="/dashboard"
        className="font-display font-bold text-lg tracking-tight text-white"
      >
        Short<span className="text-signal">Link</span>
      </Link>
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-text-muted font-body">{user.name}</span>
        )}
        {user && user.isAdmin ? (
          <button
            href="/admin"
            className="text-sm border border-white/15 rounded-md px-3 py-1.5 text-text-muted hover:text-white hover:border-white/30 transition-colors"
          >
            <Link href={"/admin"}>Admin Panel</Link>
          </button>
        ) : null}
        {user && (
          <button
            onClick={handleLogout}
            className="text-sm border border-white/15 rounded-md px-3 py-1.5 text-text-muted hover:text-white hover:border-white/30 transition-colors"
          >
            Log out
          </button>
        )}
      </div>
    </nav>
  );
}
