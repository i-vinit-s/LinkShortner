"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/Icon";

function Brand() {
  return <span className="inline-flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight text-white"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-signal" />ShortLink</span>;
}

function NavItem({ href, label, icon, pathname, onClick }) {
  const active = pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`focus-ring flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-200 ${active ? "bg-white/10 text-white" : "text-text-muted hover:bg-white/5 hover:text-white"}`}
    >
      <Icon name={icon} size={17} />
      <span>{label}</span>
      {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-signal" aria-hidden="true" /> : null}
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);
  const closeDropdown = (event) => {
    const details = event.currentTarget.closest("details");
    if (details) details.open = false;
    closeMenu();
  };
  const handleDropdownKeyDown = (event) => {
    if (event.key === "Escape") {
      event.currentTarget.open = false;
      event.currentTarget.querySelector("summary")?.focus();
    }
  };
  const handleLogout = async () => {
    closeMenu();
    await logout();
    router.push("/login");
  };

  const workspaceActive = pathname?.startsWith("/dashboard");
  const accountActive = pathname === "/pricing" || pathname?.startsWith("/admin");

  return (
    <nav className="relative z-30 border-b border-white/10 bg-ink/90 px-4 backdrop-blur-xl sm:px-8" aria-label="Primary navigation">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4">
        <Link href="/" onClick={closeMenu} className="focus-ring rounded-lg" aria-label="ShortLink home"><Brand /></Link>

        <div className="hidden items-center gap-2 sm:flex">
          <details name="desktop-nav" onKeyDown={handleDropdownKeyDown} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false; }} className="group relative">
            <summary className={`focus-ring flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-4 text-sm transition-colors duration-200 [&::-webkit-details-marker]:hidden ${workspaceActive ? "bg-white/10 text-white" : "text-text-muted hover:bg-white/5 hover:text-white"}`}>
              Workspace <Icon name="chevronDown" size={15} className="transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="absolute left-0 top-full z-50 mt-3 w-64 rounded-2xl border border-white/10 bg-surface p-2 shadow-2xl shadow-black/40">
              <p className="px-3 pb-2 pt-1 text-xs font-medium uppercase tracking-wider text-text-muted">Manage</p>
              <NavItem href="/dashboard" label="Links" icon="link" pathname={pathname} onClick={closeDropdown} />
              <NavItem href="/dashboard/bio" label="Bio pages" icon="layers" pathname={pathname} onClick={closeDropdown} />
            </div>
          </details>

          <details name="desktop-nav" onKeyDown={handleDropdownKeyDown} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false; }} className="group relative">
            <summary className={`focus-ring flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-4 text-sm transition-colors duration-200 [&::-webkit-details-marker]:hidden ${accountActive ? "bg-white/10 text-white" : "text-text-muted hover:bg-white/5 hover:text-white"}`}>
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-medium text-white" aria-hidden="true">
                {(user?.name || user?.email || "A").charAt(0).toUpperCase()}
              </span>
              Account <Icon name="chevronDown" size={15} className="transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="absolute right-0 top-full z-50 mt-3 w-64 rounded-2xl border border-white/10 bg-surface p-2 shadow-2xl shadow-black/40">
              <p className="truncate px-3 pb-2 pt-1 text-xs text-text-muted" title={user?.email || user?.name}>{user?.email || user?.name || "Your account"}</p>
              <NavItem href="/pricing" label="Billing" icon="creditCard" pathname={pathname} onClick={closeDropdown} />
              {user?.isAdmin ? <NavItem href="/admin" label="Admin" icon="shield" pathname={pathname} onClick={closeDropdown} /> : null}
              <div className="my-2 border-t border-white/10" />
              <button onClick={handleLogout} className="focus-ring flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-text-muted transition-colors duration-200 hover:bg-danger/10 hover:text-danger">
                <Icon name="power" size={17} /> Log out
              </button>
            </div>
          </details>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="focus-ring flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-text-muted transition-colors hover:bg-white/[0.07] hover:text-white sm:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-primary-menu"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          <Icon name={menuOpen ? "close" : "menu"} size={20} />
        </button>
      </div>

      {menuOpen ? (
        <div id="mobile-primary-menu" className="absolute left-3 right-3 top-full z-50 mt-2 rounded-2xl border border-white/10 bg-surface p-3 shadow-2xl shadow-black/50 sm:hidden">
          <div className="mb-2 border-b border-white/10 px-3 pb-3 pt-1">
            <p className="text-xs text-text-muted">Signed in as</p>
            <p className="mt-1 truncate text-sm font-medium text-white">{user?.name || user?.email}</p>
          </div>
          <details onKeyDown={handleDropdownKeyDown} className="group rounded-xl">
            <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg px-3 text-sm font-medium text-white [&::-webkit-details-marker]:hidden">
              Workspace <Icon name="chevronDown" size={16} className="text-text-muted transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="space-y-1 px-1 pb-2 pt-1">
              <NavItem href="/dashboard" label="Links" icon="link" pathname={pathname} onClick={closeMenu} />
              <NavItem href="/dashboard/bio" label="Bio pages" icon="layers" pathname={pathname} onClick={closeMenu} />
            </div>
          </details>
          <details onKeyDown={handleDropdownKeyDown} className="group rounded-xl">
            <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg px-3 text-sm font-medium text-white [&::-webkit-details-marker]:hidden">
              Account <Icon name="chevronDown" size={16} className="text-text-muted transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="space-y-1 px-1 pb-2 pt-1">
              <NavItem href="/pricing" label="Billing" icon="creditCard" pathname={pathname} onClick={closeMenu} />
              {user?.isAdmin ? <NavItem href="/admin" label="Admin" icon="shield" pathname={pathname} onClick={closeMenu} /> : null}
              <button onClick={handleLogout} className="focus-ring flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-danger transition-colors hover:bg-danger/10">
                <Icon name="power" size={17} /> Log out
              </button>
            </div>
          </details>
        </div>
      ) : null}
    </nav>
  );
}
