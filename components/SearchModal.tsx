"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Users, User, Zap, Loader2, Trophy, Clock } from "lucide-react";
import type { OddsEvent } from "@/data/sampleOdds";
import TeamLogo from "@/components/TeamLogo";
import PlayerPhoto from "@/components/PlayerPhoto";

// ── types ─────────────────────────────────────────────────────────────────────

interface EventResult  { id: string; group: "event";  title: string; subtitle: string; href: string; sport: string; homeLogo?: string; awayLogo?: string }
interface TeamResult   { id: string; group: "team";   title: string; subtitle: string; href: string; logo?: string }
interface PlayerResult { id: string; group: "player"; title: string; subtitle: string; href: string; photo?: string; teamLogo?: string }
interface LeagueResult { id: string; group: "league"; title: string; subtitle: string; href: string; logo?: string }

type SearchResult = EventResult | TeamResult | PlayerResult | LeagueResult;

interface RecentItem { title: string; subtitle: string; href: string; type: "team" | "player" | "league" | "event" }

const RECENT_KEY = "wls_recent_searches";
const MAX_RECENT = 6;

function loadRecent(): RecentItem[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); } catch { return []; }
}
function saveRecent(item: RecentItem) {
  try {
    const existing = loadRecent().filter((r) => r.href !== item.href);
    localStorage.setItem(RECENT_KEY, JSON.stringify([item, ...existing].slice(0, MAX_RECENT)));
  } catch { /* ignore */ }
}

// ── helpers ───────────────────────────────────────────────────────────────────

function formatKickoff(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (diff < 0) return "In progress";
  if (h < 1)   return `in ${m}m`;
  if (h < 24)  return `in ${h}h ${m}m`;
  return `in ${Math.floor(h / 24)}d ${h % 24}h`;
}

function searchEvents(events: OddsEvent[], q: string): EventResult[] {
  const lower = q.toLowerCase();
  return events
    .filter((e) =>
      e.homeTeam.toLowerCase().includes(lower) ||
      e.awayTeam.toLowerCase().includes(lower) ||
      e.league.toLowerCase().includes(lower)
    )
    .slice(0, 4)
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
  event:  { label: "Fixtures",    Icon: Zap   },
  team:   { label: "Teams",       Icon: Users },
  player: { label: "Players",     Icon: User  },
  league: { label: "Competitions",Icon: Trophy},
} as const;

// ── main component ────────────────────────────────────────────────────────────

