"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MotionToggle from "@/components/MotionToggle";

export default function Footer() {
  var pathname = usePathname();
  // Public bio pages are meant to be a clean, standalone page — no app chrome
  if (pathname && pathname.indexOf("/u/") === 0) {
    return null;
  }
  return (
    <footer className="mt-10 border-t border-white/10 px-5 py-6 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-text-muted sm:flex-row">
        <Link href="/" className="font-display text-sm font-semibold tracking-tight text-white">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-signal align-middle" />ShortLink
        </Link>
        <nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          <Link href="/privacy" className="transition-colors hover:text-white">
            Privacy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-white">
            Terms
          </Link>
          <Link href="/cookies" className="transition-colors hover:text-white">
            Cookies
          </Link>
          <Link href="/report" className="transition-colors hover:text-white">
            Report a link
          </Link>
        </nav>
        <MotionToggle />
      </div>
    </footer>
  );
}
