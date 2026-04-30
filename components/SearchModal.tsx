"use client";

// SearchModal — the full-screen search overlay that appears when the user clicks the
// search icon in the header. It searches teams, players, leagues, and live fixtures
// simultaneously, shows results grouped by type, and remembers recent searches in
// localStorage so they appear the next time the modal is opened.

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Users, User, Zap, Loader2, Trophy, Clock } from "lucide-react";
import type { OddsEvent } from "@/data/sampleOdds";
import TeamLogo from "@/components/TeamLogo";
import PlayerPhoto from "@/components/PlayerPhoto";

// ── types ─────────────────────────────────────────────────────────────────────

// Each search result group has its own shape so the icon renderer can access
// group-specific fields (e.g. homeLogo/awayLogo for events, photo for players).
interface EventResult  { id: string; group: "event";  title: string; subtitle: string; href: string; sport: string; homeLogo?: string; awayLogo?: string }
interface TeamResult   { id: string; group: "team";   title: string; subtitle: string; href: string; logo?: string }
interface PlayerResult { id: string; group: "player"; title: string; subtitle: string; href: string; photo?: string; teamLogo?: string }
interface LeagueResult { id: string; group: "league"; title: string; subtitle: string; href: string; logo?: string }

type SearchResult = EventResult | TeamResult | PlayerResult | LeagueResult;

// RecentItem is what we store in localStorage — a lightweight snapshot of whichever
// result the user clicked, so we can render it without re-fetching.
interface RecentItem { title: string; subtitle: string; href: string; type: "team" | "player" | "league" | "event" }

// localStorage key and how many recent items to keep
const RECENT_KEY = "wls_recent_searches";
const MAX_RECENT = 6;

// loadRecent — reads the saved list from localStorage; returns [] on any parse error.
function loadRecent(): RecentItem[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); } catch { return []; }
}

// saveRecent — prepends a new item to the list, deduplicates by href, and trims to MAX_RECENT.
function saveRecent(item: RecentItem) {
  try {
    const existing = loadRecent().filter((r) => r.href !== item.href);
    localStorage.setItem(RECENT_KEY, JSON.stringify([item, ...existing].slice(0, MAX_RECENT)));
  } catch { /* ignore — private browsing may throw */ }
}

// ── helpers ───────────────────────────────────────────────────────────────────

// formatKickoff — converts an ISO timestamp into a human-readable relative string
// ("in 45m", "in 2h 15m", "in 3d 4h", or "In progress" for past times).
function formatKickoff(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (diff < 0) return "In progress";
  if (h < 1)   return `in ${m}m`;
  if (h < 24)  return `in ${h}h ${m}m`;
  return `in ${Math.floor(h / 24)}d ${h % 24}h`;
}

// searchEvents — filters the locally-cached live events array by team name or league name,
// limited to 4 results so the modal doesn't overflow.
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

