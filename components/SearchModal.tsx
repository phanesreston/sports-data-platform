"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Users, User, Zap, Loader2 } from "lucide-react";
import type { OddsEvent } from "@/data/sampleOdds";

const SPORT_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  football:          { label: "Football",   color: "text-emerald-700", bg: "bg-emerald-50" },
  basketball:        { label: "Basketball", color: "text-orange-700",  bg: "bg-orange-50" },
  tennis:            { label: "Tennis",     color: "text-amber-700",   bg: "bg-amber-50" },
  american_football: { label: "NFL",        color: "text-blue-700",    bg: "bg-blue-50" },
  cricket:           { label: "Cricket",    color: "text-pink-700",    bg: "bg-pink-50" },
};

interface EventResult {
  id: string;
  group: "event";
  title: string;
  subtitle: string;
  href: string;
  sport: string;
  homeLogo?: string;
  awayLogo?: string;
}

interface TeamResult {
  id: string;
  group: "team";
  title: string;
  subtitle: string;
  href: string;
  logo?: string;
}

interface PlayerResult {
  id: string;
  group: "player";
  title: string;
  subtitle: string;
  href: string;
  photo?: string;
  teamLogo?: string;
}

type SearchResult = EventResult | TeamResult | PlayerResult;

function formatKickoff(isoString: string): string {
  const date = new Date(isoString);
  const now  = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffH  = Math.floor(diffMs / 3600000);
  const diffM  = Math.floor((diffMs % 3600000) / 60000);
  if (diffH < 1)  return `in ${diffM}m`;
  if (diffH < 24) return `in ${diffH}h ${diffM}m`;
  return `in ${Math.floor(diffH / 24)}d ${diffH % 24}h`;
}

function searchEvents(events: OddsEvent[], q: string): EventResult[] {
  const lower = q.toLowerCase();
  return events
    .filter(
      (e) =>
        e.homeTeam.toLowerCase().includes(lower) ||
        e.awayTeam.toLowerCase().includes(lower) ||
        e.league.toLowerCase().includes(lower)
    )
    .slice(0, 5)
    .map((e) => ({
      id:       e.id,
      group:    "event" as const,
      title:    `${e.homeTeam} vs ${e.awayTeam}`,
      subtitle: `${e.league} · ${formatKickoff(e.commenceTime)}`,
      href:     `/predictions/${e.id}`,
      sport:    e.sport,
      homeLogo: e.homeLogo,
      awayLogo: e.awayLogo,
    }));
}

const GROUP_META = {
  event:  { label: "Fixtures",           Icon: Zap },
  team:   { label: "Teams",              Icon: Users },
  player: { label: "Players",            Icon: User },
} as const;

interface Props {
  onClose: () => void;
}

