"use client";

import { useState } from "react";
import { Menu, X, Zap } from "lucide-react";

const navLinks = [
  { label: "Odds", href: "#odds" },
  { label: "Leagues", href: "#leagues" },
  { label: "How It Works", href: "#how-it-works" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-bg-border bg-bg-base/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-green">
            <Zap className="h-4 w-4 text-black" fill="black" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            WeLike<span className="text-accent-green">Sportz</span>
          </span>
        </a>

        {/* Desktop nav */}
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

        {/* CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <span className="rounded-full bg-accent-green/10 px-3 py-1 text-xs font-semibold text-accent-green ring-1 ring-accent-green/20">
            LIVE ODDS
          </span>
          <a
            href="#odds"
            className="rounded-lg bg-accent-green px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            View Odds
          </a>
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

      {/* Mobile menu */}
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
          <a
            href="#odds"
            onClick={() => setMenuOpen(false)}
            className="mt-3 block rounded-lg bg-accent-green px-4 py-2 text-center text-sm font-semibold text-black"
          >
            View Odds
          </a>
        </div>
      )}
    </header>
  );
}
