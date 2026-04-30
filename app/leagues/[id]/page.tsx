"use client";

// League hub page — /leagues/[id]
// Displays a tabbed dashboard for a football league: Overview (current round
// fixtures + condensed table + form guide), Fixtures (gameweek navigation),
// Standings (full table with All / Home / Away toggle), Teams, and Top Players.

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Target,
  LayoutDashboard, Calendar, BarChart2, Users, Trophy, TrendingUp,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Tab = "overview" | "fixtures" | "standings" | "teams" | "players";
// Which split of the standings to display: overall, home-only, or away-only
type StandingsView = "all" | "home" | "away";

// Football seasons run Aug–May, so season 2024 means the 2024/25 campaign.
// Month >= 7 (August) means we're in the new season; otherwise it's still last year's.
const CURRENT_SEASON = (() => {
  const now = new Date();
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
})();
const SEASONS = [CURRENT_SEASON, CURRENT_SEASON - 1, CURRENT_SEASON - 2];

// seasonLabel — formats a season year as "2024/25"
function seasonLabel(s: number) {
  return `${s}/${String(s + 1).slice(2)}`;
}

// formatRound — converts the API's verbose round string ("Regular Season - 28")
// into the shorter gameweek format ("GW 28") shown in the UI.
// Non-standard strings (e.g. "Relegation Round") are returned unchanged.
function formatRound(round: string): string {
  const m = round.match(/Regular Season - (\d+)/);
  return m ? `GW ${m[1]}` : round;
}

// formPts — calculates points earned in the last 5 matches from a form string
// like "WWDLW". Used to sort the Form Guide leaderboard.
function formPts(form: string): number {
  return form.slice(-5).split("").reduce((n, c) => n + (c === "W" ? 3 : c === "D" ? 1 : 0), 0);
}

// getStreak — reads the form string from right (most recent) and counts how many
// consecutive results share the same outcome. Returns null if the form is empty.
function getStreak(form: string): { type: "W" | "D" | "L"; count: number } | null {
  if (!form) return null;
  const chars = form.split("").reverse();
  const type = chars[0] as "W" | "D" | "L";
  let count = 0;
  for (const c of chars) {
    if (c === type) count++;
    else break;
  }
  return count > 0 ? { type, count } : null;
}

// ─── interfaces ───────────────────────────────────────────────────────────────

interface LeagueMeta {
  id: number; name: string; country: string; flag: string; logo: string; season: number;
}

// SplitRecord — the played/won/drawn/lost/goals breakdown for one context
// (overall, home, or away). The standings API provides all three per team.
interface SplitRecord {
  played: number; win: number; draw: number; lose: number;
  goals: { for: number; against: number };
}

interface Standing {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number; goalsDiff: number; form: string; description: string | null;
  all: SplitRecord; home: SplitRecord; away: SplitRecord;
}

interface TopScorer {
  player: { id: number; name: string; photo: string; nationality: string; age: number };
  statistics: {
    team: { id: number; name: string; logo: string };
    league: { id: number; name: string };
    games: { appearences: number | null };
    goals: { total: number | null; assists: number | null };
  }[];
}

interface Fixture {
  fixture: { id: number; date: string; status: { short: string } };
  league: { round: string };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
}

interface TeamEntry {
  team: { id: number; name: string; logo: string; founded: number | null; country: string };
  venue: { name: string; city: string; capacity: number | null };
}

// ─── small components ─────────────────────────────────────────────────────────

// Skeleton — animated grey placeholder shown while data is loading
function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-bg-border ${className}`} />;
}

// EmptyState — centred message when an API returns no data
function EmptyState({ message }: { message: string }) {
  return <div className="flex items-center justify-center py-16"><p className="text-sm text-slate-500">{message}</p></div>;
}

// SectionLabel — the small ALL-CAPS divider headers inside cards (e.g. "Results", "Upcoming")
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-bg-border px-5 py-3">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{children}</p>
    </div>
  );
}

// FormPills — renders the last N results from a form string as coloured W/D/L squares.
// Green = win, grey = draw, red = loss.
function FormPills({ form, last = 5 }: { form: string; last?: number }) {
  return (
    <div className="flex gap-0.5">
      {form.slice(-last).split("").map((c, i) => (
        <span key={i} className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-extrabold ${
          c === "W" ? "bg-emerald-500/15 text-emerald-400" :
          c === "D" ? "bg-slate-600/50 text-slate-400" :
                      "bg-red-500/15 text-red-400"
        }`}>{c}</span>
      ))}
    </div>
  );
}