// GROUP_META — maps each result group key to a display label and a Lucide icon,
// used to render the section headers above each group of results.
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
  const [activeIdx, setActiveIdx] = useState(0);    // which result is keyboard-highlighted
  const [searching, setSearching] = useState(false); // true while the API call is in-flight
  const [recent, setRecent]       = useState<RecentItem[]>([]);

  // Load recent searches from localStorage once the modal mounts
  useEffect(() => { setRecent(loadRecent()); }, []);

  // Fetch the full events list once on mount and cache it in state.
  // These are the "live" betting events used for the fixture search group.
  const [events, setEvents] = useState<OddsEvent[]>([]);
  useEffect(() => {
    fetch("/api/events?sport=all")
      .then((r) => r.ok ? r.json() : { events: [] })
      .then((d) => setEvents(d.events ?? []))
      .catch(() => {});
  }, []);

  // API results — stored separately so they can be updated independently
  const [apiTeams,   setApiTeams]   = useState<TeamResult[]>([]);
  const [apiPlayers, setApiPlayers] = useState<PlayerResult[]>([]);
  const [apiLeagues, setApiLeagues] = useState<LeagueResult[]>([]);

  // runApiSearch — sends one request to /api/football/search which internally
  // fans out to the teams, players, and leagues endpoints in parallel.
  const runApiSearch = useCallback(async (q: string) => {
    // Don't bother the API for very short queries; also clear stale results.
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

      // Transform each raw API shape into the typed SearchResult variants
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
      // silent — network errors just show no results rather than crashing
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounce the API call by 350 ms so we don't fire on every keystroke
  useEffect(() => {
    const t = setTimeout(() => runApiSearch(query), 350);
    return () => clearTimeout(t);
  }, [query, runApiSearch]);

  // Reset keyboard highlight to the top result whenever the query changes
  useEffect(() => { setActiveIdx(0); }, [query]);

  // Auto-focus the text input when the modal opens
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Build the grouped result list. Events come from the local cache; teams/players/leagues
  // come from the API. Groups with zero results are removed so no empty headers appear.
  const eventResults = query.length >= 2 ? searchEvents(events, query) : [];
  const grouped: { key: "event" | "team" | "player" | "league"; items: SearchResult[] }[] = [
    { key: "event",  items: eventResults },
    { key: "team",   items: apiTeams     },
    { key: "player", items: apiPlayers   },
    { key: "league", items: apiLeagues   },
  ].filter((g) => g.items.length > 0);

  // flat — all results as a single array so keyboard navigation can use a single index
  const flat = grouped.flatMap((g) => g.items);
  const showEmpty  = query.length >= 2 && !searching && flat.length === 0;
  const showRecent = query.length < 2 && recent.length > 0;

  // handleNavigate — called when a result is clicked or Enter is pressed.
  // Saves to recent history before navigating so the item appears next time.
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

  // handleRecentClick — clicking a recent item re-saves it (moves it to top) and navigates.
  function handleRecentClick(item: RecentItem) {
    saveRecent(item);
    router.push(item.href);
    onClose();
  }

  // Keyboard navigation — Escape closes, arrow keys move the highlighted index,
  // Enter triggers navigation on the currently highlighted result.
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
    // Clicking the backdrop (the dimmed area outside the modal) closes it
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-gray-900/50 px-4 pt-[10vh] backdrop-blur-sm"
      onClick={onClose}
    >
      {/* stopPropagation prevents clicks inside the modal from bubbling to the backdrop */}
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-bg-border bg-bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input row — spinner replaces the search icon while the API is loading */}
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
          {/* Clear button — only visible when there is text in the input */}
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

        {/* Scrollable results area — max height prevents the modal growing taller than 60% of viewport */}
        <div className="max-h-[60vh] overflow-y-auto">

          {/* Recent searches — shown when the query is empty and there is history */}
          {showRecent && (
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-slate-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Recent</span>
                </div>
                {/* Clear all — removes the localStorage entry and empties local state */}
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

          {/* Empty prompt — shown when the query is empty and there is no history */}
          {query.length < 2 && !showRecent && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Search className="h-7 w-7 text-slate-600" />
              <p className="text-sm text-slate-500">Search teams, players and competitions</p>
            </div>
          )}

          {/* No results — shown after the API returns with zero matches */}
          {showEmpty && (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-slate-500">
                No results for <span className="text-white">&ldquo;{query}&rdquo;</span>
              </p>
            </div>
          )}

          {/* Search results — grouped by type with a labelled header per group */}
          {flat.length > 0 && (
            <div className="p-2">
              {grouped.map(({ key, items }) => {
                const { label, Icon } = GROUP_META[key];
                return (
                  <div key={key} className="mb-1">
                    {/* Group header: icon + label */}
                    <div className="flex items-center gap-2 px-3 py-1.5">
                      <Icon className="h-3 w-3 text-slate-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
                    </div>
                    {items.map((result) => {
                      // flat.indexOf gives us the global index so keyboard highlight
                      // works across all groups with a single activeIdx number.
                      const idx      = flat.indexOf(result);
                      const isActive = idx === activeIdx;
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleNavigate(result)}
                          // Hovering updates activeIdx so mouse and keyboard stay in sync
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
                          {/* Enter hint — only appears on the keyboard-active row */}
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

        {/* Footer keyboard shortcut legend — only shown when there are results to navigate */}
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

// ResultIcon — picks the right visual for each result type:
// events show two overlapping team crests, teams show one crest, leagues show
// their logo image (or a Trophy fallback), players show their headshot.
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

// RecentIcon — generic icons for the recent-searches list where we don't have
// a logo URL stored — just the type of thing the user searched for previously.
function RecentIcon({ type }: { type: RecentItem["type"] }) {
  const cls = "h-7 w-7 shrink-0 text-slate-600";
  if (type === "team")   return <Users className={cls} />;
  if (type === "player") return <User className={cls} />;
  if (type === "league") return <Trophy className={cls} />;
  return <Zap className={cls} />;
}
