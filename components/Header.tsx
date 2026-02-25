"use client";

import { useState, Suspense } from "react";
import { Menu, X, Zap } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const SPORT_TABS = [
  { value: "all", label: "All Sports", emoji: "🏆", href: "/" },
  { value: "football", label: "Football", emoji: "⚽", href: "/?sport=football" },
  { value: "basketball", label: "Basketball", emoji: "🏀", href: "/?sport=basketball" },
  { value: "tennis", label: "Tennis", emoji: "🎾", href: "/?sport=tennis" },
  { value: "american_football", label: "NFL", emoji: "🏈", href: "/?sport=american_football" },
  { value: "cricket", label: "Cricket", emoji: "🏏", href: "/?sport=cricket" },
];

const navLinks = [
  { label: "Predictions", href: "/" },
  { label: "How It Works", href: "/how-it-works" },
];

function SportTabs() {
  const searchParams = useSearchParams();
  const activeSport = searchParams.get("sport") ?? "all";

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto pb-0.5 scrollbar-none">
      {SPORT_TABS.map((tab) => {
        const isActive = activeSport === tab.value;
        return (
          <Link
            key={tab.value}
            href={tab.href}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
              isActive
                ? "bg-accent-green/15 text-accent-green"
                : "text-slate-500 hover:bg-bg-border/60 hover:text-slate-300"
            }`}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

function SportTabsFallback() {
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto pb-0.5">
      {SPORT_TABS.map((tab) => (
        <span
          key={tab.value}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-500"
        >
          <span>{tab.emoji}</span>
          <span>{tab.label}</span>
        </span>
      ))}
    </div>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-bg-border bg-bg-base/90 backdrop-blur-md">
      {/* Main row */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="/" className="group flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-green">
            <Zap className="h-4 w-4 text-white" fill="white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            WeLike<span className="text-accent-green">Sportz</span>
          </span>
        </a>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Live badge */}
        <div className="hidden items-center md:flex">
          <span className="rounded-full bg-accent-green/10 px-3 py-1 text-xs font-semibold text-accent-green ring-1 ring-accent-green/20">
            LIVE DATA
          </span>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="flex items-center justify-center rounded-md p-2 text-slate-400 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sport sub-nav */}
      <div className="border-t border-bg-border/40">
        <div className="mx-auto max-w-7xl px-4 py-1 sm:px-6 lg:px-8">
          <Suspense fallback={<SportTabsFallback />}>
            <SportTabs />
          </Suspense>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="border-t border-bg-border bg-bg-surface px-4 pb-4 pt-2 md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-300 hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-3 border-t border-bg-border pt-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-600">
              Sports
            </p>
            {SPORT_TABS.map((tab) => (
              <a
                key={tab.value}
                href={tab.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 py-2 text-sm font-medium text-slate-300 hover:text-white"
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