export default function SearchModal({ onClose }: { onClose: () => void }) {
  const router   = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery]         = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [searching, setSearching] = useState(false);
  const [recent, setRecent]       = useState<RecentItem[]>([]);

  // Load recent on mount
  useEffect(() => { setRecent(loadRecent()); }, []);

  // Live events cached once on mount
  const [events, setEvents] = useState<OddsEvent[]>([]);
  useEffect(() => {
    fetch("/api/events?sport=all")
      .then((r) => r.ok ? r.json() : { events: [] })
      .then((d) => setEvents(d.events ?? []))
      .catch(() => {});
  }, []);

  // API results
  const [apiTeams,   setApiTeams]   = useState<TeamResult[]>([]);
  const [apiPlayers, setApiPlayers] = useState<PlayerResult[]>([]);
  const [apiLeagues, setApiLeagues] = useState<LeagueResult[]>([]);

  const runApiSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setApiTeams([]); setApiPlayers([]); setApiLeagues([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/football/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const data: {
        teams:   { id: number; name: string; country: string; logo: string; city: string }[];
        players: { id: number; name: string; photo: string; nationality: string; position: string; team: { id: number; name: string; logo: string } | null }[];
        leagues: { id: number; name: string; logo: string; country: string; flag: string }[];
      } = await res.json();

      setApiTeams(data.teams.map((t) => ({
        id:       String(t.id),
        group:    "team" as const,
        title:    t.name,
        subtitle: [t.city, t.country].filter(Boolean).join(" · "),
        href:     `/teams/${encodeURIComponent(t.name)}`,
        logo:     t.logo,
      })));

      setApiPlayers(data.players.map((p) => ({
        id:       String(p.id),
        group:    "player" as const,
        title:    p.name,
        subtitle: [p.position, p.team?.name, p.nationality].filter(Boolean).join(" · "),
        href:     `/athletes/${p.id}`,
        photo:    p.photo,
        teamLogo: p.team?.logo,
      })));

      setApiLeagues(data.leagues.map((l) => ({
        id:       String(l.id),
        group:    "league" as const,
        title:    l.name,
        subtitle: `${l.flag} ${l.country}`,
        href:     `/leagues/${l.id}`,
        logo:     l.logo,
      })));
    } catch {
      // silent
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounce 350 ms
  useEffect(() => {
    const t = setTimeout(() => runApiSearch(query), 350);
    return () => clearTimeout(t);
  }, [query, runApiSearch]);

  // Reset active idx on query change
  useEffect(() => { setActiveIdx(0); }, [query]);

  // Focus on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Build result groups
  const eventResults = query.length >= 2 ? searchEvents(events, query) : [];
  const grouped: { key: "event" | "team" | "player" | "league"; items: SearchResult[] }[] = [
    { key: "event",  items: eventResults },
    { key: "team",   items: apiTeams     },
    { key: "player", items: apiPlayers   },
    { key: "league", items: apiLeagues   },
  ].filter((g) => g.items.length > 0);

  const flat = grouped.flatMap((g) => g.items);
  const showEmpty  = query.length >= 2 && !searching && flat.length === 0;
  const showRecent = query.length < 2 && recent.length > 0;

  function handleNavigate(result: SearchResult) {
    saveRecent({
      title:    result.title,
      subtitle: result.subtitle,
      href:     result.href,
      type:     result.group === "event" ? "event" : result.group,
    });
    setRecent(loadRecent());
    router.push(result.href);
    onClose();
  }

  function handleRecentClick(item: RecentItem) {
    saveRecent(item);
    router.push(item.href);
    onClose();
  }

  // Keyboard nav
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape")     { onClose(); return; }
      if (e.key === "ArrowDown")  { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, flat.length - 1)); }
      if (e.key === "ArrowUp")    { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && flat[activeIdx]) { handleNavigate(flat[activeIdx]); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flat, activeIdx, onClose]); // eslint-disable-line react-hooks/exhaustive-deps

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
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-500" />
          ) : (
            <Search className="h-4 w-4 shrink-0 text-slate-500" />
          )}
          <input
            ref={inputRef}
            type="text"
            placeholder="Search teams, players, competitions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => { setQuery(""); setApiTeams([]); setApiPlayers([]); setApiLeagues([]); }}
              className="text-slate-500 transition-colors hover:text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
          <kbd className="hidden rounded border border-bg-border px-2 py-0.5 text-[10px] text-slate-500 sm:inline">esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">

          {/* Recent searches (shown when query is empty) */}
          {showRecent && (
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-slate-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Recent</span>
                </div>
                <button
                  onClick={() => { localStorage.removeItem(RECENT_KEY); setRecent([]); }}
                  className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
                >
                  Clear
                </button>
              </div>
              {recent.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleRecentClick(item)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-bg-base/60 transition-colors"
                >
                  <RecentIcon type={item.type} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                    <p className="truncate text-xs text-slate-500">{item.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Empty prompt (no query, no recent) */}
          {query.length < 2 && !showRecent && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Search className="h-7 w-7 text-slate-600" />
              <p className="text-sm text-slate-500">Search teams, players and competitions</p>
            </div>
          )}

          {/* No results */}
          {showEmpty && (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-slate-500">
                No results for <span className="text-white">&ldquo;{query}&rdquo;</span>
              </p>
            </div>
          )}

          {/* Search results */}
          {flat.length > 0 && (
            <div className="p-2">
              {grouped.map(({ key, items }) => {
                const { label, Icon } = GROUP_META[key];
                return (
                  <div key={key} className="mb-1">
                    <div className="flex items-center gap-2 px-3 py-1.5">
                      <Icon className="h-3 w-3 text-slate-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
                    </div>
                    {items.map((result) => {
                      const idx      = flat.indexOf(result);
                      const isActive = idx === activeIdx;
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleNavigate(result)}
                          onMouseEnter={() => setActiveIdx(idx)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                            isActive ? "bg-bg-base" : "hover:bg-bg-base/60"
                          }`}
                        >
                          <ResultIcon result={result} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">{result.title}</p>
                            <p className="truncate text-xs text-slate-500">{result.subtitle}</p>
                          </div>
                          {isActive && (
                            <kbd className="shrink-0 rounded border border-bg-border px-1.5 py-0.5 text-[10px] text-slate-500">↵</kbd>
                          )}
                        </button>
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
          <div className="flex items-center gap-4 border-t border-bg-border px-4 py-2 text-[10px] text-slate-500">
            <span><kbd className="rounded bg-bg-border px-1 py-0.5">↑↓</kbd> navigate</span>
            <span><kbd className="rounded bg-bg-border px-1 py-0.5">↵</kbd> open</span>
            <span><kbd className="rounded bg-bg-border px-1 py-0.5">esc</kbd> close</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── icon helpers ──────────────────────────────────────────────────────────────

function ResultIcon({ result }: { result: SearchResult }) {
  if (result.group === "event") {
    return (
      <div className="flex shrink-0 items-center">
        <TeamLogo logo={result.homeLogo} name={result.title.split(" vs ")[0]} size={24} className="rounded-full border border-bg-border" />
        <TeamLogo logo={result.awayLogo} name={result.title.split(" vs ")[1] ?? ""} size={24} className="-ml-2 rounded-full border border-bg-border" />
      </div>
    );
  }
  if (result.group === "team") return <TeamLogo logo={result.logo} name={result.title} size={28} className="rounded-lg shrink-0" />;
  if (result.group === "league") {
    return result.logo ? (
      <div className="relative h-7 w-7 shrink-0">
        <Image src={result.logo} alt="" fill className="object-contain" sizes="28px" />
      </div>
    ) : <Trophy className="h-7 w-7 shrink-0 text-slate-600" />;
  }
  return <PlayerPhoto photo={result.photo} name={result.title} size={28} />;
}

function RecentIcon({ type }: { type: RecentItem["type"] }) {
  const cls = "h-7 w-7 shrink-0 text-slate-600";
  if (type === "team")   return <Users className={cls} />;
  if (type === "player") return <User className={cls} />;
  if (type === "league") return <Trophy className={cls} />;
  return <Zap className={cls} />;
}
