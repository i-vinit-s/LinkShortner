"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

function MenuIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.push("/login");
  };

  return (
    <nav className="border-b border-white/10 bg-ink px-4 sm:px-6 py-4 relative">
      <div className="flex justify-between items-center">
        <Link
          href="/"
          className="font-display font-bold text-lg tracking-tight text-white"
          onClick={() => setMenuOpen(false)}
        >
          Short<span className="text-signal">Link</span>
        </Link>

        {/* Desktop nav — hidden below sm breakpoint */}
        <div className="hidden sm:flex items-center gap-4">
          {user && (
            <span className="text-sm text-text-muted font-body">
              {user.name}
            </span>
          )}
          <Link
              href="/dashboard/bio"
              className="text-sm border border-white/15 rounded-md px-3 py-1.5 text-text-muted hover:text-white hover:border-white/30 transition-colors"
            >
              Bio Page
            </Link>
          {user && user.isAdmin ? (
            <Link
              href="/admin"
              className="text-sm border border-white/15 rounded-md px-3 py-1.5 text-text-muted hover:text-white hover:border-white/30 transition-colors"
            >
              Admin Panel
            </Link>
          ) : null}
          {user && (
            <button
              onClick={handleLogout}
              className="text-sm border border-red-500/20 rounded-md px-3 py-1.5 text-red-400 hover:text-red-300 hover:border-red-500/40 hover:bg-red-500/5 transition-colors"
            >
              Log out
            </button>
          )}
        </div>

        {/* Mobile hamburger — hidden at sm and above */}
        {user ? (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden text-text-muted hover:text-white transition-colors"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        ) : null}
      </div>

      {/* Mobile dropdown panel */}
      {menuOpen && user ? (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-ink border-b border-white/10 px-4 py-3 flex flex-col gap-2 z-50">
          <span className="text-sm text-text-muted font-body px-1 py-1">
            {user.name}
          </span>
          {user.isAdmin ? (
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="text-sm border border-white/15 rounded-md px-3 py-2 text-text-muted hover:text-white hover:border-white/30 transition-colors text-center"
            >
              Admin Panel
            </Link>
          ) : null}
          <button
            onClick={handleLogout}
            className="text-sm border border-white/15 rounded-md px-3 py-2 text-text-muted hover:text-white hover:border-white/30 transition-colors"
          >
            Log out
          </button>
        </div>
      ) : null}
    </nav>
  );
}
