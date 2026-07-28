"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  var pathname = usePathname();

  // Public bio pages are meant to be a clean, standalone page — no app chrome
  if (pathname && pathname.indexOf("/u/") === 0) {
    return null;
  }
  return (
    <footer className="border-t border-white/10 px-6 py-4 mt-auto">
      <div className="max-w-3xl mx-auto flex flex-wrap gap-4 justify-center text-xs text-text-muted">
        <Link href="/privacy" className="hover:text-wire">
          Privacy
        </Link>
        <Link href="/terms" className="hover:text-wire">
          Terms
        </Link>
        <Link href="/cookies" className="hover:text-wire">
          Cookies
        </Link>
        <Link href="/report" className="hover:text-wire">
          Report a link
        </Link>
      </div>
    </footer>
  );
}