// StreakBadge — shows a compact "W3" / "D1" badge when a team has 2+ consecutive same results.
// Intentionally hidden for single-match streaks to reduce noise.
function StreakBadge({ form }: { form: string }) {
  const s = getStreak(form);
  if (!s || s.count < 2) return null;
  const cls = s.type === "W" ? "bg-emerald-500/10 text-emerald-400" :
              s.type === "D" ? "bg-slate-600/50 text-slate-400" : "bg-red-500/10 text-red-400";
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold ${cls}`}>
      {s.type}{s.count}
    </span>
  );
}

// ZONE_COLORS — maps keywords from the API's "description" field (e.g. "Promotion to
// Champions League") to a left-border colour on the standings table row.
const ZONE_COLORS: Record<string, string> = {
  "champions league": "border-l-[3px] border-l-blue-500",
  "europa league":    "border-l-[3px] border-l-orange-400",
  "conference":       "border-l-[3px] border-l-teal-400",
  "relegation":       "border-l-[3px] border-l-red-500",
  "promotion":        "border-l-[3px] border-l-emerald-500",
};

// zoneClass — converts a row's description string into the matching border CSS class.
// Falls back to a transparent border so the layout stays consistent for undescribed rows.
function zoneClass(d: string | null) {
  if (!d) return "border-l-[3px] border-l-transparent";
  const l = d.toLowerCase();
  for (const [k, c] of Object.entries(ZONE_COLORS)) if (l.includes(k)) return c;
  return "border-l-[3px] border-l-transparent";
}

// FixtureRow — one match row used in both the Overview and Fixtures tabs.
// showScore=true shows the final score (for finished matches);
// showScore=false shows the scheduled kickoff time (for upcoming matches).
// Live matches show a pulsing red "LIVE" badge regardless of showScore.
function FixtureRow({ f, showScore }: { f: Fixture; showScore: boolean }) {
  const date = new Date(f.fixture.date);
  // Anything that isn't a terminal or pre-match status is considered live
  const isLive = !["NS", "TBD", "FT", "AET", "PEN", "PST", "CANC", "SUSP"].includes(f.fixture.status.short);
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-bg-border transition-colors">
      <div className="w-24 shrink-0 text-xs text-slate-500">
        <p>{date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
        <p className="text-[10px]">{f.league.round}</p>
      </div>
      <Link href={`/teams/${encodeURIComponent(f.teams.home.name)}`} className="flex flex-1 items-center justify-end gap-2 group min-w-0">
        <span className={`truncate text-sm font-semibold text-right group-hover:text-accent-green ${f.teams.home.winner ? "text-white" : showScore ? "text-slate-400" : "text-slate-300"}`}>
          {f.teams.home.name}
        </span>
        {f.teams.home.logo && (
          <div className="relative h-6 w-6 shrink-0">
            <Image src={f.teams.home.logo} alt="" fill className="object-contain" sizes="24px" />
          </div>
        )}
      </Link>
      <div className="w-16 shrink-0 text-center">
        {isLive ? (
          <span className="rounded-md bg-red-500/10 px-2 py-1 text-xs font-bold text-red-400 ring-1 ring-red-500/20">LIVE</span>
        ) : showScore && f.goals.home !== null ? (
          <span className="rounded-md bg-bg-border px-2.5 py-1 text-sm font-extrabold text-white tabular-nums">
            {f.goals.home} – {f.goals.away}
          </span>
        ) : (
          <span className="text-xs font-medium text-slate-500">
            {date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
      <Link href={`/teams/${encodeURIComponent(f.teams.away.name)}`} className="flex flex-1 items-center gap-2 group min-w-0">
        {f.teams.away.logo && (
          <div className="relative h-6 w-6 shrink-0">
            <Image src={f.teams.away.logo} alt="" fill className="object-contain" sizes="24px" />
          </div>
        )}
        <span className={`truncate text-sm font-semibold group-hover:text-accent-green ${f.teams.away.winner ? "text-white" : showScore ? "text-slate-400" : "text-slate-300"}`}>
          {f.teams.away.name}
        </span>
      </Link>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function LeaguePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [league, setLeague]     = useState<LeagueMeta | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Which season the user has selected in the hero season-picker
  const [selectedSeason, setSelectedSeason] = useState(CURRENT_SEASON);

  // ── Overview tab state ──────────────────────────────────────────────────────
  const [overviewFixtures, setOverviewFixtures] = useState<Fixture[] | null>(null);
  const [overviewRound, setOverviewRound]       = useState<string | null>(null);
  const [overviewLoading, setOverviewLoading]   = useState(false);
  // Tracks which league:season combination was last loaded so switching tabs
  // doesn't re-fetch data that's already in state.
  const overviewLoadedFor = useRef<string>("");

  // ── Fixtures tab state ──────────────────────────────────────────────────────
  const [rounds, setRounds]           = useState<string[]>([]);        // all round strings for the season
  const [selectedRound, setSelectedRound] = useState<string | null>(null); // the gameweek currently shown
  const [roundsLoading, setRoundsLoading] = useState(false);
  const roundsLoadedFor = useRef<string>("");
  const [roundFixtures, setRoundFixtures] = useState<{ upcoming: Fixture[]; recent: Fixture[]; live: Fixture[]; all: Fixture[] } | null>(null);
  const [fixturesLoading, setFixturesLoading] = useState(false);

  // ── Standings state ─────────────────────────────────────────────────────────
  const [standings, setStandings]           = useState<Standing[] | null>(null);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const standingsLoadedFor = useRef<string>("");
  const [standingsView, setStandingsView]   = useState<StandingsView>("all");

  // ── Players / Teams tab state ───────────────────────────────────────────────
  const [topScorers, setTopScorers] = useState<TopScorer[] | null>(null);
  const [topAssists, setTopAssists] = useState<TopScorer[] | null>(null);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [teams, setTeams]           = useState<TeamEntry[] | null>(null);
  const [teamsLoading, setTeamsLoading] = useState(false);

  // Fetch league name, logo, and country — runs once when the page loads
  useEffect(() => {
    fetch(`/api/football/leagues?id=${params.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (!d?.league) { setNotFound(true); return; } setLeague(d.league); })
      .catch(() => setNotFound(true));
  }, [params.id]);

  // Standings are shared by the Overview and Standings tabs to avoid double-fetching.
  // The useRef "loadedFor" pattern prevents refetching when the user switches tabs.
  useEffect(() => {
    if (activeTab !== "overview" && activeTab !== "standings") return;
    const key = `${params.id}:${selectedSeason}`;
    if (standingsLoadedFor.current === key) return;
    standingsLoadedFor.current = key;
    setStandingsLoading(true);
    setStandings(null);
    fetch(`/api/football/standings?league=${params.id}&season=${selectedSeason}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setStandings(d?.standings ?? []))
      .catch(() => setStandings([]))
      .finally(() => setStandingsLoading(false));
  }, [activeTab, params.id, selectedSeason]);

  // Overview fixtures — two sequential fetches:
  // 1) get all rounds + the current round name
  // 2) get all fixtures for that specific round
  useEffect(() => {
    if (activeTab !== "overview") return;
    const key = `${params.id}:${selectedSeason}`;
    if (overviewLoadedFor.current === key) return;
    overviewLoadedFor.current = key;
    setOverviewLoading(true);
    setOverviewFixtures(null);
    (async () => {
      try {
        const rr = await fetch(`/api/football/rounds?league=${params.id}&season=${selectedSeason}`);
        const { rounds: r, current } = await rr.json();
        // Fall back to the last round if the API can't determine which is current
        const round = current ?? r[r.length - 1] ?? null;
        setOverviewRound(round);
        if (!round) { setOverviewFixtures([]); return; }
        const fr = await fetch(
          `/api/football/league-fixtures?league=${params.id}&season=${selectedSeason}&round=${encodeURIComponent(round)}`
        );
        const d = await fr.json();
        setOverviewFixtures(d.all ?? []);
      } catch {
        setOverviewFixtures([]);
      } finally {
        setOverviewLoading(false);
      }
    })();
  }, [activeTab, params.id, selectedSeason]);

  // Fixtures tab: load the complete rounds list then pre-select the current round.
  // Only fires once per league+season combination thanks to roundsLoadedFor.
  useEffect(() => {
    if (activeTab !== "fixtures") return;
    const key = `${params.id}:${selectedSeason}`;
    if (roundsLoadedFor.current === key) return;
    roundsLoadedFor.current = key;
    setRoundsLoading(true);
    setRounds([]);
    setSelectedRound(null);
    setRoundFixtures(null);
    fetch(`/api/football/rounds?league=${params.id}&season=${selectedSeason}`)
      .then((r) => r.ok ? r.json() : { rounds: [], current: null })
      .then(({ rounds: r, current }: { rounds: string[]; current: string | null }) => {
        setRounds(r);
        setSelectedRound(current ?? r[r.length - 1] ?? null);
      })
      .catch(() => {})
      .finally(() => setRoundsLoading(false));
  }, [params.id, selectedSeason, activeTab]);

  // Fixtures tab: fetch the actual fixture list whenever the selected round changes.
  // Runs every time selectedRound changes (via the Prev / Next buttons or dropdown).
  useEffect(() => {
    if (!selectedRound || activeTab !== "fixtures") return;
    setFixturesLoading(true);
    setRoundFixtures(null);
    fetch(`/api/football/league-fixtures?league=${params.id}&season=${selectedSeason}&round=${encodeURIComponent(selectedRound)}`)
      .then((r) => r.ok ? r.json() : { upcoming: [], recent: [], live: [], all: [] })
      .then((d) => setRoundFixtures({ upcoming: d.upcoming ?? [], recent: d.recent ?? [], live: d.live ?? [], all: d.all ?? [] }))
      .catch(() => {})
      .finally(() => setFixturesLoading(false));
  }, [params.id, selectedSeason, selectedRound, activeTab]);

  // Teams tab: load once, then keep in state for the session (no season dependency)
  useEffect(() => {
    if (activeTab !== "teams" || teams !== null) return;
    setTeamsLoading(true);
    fetch(`/api/football/league-teams?league=${params.id}`)
      .then((r) => r.ok ? r.json() : { teams: [] })
      .then((d) => setTeams(d.teams ?? []))
      .finally(() => setTeamsLoading(false));
  }, [activeTab, params.id, teams]);

  // Players tab: load top scorers + top assists together from one endpoint
  useEffect(() => {
    if (activeTab !== "players" || topScorers !== null) return;
    setPlayersLoading(true);
    fetch(`/api/football/topscorers?league=${params.id}&season=${selectedSeason}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setTopScorers(d?.topScorers ?? []); setTopAssists(d?.topAssists ?? []); })
      .finally(() => setPlayersLoading(false));
  }, [activeTab, params.id, selectedSeason, topScorers]);

  // handleSeasonChange — resets all per-season data and the "loadedFor" guards
  // so every useEffect knows it needs to re-fetch for the new season.
  function handleSeasonChange(s: number) {
    setSelectedSeason(s);
    overviewLoadedFor.current = "";
    standingsLoadedFor.current = "";
    roundsLoadedFor.current = "";
    setStandings(null);
    setOverviewFixtures(null);
    setOverviewRound(null);
    setRounds([]);
    setSelectedRound(null);
    setRoundFixtures(null);
  }

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview",  label: "Overview",    icon: LayoutDashboard },
    { key: "fixtures",  label: "Fixtures",    icon: Calendar        },
    { key: "standings", label: "Standings",   icon: BarChart2       },
    { key: "teams",     label: "Teams",       icon: Users           },
    { key: "players",   label: "Top Players", icon: Trophy          },
  ];

  // roundIdx — the position of the currently selected round in the full rounds array.
  // Used to enable/disable the Prev and Next navigation buttons.
  const roundIdx = rounds.indexOf(selectedRound ?? "");
  const canPrev  = roundIdx > 0;
  const canNext  = roundIdx < rounds.length - 1;

  // formLeaders — standings sorted by last-5 form points descending, used for the
  // Form Guide section on the Overview tab.
  const formLeaders = standings ? [...standings].sort((a, b) => formPts(b.form) - formPts(a.form)) : [];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          <button onClick={() => router.back()} className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-200">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          {!league && !notFound && (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-10 w-72 rounded-xl" />
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
          )}

          {notFound && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-bg-border bg-bg-card py-20 text-center shadow-sm">
              <Target className="mb-3 h-12 w-12 text-slate-700" />
              <p className="font-semibold text-slate-200">League not found</p>
              <Link href="/football" className="mt-4 text-sm font-semibold text-accent-green hover:underline">← Back to Football</Link>
            </div>
          )}

          {league && (
            <>
              {/* Hero */}
              <div className="mb-6 overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                <div className="h-1.5 w-full bg-emerald-200" />
                <div className="flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8">
                  <div className="flex items-center gap-5">
                    <div className="relative h-16 w-16 shrink-0">
                      {league.logo
                        ? <Image src={league.logo} alt={league.name} fill className="object-contain" sizes="64px" />
                        : <span className="text-4xl">{league.flag}</span>
                      }
                    </div>
                    <div>
                      <h1 className="text-2xl font-extrabold text-white sm:text-3xl">{league.name}</h1>
                      <p className="mt-1 text-sm text-slate-500">
                        {league.flag} {league.country} · {seasonLabel(selectedSeason)} Season
                      </p>
                    </div>
                  </div>
                  {/* Season selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Season</span>
                    <div className="flex overflow-hidden rounded-lg border border-bg-border bg-bg-base">
                      {SEASONS.map((s) => (
                        <button key={s} onClick={() => handleSeasonChange(s)}
                          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${selectedSeason === s ? "bg-accent-green text-white" : "text-slate-400 hover:bg-bg-border hover:text-white"}`}
                        >
                          {seasonLabel(s)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="mb-6 border-b border-bg-border">
                <div className="-mb-px flex gap-1 overflow-x-auto">
                  {TABS.map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setActiveTab(key)}
                      className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                        activeTab === key ? "border-accent-green text-accent-green" : "border-transparent text-slate-500 hover:text-slate-200"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />{label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Overview ─────────────────────────────────────────────── */}
              {activeTab === "overview" && (
                <div className="space-y-6">

                  {/* Current round fixtures */}
                  <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                    <div className="flex items-center justify-between border-b border-bg-border px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                          {overviewRound ? formatRound(overviewRound) : "Current Round"}
                        </p>
                      </div>
                      <button onClick={() => setActiveTab("fixtures")} className="text-xs font-semibold text-accent-green hover:underline">
                        All fixtures →
                      </button>
                    </div>

                    {overviewLoading ? (
                      <div className="space-y-1 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
                    ) : !overviewFixtures?.length ? (
                      <EmptyState message="No fixtures for current round" />
                    ) : (
                      <div className="divide-y divide-bg-border">
                        {overviewFixtures.map((f) => {
                          const isFinished = ["FT", "AET", "PEN"].includes(f.fixture.status.short);
                          return <FixtureRow key={f.fixture.id} f={f} showScore={isFinished} />;
                        })}
                      </div>
                    )}
                  </div>

                  {/* Live league table */}
                  <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                    <div className="flex items-center justify-between border-b border-bg-border px-5 py-3">
                      <div className="flex items-center gap-2">
                        <BarChart2 className="h-3.5 w-3.5 text-slate-500" />
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">League Table</p>
                      </div>
                      <button onClick={() => setActiveTab("standings")} className="text-xs font-semibold text-accent-green hover:underline">
                        Full table →
                      </button>
                    </div>

                    {standingsLoading ? (
                      <div className="space-y-1 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-11" />)}</div>
                    ) : !standings?.length ? (
                      <EmptyState message="Standings not available" />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-bg-border text-left text-[11px] text-slate-500">
                              <th className="w-8 px-4 py-2.5 font-medium">#</th>
                              <th className="px-4 py-2.5 font-medium">Team</th>
                              <th className="px-3 py-2.5 text-center font-medium">P</th>
                              <th className="hidden px-3 py-2.5 text-center font-medium sm:table-cell">GD</th>
                              <th className="px-3 py-2.5 text-center font-bold">Pts</th>
                              <th className="px-4 py-2.5 font-medium">Form</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-bg-border">
                            {standings.map((row) => (
                              <tr key={row.team.id} className={`transition-colors hover:bg-bg-border ${zoneClass(row.description)}`}>
                                <td className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500">{row.rank}</td>
                                <td className="px-4 py-2.5">
                                  <Link href={`/teams/${encodeURIComponent(row.team.name)}`} className="group flex items-center gap-2">
                                    {row.team.logo && (
                                      <div className="relative h-5 w-5 shrink-0">
                                        <Image src={row.team.logo} alt="" fill className="object-contain" sizes="20px" />
                                      </div>
                                    )}
                                    <span className="truncate font-semibold text-white group-hover:text-accent-green">{row.team.name}</span>
                                  </Link>
                                </td>
                                <td className="px-3 py-2.5 text-center text-slate-400">{row.all.played}</td>
                                <td className={`hidden px-3 py-2.5 text-center font-medium sm:table-cell ${row.goalsDiff > 0 ? "text-emerald-500" : row.goalsDiff < 0 ? "text-red-400" : "text-slate-500"}`}>
                                  {row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff}
                                </td>
                                <td className="px-3 py-2.5 text-center font-extrabold text-white">{row.points}</td>
                                <td className="px-4 py-2.5"><FormPills form={row.form} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Zone legend */}
                    {standings && standings.length > 0 && (
                      <div className="flex flex-wrap gap-4 border-t border-bg-border px-5 py-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5"><span className="h-3 w-0.5 rounded-full bg-blue-500" />Champions League</span>
                        <span className="flex items-center gap-1.5"><span className="h-3 w-0.5 rounded-full bg-orange-400" />Europa League</span>
                        <span className="flex items-center gap-1.5"><span className="h-3 w-0.5 rounded-full bg-red-500" />Relegation</span>
                      </div>
                    )}
                  </div>

                  {/* Form guide */}
                  {formLeaders.length > 0 && (
                    <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                      <div className="flex items-center gap-2 border-b border-bg-border px-5 py-3">
                        <TrendingUp className="h-3.5 w-3.5 text-slate-500" />
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Form Guide — Last 5</p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-bg-border text-left text-[11px] text-slate-500">
                              <th className="w-8 px-4 py-2.5 font-medium">#</th>
                              <th className="px-4 py-2.5 font-medium">Team</th>
                              <th className="px-4 py-2.5 font-medium">Last 5</th>
                              <th className="px-3 py-2.5 text-center font-medium">Pts</th>
                              <th className="px-4 py-2.5 font-medium">Streak</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-bg-border">
                            {formLeaders.map((row, i) => {
                              const pts = formPts(row.form);
                              const ptsColor = pts >= 13 ? "text-emerald-400" : pts >= 9 ? "text-amber-400" : pts <= 3 ? "text-red-400" : "text-slate-400";
                              return (
                                <tr key={row.team.id} className="transition-colors hover:bg-bg-border">
                                  <td className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500">{i + 1}</td>
                                  <td className="px-4 py-2.5">
                                    <Link href={`/teams/${encodeURIComponent(row.team.name)}`} className="group flex items-center gap-2">
                                      {row.team.logo && (
                                        <div className="relative h-5 w-5 shrink-0">
                                          <Image src={row.team.logo} alt="" fill className="object-contain" sizes="20px" />
                                        </div>
                                      )}
                                      <span className="truncate font-semibold text-white group-hover:text-accent-green">{row.team.name}</span>
                                    </Link>
                                  </td>
                                  <td className="px-4 py-2.5"><FormPills form={row.form} /></td>
                                  <td className={`px-3 py-2.5 text-center text-sm font-extrabold tabular-nums ${ptsColor}`}>{pts}/15</td>
                                  <td className="px-4 py-2.5"><StreakBadge form={row.form} /></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Fixtures ─────────────────────────────────────────────── */}
              {activeTab === "fixtures" && (
                <div className="space-y-4">
                  {/* Round navigation */}
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedRound(rounds[roundIdx - 1])} disabled={!canPrev || roundsLoading}
                      className="flex items-center gap-1 rounded-lg border border-bg-border bg-bg-card px-3 py-2 text-sm font-semibold text-slate-400 transition-colors hover:border-slate-500 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" /> Prev
                    </button>
                    <div className="flex-1">
                      {rounds.length > 0 ? (
                        <select value={selectedRound ?? ""} onChange={(e) => setSelectedRound(e.target.value)}
                          className="w-full rounded-lg border border-bg-border bg-bg-card px-3 py-2 text-center text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-accent-green"
                        >
                          {rounds.map((r) => <option key={r} value={r}>{formatRound(r)}</option>)}
                        </select>
                      ) : (
                        <div className="flex h-9 items-center justify-center rounded-lg border border-bg-border bg-bg-card">
                          <span className="text-sm text-slate-500">{roundsLoading ? "Loading rounds…" : "No rounds available"}</span>
                        </div>
                      )}
                    </div>
                    <button onClick={() => setSelectedRound(rounds[roundIdx + 1])} disabled={!canNext || roundsLoading}
                      className="flex items-center gap-1 rounded-lg border border-bg-border bg-bg-card px-3 py-2 text-sm font-semibold text-slate-400 transition-colors hover:border-slate-500 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                    {fixturesLoading || roundsLoading ? (
                      <div className="space-y-1 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
                    ) : !roundFixtures || roundFixtures.all.length === 0 ? (
                      <EmptyState message={selectedRound ? `No fixtures for ${formatRound(selectedRound)}` : "Select a round"} />
                    ) : (
                      <>
                        {roundFixtures.live.length > 0 && (
                          <>
                            <div className="flex items-center gap-2 border-b border-bg-border px-5 py-3">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                              <p className="text-xs font-bold uppercase tracking-widest text-red-400">Live</p>
                            </div>
                            <div className="divide-y divide-bg-border">
                              {roundFixtures.live.map((f) => <FixtureRow key={f.fixture.id} f={f} showScore={true} />)}
                            </div>
                          </>
                        )}
                        {roundFixtures.recent.length > 0 && (
                          <>
                            <SectionLabel>Results</SectionLabel>
                            <div className="divide-y divide-bg-border">
                              {[...roundFixtures.recent].reverse().map((f) => <FixtureRow key={f.fixture.id} f={f} showScore={true} />)}
                            </div>
                          </>
                        )}
                        {roundFixtures.upcoming.length > 0 && (
                          <>
                            <SectionLabel>Upcoming</SectionLabel>
                            <div className="divide-y divide-bg-border">
                              {roundFixtures.upcoming.map((f) => <FixtureRow key={f.fixture.id} f={f} showScore={false} />)}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── Standings ────────────────────────────────────────────── */}
              {activeTab === "standings" && (
                <div className="space-y-6">
                  <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                    {/* All / Home / Away toggle */}
                    <div className="flex items-center justify-between border-b border-bg-border px-5 py-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">League Table</p>
                      <div className="flex overflow-hidden rounded-lg border border-bg-border bg-bg-base">
                        {(["all", "home", "away"] as StandingsView[]).map((v) => (
                          <button key={v} onClick={() => setStandingsView(v)}
                            className={`px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${standingsView === v ? "bg-accent-green text-white" : "text-slate-400 hover:bg-bg-border hover:text-white"}`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    {standingsLoading ? (
                      <div className="space-y-1 p-4">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                    ) : !standings?.length ? (
                      <EmptyState message="Standings not available" />
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-bg-border text-left text-xs text-slate-500">
                                <th className="w-8 px-4 py-3 font-medium">#</th>
                                <th className="px-4 py-3 font-medium">Team</th>
                                <th className="px-3 py-3 text-center font-medium">P</th>
                                <th className="px-3 py-3 text-center font-medium">W</th>
                                <th className="px-3 py-3 text-center font-medium">D</th>
                                <th className="px-3 py-3 text-center font-medium">L</th>
                                <th className="px-3 py-3 text-center font-medium">GF</th>
                                <th className="px-3 py-3 text-center font-medium">GA</th>
                                <th className="px-3 py-3 text-center font-medium">GD</th>
                                <th className="px-3 py-3 text-center font-bold">Pts</th>
                                <th className="px-4 py-3 font-medium">Form</th>
                                <th className="px-3 py-3 font-medium">Streak</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-bg-border">
                              {standings.map((row) => {
                                const rec = standingsView === "home" ? row.home : standingsView === "away" ? row.away : row.all;
                                const pts = standingsView === "all" ? row.points : rec.win * 3 + rec.draw;
                                const gd  = rec.goals.for - rec.goals.against;
                                return (
                                  <tr key={row.team.id} className={`transition-colors hover:bg-bg-border ${standingsView === "all" ? zoneClass(row.description) : "border-l-[3px] border-l-transparent"}`}>
                                    <td className="px-4 py-3 text-center text-xs font-semibold text-slate-500">{row.rank}</td>
                                    <td className="px-4 py-3">
                                      <Link href={`/teams/${encodeURIComponent(row.team.name)}`} className="group flex items-center gap-2.5">
                                        {row.team.logo && (
                                          <div className="relative h-6 w-6 shrink-0">
                                            <Image src={row.team.logo} alt="" fill className="object-contain" sizes="24px" />
                                          </div>
                                        )}
                                        <span className="font-semibold text-white group-hover:text-accent-green">{row.team.name}</span>
                                      </Link>
                                    </td>
                                    <td className="px-3 py-3 text-center text-slate-400">{rec.played}</td>
                                    <td className="px-3 py-3 text-center text-slate-400">{rec.win}</td>
                                    <td className="px-3 py-3 text-center text-slate-400">{rec.draw}</td>
                                    <td className="px-3 py-3 text-center text-slate-400">{rec.lose}</td>
                                    <td className="px-3 py-3 text-center text-slate-400">{rec.goals.for}</td>
                                    <td className="px-3 py-3 text-center text-slate-400">{rec.goals.against}</td>
                                    <td className={`px-3 py-3 text-center font-medium ${gd > 0 ? "text-emerald-500" : gd < 0 ? "text-red-400" : "text-slate-500"}`}>
                                      {gd > 0 ? `+${gd}` : gd}
                                    </td>
                                    <td className="px-3 py-3 text-center font-extrabold text-white">{pts}</td>
                                    <td className="px-4 py-3"><FormPills form={row.form} /></td>
                                    <td className="px-3 py-3"><StreakBadge form={row.form} /></td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex flex-wrap gap-4 border-t border-bg-border px-4 py-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5"><span className="h-3 w-0.5 rounded-full bg-blue-500" />Champions League</span>
                          <span className="flex items-center gap-1.5"><span className="h-3 w-0.5 rounded-full bg-orange-400" />Europa League</span>
                          <span className="flex items-center gap-1.5"><span className="h-3 w-0.5 rounded-full bg-red-500" />Relegation</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── Teams ────────────────────────────────────────────────── */}
              {activeTab === "teams" && (
                <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                  {teamsLoading ? (
                    <div className="space-y-1 p-4">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
                  ) : !teams?.length ? (
                    <EmptyState message="No teams available" />
                  ) : (
                    <div className="divide-y divide-bg-border">
                      {teams.map((t) => (
                        <Link key={t.team.id} href={`/teams/${encodeURIComponent(t.team.name)}`}
                          className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-bg-border"
                        >
                          {t.team.logo && (
                            <div className="relative h-10 w-10 shrink-0">
                              <Image src={t.team.logo} alt={t.team.name} fill className="object-contain" sizes="40px" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-white group-hover:text-accent-green">{t.team.name}</p>
                            <p className="text-xs text-slate-500">
                              {t.venue.city && `${t.venue.city} · `}{t.venue.name}
                              {t.team.founded && ` · Est. ${t.team.founded}`}
                            </p>
                          </div>
                          {t.venue.capacity && (
                            <p className="shrink-0 text-xs text-slate-500">{t.venue.capacity.toLocaleString()} cap.</p>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Top Players ──────────────────────────────────────────── */}
              {activeTab === "players" && (
                <div className="space-y-6">
                  {[
                    { label: "Top Scorers", list: topScorers, key: "total" as const,   unit: "goals"   },
                    { label: "Top Assists", list: topAssists, key: "assists" as const, unit: "assists" },
                  ].map(({ label, list, key, unit }) => (
                    <div key={label} className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                      <SectionLabel>{label}</SectionLabel>
                      {playersLoading ? (
                        <div className="space-y-1 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
                      ) : !list?.length ? (
                        <EmptyState message="No data available" />
                      ) : (
                        <div className="divide-y divide-bg-border">
                          {list.map((item, i) => {
                            const stat  = item.statistics[0];
                            const value = key === "total" ? stat?.goals.total : stat?.goals.assists;
                            return (
                              <div key={item.player.id} className="flex items-center gap-4 px-5 py-3.5">
                                <span className="w-6 shrink-0 text-center text-sm font-bold text-slate-600">{i + 1}</span>
                                <Link href={`/athletes/${item.player.id}`} className="group flex flex-1 items-center gap-3">
                                  {item.player.photo ? (
                                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-bg-border">
                                      <Image src={item.player.photo} alt={item.player.name} fill className="object-cover" sizes="40px" />
                                    </div>
                                  ) : (
                                    <div className="h-10 w-10 shrink-0 rounded-full bg-bg-border" />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold text-white group-hover:text-accent-green">{item.player.name}</p>
                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                      {stat?.team?.logo && (
                                        <div className="relative h-3.5 w-3.5">
                                          <Image src={stat.team.logo} alt="" fill className="object-contain" sizes="14px" />
                                        </div>
                                      )}
                                      {stat?.team && <span>{stat.team.name}</span>}
                                      {stat?.games.appearences != null && <><span>·</span><span>{stat.games.appearences} apps</span></>}
                                    </div>
                                  </div>
                                </Link>
                                <div className="shrink-0 text-right">
                                  <span className="text-xl font-extrabold text-white">{value ?? "—"}</span>
                                  <p className="text-[10px] text-slate-500">{unit}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
