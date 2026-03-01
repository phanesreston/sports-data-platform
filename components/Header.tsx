"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Menu, X, Zap, Search, ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import SearchModal from "@/components/SearchModal";

// Approximate pixel width reserved for the "More ▾" button
const MORE_BTN_PX = 92;

const SPORT_TABS = [
  { value: "all",               label: "All Sports",   emoji: "🏆", href: "/" },
  { value: "football",          label: "Football",     emoji: "⚽", href: "/?sport=football" },
  { value: "nba",               label: "NBA",          emoji: "🏀", href: "/?sport=nba" },
  { value: "american_football", label: "NFL & NCAA",   emoji: "🏈", href: "/?sport=american_football" },
  { value: "formula1",          label: "Formula 1",   emoji: "🏎️", href: "/?sport=formula1" },
  { value: "basketball",        label: "Basketball",   emoji: "🎯", href: "/?sport=basketball" },
  { value: "cricket",           label: "Cricket",      emoji: "🏏", href: "/?sport=cricket" },
  { value: "rugby",             label: "Rugby",        emoji: "🏉", href: "/?sport=rugby" },
  { value: "baseball",          label: "Baseball",     emoji: "⚾", href: "/?sport=baseball" },
  { value: "afl",               label: "AFL",          emoji: "🦘", href: "/?sport=afl" },
  { value: "tennis",            label: "Tennis",       emoji: "🎾", href: "/?sport=tennis" },
  { value: "hockey",            label: "Hockey",       emoji: "🏒", href: "/?sport=hockey" },
  { value: "mma",               label: "MMA",          emoji: "🥊", href: "/?sport=mma" },
  { value: "volleyball",        label: "Volleyball",   emoji: "🏐", href: "/?sport=volleyball" },
  { value: "handball",          label: "Handball",     emoji: "🤾", href: "/?sport=handball" },
  { value: "horse_racing",      label: "Horse Racing", emoji: "🐎", href: "/?sport=horse_racing" },
];

const navLinks = [
  { label: "Predictions",  href: "/" },
  { label: "How It Works", href: "/how-it-works" },
];

function SportTabs() {
  const searchParams = useSearchParams();
  const activeSport = searchParams.get("sport") ?? "all";
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [overflowStart, setOverflowStart] = useState(SPORT_TABS.length);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Recalculate which tabs fit whenever the container resizes
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const recalc = () => {
      const wrapperRight = wrapper.getBoundingClientRect().right;
      const tabs = Array.from(
        wrapper.querySelectorAll<HTMLElement>("[data-sport-tab]"),
      );
      if (!tabs.length) return;

      // If everything fits without a More button, show all
      if (tabs[tabs.length - 1].getBoundingClientRect().right <= wrapperRight) {
        setOverflowStart(SPORT_TABS.length);
        return;
      }

      // Find the first tab whose right edge would leave no room for the More button
      const threshold = wrapperRight - MORE_BTN_PX;
      let first = SPORT_TABS.length;
      for (let i = 0; i < tabs.length; i++) {
        if (tabs[i].getBoundingClientRect().right > threshold) {
          first = i;
          break;
        }
      }
      setOverflowStart(Math.max(1, first));
    };

    const ro = new ResizeObserver(recalc);
    ro.observe(wrapper);
    recalc();
    return () => ro.disconnect();
  }, []);

  // Close dropdown on any outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const close = () => setDropdownOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [dropdownOpen]);

  const overflowTabs = SPORT_TABS.slice(overflowStart);
  const hasOverflow = overflowTabs.length > 0;
  const activeInOverflow = overflowTabs.some((t) => t.value === activeSport);

  return (
    <div ref={wrapperRef} className="relative flex items-center overflow-hidden pb-0.5">
      {/* All tabs live in the DOM — overflow ones are clipped by the wrapper */}
      <div className="flex items-center gap-0.5">
        {SPORT_TABS.map((tab) => {
          const isActive = activeSport === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.href}
              data-sport-tab={tab.value}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                isActive
                  ? "bg-accent-green/15 text-accent-green"
                  : "text-gray-500 hover:bg-bg-border hover:text-gray-800"
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* "More" button — absolutely pinned to the right edge */}
      <div
        className={`absolute right-0 flex items-center transition-opacity duration-150 ${
          hasOverflow ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {/* Soft fade so the last visible tab doesn't get hard-clipped */}
        <div className="h-8 w-6 bg-gradient-to-r from-transparent to-bg-surface" />
        <div className="relative bg-bg-surface pl-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen((o) => !o);
            }}
            className={`flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
              activeInOverflow
                ? "bg-accent-green/15 text-accent-green"
                : "text-gray-500 hover:bg-bg-border hover:text-gray-800"
            }`}
          >
            More
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-bg-border bg-bg-surface py-1 shadow-lg">
              {overflowTabs.map((tab) => {
                const isActive = activeSport === tab.value;
                return (
                  <Link
                    key={tab.value}
                    href={tab.href}
                    onClick={() => setDropdownOpen(false)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-accent-green/10 text-accent-green"
                        : "text-gray-600 hover:bg-bg-border hover:text-gray-900"
                    }`}
                  >
                    <span>{tab.emoji}</span>
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SportTabsFallback() {
  // Show a sensible subset during SSR so the bar doesn't overflow
  return (
    <div className="flex items-center gap-0.5 overflow-hidden pb-0.5">
      {SPORT_TABS.slice(0, 6).map((tab) => (
        <span
          key={tab.value}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-400"
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
  const [searchOpen, setSearchOpen] = useState(false);

  // ⌘K / Ctrl+K global shortcut
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
          <a href="/" className="group flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-green">
              <Zap className="h-4 w-4 text-white" fill="white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              WeLike<span className="text-accent-green">Sportz</span>
            </span>
          </a>

          {/* Desktop nav links */}
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-800"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right side: search + live badge */}
          <div className="flex items-center gap-3">
            {/* Search button — pill on desktop, icon on mobile */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-bg-border bg-bg-base px-3 py-1.5 text-sm text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-700"
              aria-label="Search"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden rounded border border-bg-border px-1.5 py-0.5 text-[10px] text-gray-400 sm:inline">
                ⌘K
              </kbd>
            </button>

            {/* Live badge — desktop only */}
            <span className="hidden rounded-full bg-accent-green/10 px-3 py-1 text-xs font-semibold text-accent-green ring-1 ring-accent-green/20 md:inline">
              LIVE DATA
            </span>

            {/* Mobile menu toggle */}
            <button
              className="flex items-center justify-center rounded-md p-2 text-gray-500 md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Sport sub-nav */}
        <div className="border-t border-bg-border/60">
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
                className="block py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 border-t border-bg-border pt-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                Sports
              </p>
              {SPORT_TABS.map((tab) => (
                <a
                  key={tab.value}
                  href={tab.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Search modal — rendered outside header so it sits above everything */}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