export default function SearchModal({ onClose }: Props) {
  const router   = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery]         = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [searching, setSearching] = useState(false);

  // Live events cached once on mount
  const [events, setEvents] = useState<OddsEvent[]>([]);
  useEffect(() => {
    fetch("/api/events?sport=all")
      .then((r) => r.ok ? r.json() : { events: [] })
      .then((d) => setEvents(d.events ?? []))
      .catch(() => {});
  }, []);

  // API search results for teams + players
  const [apiTeams, setApiTeams]     = useState<TeamResult[]>([]);
  const [apiPlayers, setApiPlayers] = useState<PlayerResult[]>([]);

  const runApiSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setApiTeams([]); setApiPlayers([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/football/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const data: {
        teams:   { id: number; name: string; country: string; logo: string; city: string }[];
        players: { id: number; name: string; photo: string; nationality: string; position: string; team: { id: number; name: string; logo: string } | null }[];
      } = await res.json();

      setApiTeams(
        data.teams.map((t) => ({
          id:       String(t.id),
          group:    "team" as const,
          title:    t.name,
          subtitle: [t.city, t.country].filter(Boolean).join(" · "),
          href:     `/teams/${encodeURIComponent(t.name)}`,
          logo:     t.logo,
        }))
      );

      setApiPlayers(
        data.players.map((p) => ({
          id:       String(p.id),
          group:    "player" as const,
          title:    p.name,
          subtitle: [p.position, p.team?.name, p.nationality].filter(Boolean).join(" · "),
          href:     `/athletes/${p.id}`,
          photo:    p.photo,
          teamLogo: p.team?.logo,
        }))
      );
    } catch {
      // silent
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounce API search 350 ms
  useEffect(() => {
    const timer = setTimeout(() => runApiSearch(query), 350);
    return () => clearTimeout(timer);
  }, [query, runApiSearch]);

  // Reset active index on query change
  useEffect(() => { setActiveIdx(0); }, [query]);

  // Focus on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Build result groups
  const eventResults  = query.length >= 2 ? searchEvents(events, query) : [];
  const grouped: { key: "event" | "team" | "player"; items: SearchResult[] }[] = [
    { key: "event",  items: eventResults },
    { key: "team",   items: apiTeams },
    { key: "player", items: apiPlayers },
  ].filter((g) => g.items.length > 0);

  const flat = grouped.flatMap((g) => g.items);
  const showEmpty = query.length >= 2 && !searching && flat.length === 0;

  // Keyboard nav
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape")     { onClose(); return; }
      if (e.key === "ArrowDown")  { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, flat.length - 1)); }
      if (e.key === "ArrowUp")    { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && flat[activeIdx]) { router.push(flat[activeIdx].href); onClose(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flat, activeIdx, router, onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-gray-900/50 px-4 pt-[10vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-bg-border bg-bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-bg-border px-4 py-3">
          {searching ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gray-400" />
          ) : (
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
          )}
          <input
            ref={inputRef}
            type="text"
            placeholder="Search teams, players, fixtures…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
          />
          {query ? (
            <button onClick={() => { setQuery(""); setApiTeams([]); setApiPlayers([]); }} className="text-gray-400 transition-colors hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          ) : null}
          <kbd className="hidden rounded border border-bg-border px-2 py-0.5 text-[10px] text-gray-400 sm:inline">esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.length < 2 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Search className="h-7 w-7 text-gray-300" />
              <p className="text-sm text-gray-400">Search teams, players and fixtures</p>
            </div>
          ) : showEmpty ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-gray-400">
                No results for <span className="text-gray-800">&ldquo;{query}&rdquo;</span>
              </p>
            </div>
          ) : (
            <div className="p-2">
              {grouped.map(({ key, items }) => {
                const { label, Icon } = GROUP_META[key];
                return (
                  <div key={key} className="mb-1">
                    <div className="flex items-center gap-2 px-3 py-1.5">
                      <Icon className="h-3 w-3 text-gray-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
                    </div>
                    {items.map((result) => {
                      const idx      = flat.indexOf(result);
                      const isActive = idx === activeIdx;
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
                          <ResultIcon result={result} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-800">{result.title}</p>
                            <p className="truncate text-xs text-gray-400">{result.subtitle}</p>
                          </div>
                          {isActive && (
                            <kbd className="shrink-0 rounded border border-bg-border px-1.5 py-0.5 text-[10px] text-gray-400">↵</kbd>
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

        {/* Footer */}
        {flat.length > 0 && (
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

function ResultIcon({ result }: { result: SearchResult }) {
  if (result.group === "event") {
    const badge = SPORT_BADGE[result.sport];
    // Show both team logos if available, else sport badge
    if (result.homeLogo && result.awayLogo) {
      return (
        <div className="flex shrink-0 items-center">
          <div className="relative h-6 w-6 overflow-hidden rounded-full border border-bg-border bg-white">
            <Image src={result.homeLogo} alt="" fill className="object-contain p-0.5" sizes="24px" />
          </div>
          <div className="relative -ml-2 h-6 w-6 overflow-hidden rounded-full border border-bg-border bg-white">
            <Image src={result.awayLogo} alt="" fill className="object-contain p-0.5" sizes="24px" />
          </div>
        </div>
      );
    }
    return badge ? (
      <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${badge.bg} ${badge.color}`}>
        {badge.label}
      </span>
    ) : null;
  }

  if (result.group === "team" && result.logo) {
    return (
      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg bg-gray-50">
        <Image src={result.logo} alt="" fill className="object-contain p-0.5" sizes="28px" />
      </div>
    );
  }

  if (result.group === "player") {
    if (result.photo) {
      return (
        <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-gray-100">
          <Image src={result.photo} alt="" fill className="object-cover" sizes="28px" />
        </div>
      );
    }
    if (result.teamLogo) {
      return (
        <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg bg-gray-50">
          <Image src={result.teamLogo} alt="" fill className="object-contain p-0.5" sizes="28px" />
        </div>
      );
    }
  }

  return <div className="h-7 w-7 shrink-0 rounded-lg bg-bg-border" />;
}
