"use client";

import { useState, useEffect, Suspense } from "react";
import { Menu, X, Zap, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import SearchModal from "@/components/SearchModal";

const NAV_LINKS = [
  { label: "Picks",        href: "/" },
  { label: "Football",     href: "/football" },
  { label: "How It Works", href: "/how-it-works" },
];

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive =
    href === "/"
      ? pathname === "/"
      : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors ${
        isActive ? "text-accent-green" : "text-slate-400 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

function FootballSubNav() {
  const pathname = usePathname();

  const tabs = [
    { label: "All Picks",  href: "/" },
    { label: "Football Hub", href: "/football" },
  ];

  return (
    <div className="flex items-center gap-0.5 pb-0.5">
      {tabs.map((tab) => {
        const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
              isActive
                ? "bg-accent-green/15 text-accent-green"
                : "text-slate-400 hover:bg-bg-border hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-bg-border bg-bg-surface/95 backdrop-blur-md shadow-sm">
        {/* Main row */}
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-green">
              <Zap className="h-4 w-4 text-white" fill="white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              WeLike<span className="text-accent-green">Sportz</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex">
            <Suspense fallback={null}>
              {NAV_LINKS.map((l) => <NavLink key={l.href} href={l.href} label={l.label} />)}
            </Suspense>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-bg-border bg-bg-base px-3 py-1.5 text-sm text-slate-500 transition-colors hover:border-bg-border hover:text-slate-200"
              aria-label="Search"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden rounded border border-bg-border px-1.5 py-0.5 text-[10px] text-slate-500 sm:inline">
                ⌘K
              </kbd>
            </button>

            <span className="hidden rounded-full bg-accent-green/10 px-3 py-1 text-xs font-semibold text-accent-green ring-1 ring-accent-green/20 md:inline">
              ⚽ FOOTBALL
            </span>

            <button
              className="flex items-center justify-center rounded-md p-2 text-slate-400 md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Sub-nav */}
        <div className="border-t border-bg-border/60">
          <div className="mx-auto max-w-7xl px-4 py-1 sm:px-6 lg:px-8">
            <Suspense fallback={
              <div className="flex gap-0.5 pb-0.5">
                {["All Picks", "Football Hub"].map((l) => (
                  <span key={l} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-500">{l}</span>
                ))}
              </div>
            }>
              <FootballSubNav />
            </Suspense>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-bg-border bg-bg-surface px-4 pb-4 pt-2 md:hidden">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block py-2.5 text-sm font-medium text-slate-400 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
