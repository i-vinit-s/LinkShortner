"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/Icon";

function Brand() {
  return <span className="inline-flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight text-white"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-signal" />ShortLink</span>;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);
  const handleLogout = async () => {
    closeMenu();
    await logout();
    router.push("/login");
  };

  const links = [
    { href: "/dashboard", label: "Links", icon: "link" },
    { href: "/dashboard/bio", label: "Bio page", icon: "layers" },
    { href: "/pricing", label: "Billing", icon: "creditCard" },
    ...(user?.isAdmin ? [{ href: "/admin", label: "Admin", icon: "shield" }] : []),
  ];

  return (
    <nav className="relative z-20 border-b border-white/10 bg-ink px-5 py-4 sm:px-8" aria-label="Primary navigation">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" onClick={closeMenu} className="focus-ring rounded-lg" aria-label="ShortLink home"><Brand /></Link>
        <div className="hidden items-center gap-1 sm:flex">
          {links.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`focus-ring inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${active ? "bg-white/10 text-white" : "text-text-muted hover:text-white"}`}><Icon name={item.icon} size={16} />{item.label}</Link>;
          })}
          <span className="mx-2 h-5 w-px bg-white/10" aria-hidden="true" />
          <span className="max-w-32 truncate px-2 text-sm text-text-muted" title={user?.name}>{user?.name}</span>
          <button onClick={handleLogout} className="focus-ring rounded-md px-3 py-2 text-sm text-[#B7B7B7] transition-colors hover:text-danger">Log out</button>
        </div>
        <button onClick={() => setMenuOpen((open) => !open)} className="focus-ring flex min-h-11 min-w-11 items-center justify-center rounded-md border border-white/10 text-[#B7B7B7] sm:hidden" aria-expanded={menuOpen} aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}><Icon name={menuOpen ? "close" : "menu"} size={20} /></button>
      </div>
      {menuOpen ? <div className="absolute left-0 right-0 top-full z-50 border-b border-white/10 bg-surface px-5 py-3 sm:hidden"><p className="border-b border-white/10 px-3 py-2 text-sm text-text-muted">{user?.name}</p>{links.map((item) => <Link key={item.href} href={item.href} onClick={closeMenu} className="focus-ring flex items-center gap-3 rounded-md px-3 py-3 text-sm text-text-muted hover:bg-white/5 hover:text-white"><Icon name={item.icon} size={17} />{item.label}</Link>)}<button onClick={handleLogout} className="focus-ring flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm text-danger hover:bg-danger/10"><Icon name="power" size={17} />Log out</button></div> : null}
    </nav>
  );
}
