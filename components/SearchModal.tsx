"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X, Users, User, Zap } from "lucide-react";
import { SAMPLE_TEAMS } from "@/data/sampleTeams";
import { SAMPLE_ATHLETES } from "@/data/sampleAthletes";
import { SAMPLE_ODDS } from "@/data/sampleOdds";

const SPORT_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  football:          { label: "Football",   color: "text-emerald-700", bg: "bg-emerald-50" },
  basketball:        { label: "Basketball", color: "text-orange-700",  bg: "bg-orange-50" },
  tennis:            { label: "Tennis",     color: "text-amber-700",   bg: "bg-amber-50" },
  american_football: { label: "NFL",        color: "text-blue-700",    bg: "bg-blue-50" },
  cricket:           { label: "Cricket",    color: "text-pink-700",    bg: "bg-pink-50" },
};

interface SearchResult {
  id: string;
  group: "event" | "team" | "player";
  title: string;
  subtitle: string;
  href: string;
  sport?: string;
}

function formatKickoff(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffM = Math.floor((diffMs % 3600000) / 60000);
  if (diffH < 1) return `in ${diffM}m`;
  if (diffH < 24) return `in ${diffH}h ${diffM}m`;
  const days = Math.floor(diffH / 24);
  return `in ${days}d ${diffH % 24}h`;
}

function runSearch(query: string): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];

  const results: SearchResult[] = [];

  // Fixtures — show first as they are the core content
  for (const event of SAMPLE_ODDS) {
    if (
      event.homeTeam.toLowerCase().includes(q) ||
      event.awayTeam.toLowerCase().includes(q) ||
      event.league.toLowerCase().includes(q)
    ) {
      results.push({
        id: event.id,
        group: "event",
        title: `${event.homeTeam} vs ${event.awayTeam}`,
        subtitle: `${event.league} · ${formatKickoff(event.commenceTime)}`,
        href: `/predictions/${event.id}`,
        sport: event.sport,
      });
    }
  }

  // Teams
  for (const team of SAMPLE_TEAMS) {
    if (
      team.name.toLowerCase().includes(q) ||
      team.league.toLowerCase().includes(q) ||
      team.venue.toLowerCase().includes(q)
    ) {
      results.push({
        id: team.id,
        group: "team",
        title: team.name,
        subtitle: `${team.league} · ${team.venue}`,
        href: `/teams/${team.id}`,
        sport: team.sport,
      });
    }
  }

  // Individual athletes (tennis etc.)
  for (const athlete of SAMPLE_ATHLETES) {
    if (
      athlete.fullName.toLowerCase().includes(q) ||
      athlete.name.toLowerCase().includes(q) ||
      athlete.nationality.toLowerCase().includes(q)
    ) {
      results.push({
        id: athlete.id,
        group: "player",
        title: athlete.fullName,
        subtitle: `${athlete.league} · Ranked #${athlete.ranking} · ${athlete.nationality}`,
        href: `/athletes/${athlete.id}`,
        sport: athlete.sport,
      });
    }
  }

  // Squad players
  for (const team of SAMPLE_TEAMS) {
    for (const group of team.squad) {
      for (const player of group.players) {
        if (
          player.name.toLowerCase().includes(q) ||
          player.nationality.toLowerCase().includes(q) ||
          player.positionFull.toLowerCase().includes(q)
        ) {
          results.push({
            id: player.id,
            group: "player",
            title: player.name,
            subtitle: `${player.positionFull} · ${team.name} · #${player.number}`,
            href: `/athletes/${player.id}`,
            sport: team.sport,
          });
        }
      }
    }
  }

  return results;
}

const GROUP_META = {
  event:  { label: "Fixtures",            Icon: Zap },
  team:   { label: "Teams",               Icon: Users },
  player: { label: "Players & Athletes",  Icon: User },
} as const;

interface Props {
  onClose: () => void;
}

export default function SearchModal({ onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);

  const results = runSearch(query);

  // Group order: events → teams → players
  const grouped = (["event", "team", "player"] as const)
    .map((g) => ({ key: g, items: results.filter((r) => r.group === g) }))
    .filter((g) => g.items.length > 0);

  // Flat ordered list for keyboard nav
  const flat = grouped.flatMap((g) => g.items);

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Reset active index when query changes
  useEffect(() => { setActiveIdx(0); }, [query]);

  // Keyboard nav
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, flat.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && flat[activeIdx]) {
        router.push(flat[activeIdx].href);
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flat, activeIdx, router, onClose]);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-gray-900/50 px-4 pt-[10vh] backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-bg-border bg-bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input row */}
        <div className="flex items-center gap-3 border-b border-bg-border px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search teams, players, fixtures…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
          />
          {query ? (
            <button onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="h-4 w-4" />
            </button>
          ) : null}
          <kbd className="hidden rounded border border-bg-border px-2 py-0.5 text-[10px] text-gray-400 sm:inline">
            esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.length < 2 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Search className="h-7 w-7 text-gray-300" />
              <p className="text-sm text-gray-400">Search teams, players and fixtures</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-gray-400">No results for <span className="text-gray-800">&ldquo;{query}&rdquo;</span></p>
            </div>
          ) : (
            <div className="p-2">
              {grouped.map(({ key, items }) => {
                const { label, Icon } = GROUP_META[key];
                return (
                  <div key={key} className="mb-1">
                    {/* Group label */}
                    <div className="flex items-center gap-2 px-3 py-1.5">
                      <Icon className="h-3 w-3 text-gray-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        {label}
                      </span>
                    </div>
                    {/* Items */}
                    {items.map((result) => {
                      const idx = flat.indexOf(result);
                      const isActive = idx === activeIdx;
                      const badge = result.sport ? SPORT_BADGE[result.sport] : null;
                      return (
                        <Link
                          key={result.id}
                          href={result.href}
                          onClick={onClose}
                          onMouseEnter={() => setActiveIdx(idx)}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                            isActive ? "bg-bg-base" : "hover:bg-bg-base/60"
                          }`}
                        >
                          {badge && (
                            <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${badge.bg} ${badge.color}`}>
                              {badge.label}
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-800">{result.title}</p>
                            <p className="truncate text-xs text-gray-400">{result.subtitle}</p>
                          </div>
                          {isActive && (
                            <kbd className="shrink-0 rounded border border-bg-border px-1.5 py-0.5 text-[10px] text-gray-400">
                              ↵
                            </kbd>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hints */}
        {results.length > 0 && (
          <div className="flex items-center gap-4 border-t border-bg-border px-4 py-2 text-[10px] text-gray-400">
            <span><kbd className="rounded bg-bg-border px-1 py-0.5">↑↓</kbd> navigate</span>
            <span><kbd className="rounded bg-bg-border px-1 py-0.5">↵</kbd> open</span>
            <span><kbd className="rounded bg-bg-border px-1 py-0.5">esc</kbd> close</span>
          </div>
        )}
      </div>
    </div>
  );
}
