"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/Icon";
import Navbar from "@/components/Navbar";

function Brand() {
  return (
    <span className="font-display text-lg font-semibold tracking-tight text-white">
      <span aria-hidden="true" className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-signal" />
      ShortLink
    </span>
  );
}

export default function PublicHeader() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (user && !loading) return <Navbar />;

  const closeMenu = (event) => {
    setMenuOpen(false);
    const details = event?.currentTarget?.closest("details");
    if (details) details.open = false;
  };
  const handleDropdownKeyDown = (event) => {
    if (event.key === "Escape") {
      event.currentTarget.open = false;
      event.currentTarget.querySelector("summary")?.focus();
    }
  };
  const activeClass = (href) =>
    pathname === href ? "bg-white/10 text-white" : "text-text-muted hover:bg-white/5 hover:text-white";
  const resources = [
    { href: "/report", label: "Report a link" },
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/cookies", label: "Cookies" },
  ];

  if (loading) {
    return (
      <header className="border-b border-white/10 px-5 sm:px-8" aria-busy="true">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4">
          <Link href="/" aria-label="ShortLink home" className="focus-ring rounded-md"><Brand /></Link>
          <span aria-hidden="true" className="h-9 w-28 animate-pulse rounded-xl bg-surface motion-reduce:animate-none" />
        </div>
      </header>
    );
  }

  return (
    <header className="relative z-30 border-b border-white/10 bg-ink/90 px-4 backdrop-blur-xl sm:px-8">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4">
        <Link href="/" onClick={closeMenu} aria-label="ShortLink home" className="focus-ring rounded-md"><Brand /></Link>

        <nav aria-label="Public navigation" className="hidden items-center gap-2 sm:flex">
          <Link href="/pricing" aria-current={pathname === "/pricing" ? "page" : undefined} className={`focus-ring flex min-h-11 items-center rounded-xl px-4 text-sm transition-colors duration-200 ${activeClass("/pricing")}`}>
            Pricing
          </Link>
          <details name="public-nav" onKeyDown={handleDropdownKeyDown} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false; }} className="group relative">
            <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-4 text-sm text-text-muted transition-colors duration-200 hover:bg-white/5 hover:text-white [&::-webkit-details-marker]:hidden">
              Resources <Icon name="chevronDown" size={15} className="transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="absolute right-0 top-full z-50 mt-3 w-56 rounded-2xl border border-white/10 bg-surface p-2 shadow-2xl shadow-black/40">
              {resources.map((item) => (
                <Link key={item.href} href={item.href} onClick={closeMenu} aria-current={pathname === item.href ? "page" : undefined} className={`focus-ring flex min-h-11 items-center rounded-lg px-3 text-sm transition-colors duration-200 ${activeClass(item.href)}`}>
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
          <Link href="/login" className="focus-ring ml-1 inline-flex min-h-11 items-center rounded-xl border border-white/15 bg-white/[0.03] px-4 text-sm font-medium text-white transition-colors duration-200 hover:border-white/30 hover:bg-white/[0.07]">
            Log in
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="focus-ring flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-text-muted transition-colors hover:bg-white/[0.07] hover:text-white sm:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-public-menu"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          <Icon name={menuOpen ? "close" : "menu"} size={20} />
        </button>
      </div>

      {menuOpen ? (
        <nav id="mobile-public-menu" aria-label="Public navigation" className="absolute left-3 right-3 top-full z-50 mt-2 rounded-2xl border border-white/10 bg-surface p-3 shadow-2xl shadow-black/50 sm:hidden">
          <Link href="/pricing" onClick={closeMenu} aria-current={pathname === "/pricing" ? "page" : undefined} className={`focus-ring flex min-h-11 items-center rounded-lg px-3 text-sm ${activeClass("/pricing")}`}>
            Pricing
          </Link>
          <details onKeyDown={handleDropdownKeyDown} className="group rounded-xl">
            <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg px-3 text-sm font-medium text-white [&::-webkit-details-marker]:hidden">
              Resources <Icon name="chevronDown" size={16} className="text-text-muted transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="space-y-1 px-1 pb-2 pt-1">
              {resources.map((item) => (
                <Link key={item.href} href={item.href} onClick={closeMenu} aria-current={pathname === item.href ? "page" : undefined} className={`focus-ring flex min-h-11 items-center rounded-lg px-3 text-sm ${activeClass(item.href)}`}>
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
          <Link href="/login" onClick={closeMenu} className="focus-ring mt-1 flex min-h-11 items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] px-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.07]">
            Log in
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
