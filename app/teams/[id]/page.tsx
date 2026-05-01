"use client";

// Team profile page — /teams/[id]
// Accepts either a numeric team ID (/teams/33) or a URL-encoded team name
// (/teams/Manchester%20United). Displays four tabs:
//   Overview  — next match, form strip, last starting 11, league table, top performers
//   Fixtures  — past results + upcoming with season selector
//   Squad     — full squad grouped by position
//   Stats     — comprehensive season statistics

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, MapPin, Calendar, Users, BarChart3, List, Shield,
  Target, Activity, Zap, TrendingUp, ArrowUpDown,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PredictionCard from "@/components/PredictionCard";
import PlayerPhoto from "@/components/PlayerPhoto";
import type { OddsEvent } from "@/data/sampleOdds";

// ── season constants ───────────────────────────────────────────────────────────

const CURRENT_SEASON = (() => {
  const now = new Date();
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
})();
const SEASONS = [CURRENT_SEASON, CURRENT_SEASON - 1, CURRENT_SEASON - 2];
function seasonLabel(s: number) { return `${s}/${String(s + 1).slice(2)}`; }

type Tab = "overview" | "fixtures" | "squad" | "stats";

const RESULT_STYLES = {
  W: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  D: "bg-bg-border text-slate-400 border-bg-border",
  L: "bg-red-500/10 text-red-400 border-red-500/20",
};

// ── interfaces ─────────────────────────────────────────────────────────────────

interface SquadPlayer {
  id: number; name: string; age: number; number: number | null; position: string; photo: string;
}
interface TeamData {
  team:  { id: number; name: string; country: string; founded: number; logo: string };
  venue: { name: string; city: string; capacity: number };
  stats: {
    form: string;
    league: { id: number; name: string; logo: string };
    fixtures: { played: { total: number }; wins: { total: number }; draws: { total: number }; loses: { total: number } };
    goals: {
      for:     { average: { total: string }; total: { total: number } };
      against: { average: { total: string }; total: { total: number } };
    };
    clean_sheet: { total: number };
  } | null;
  squad: Record<string, SquadPlayer[]>;
}
interface Fixture {
  fixture: { id: number; date: string; status: { short: string } };
  league: { id: number; name: string; logo: string; round: string };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
}
interface Standing {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number; goalsDiff: number; form: string; description: string | null;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
}
interface TopScorer {
  player: { id: number; name: string; photo: string };
  statistics: {
    team: { id: number; name: string; logo: string };
    games: { appearences: number | null };
    goals: { total: number | null; assists: number | null };
  }[];
}

// ── lineup types ───────────────────────────────────────────────────────────────

interface LineupPlayer {
  id: number; name: string; number: number; pos: string;
  grid: string | null; // "row:col" from API, null for subs
}
interface MatchLineup {
  team: { id: number; name: string; logo: string };
  coach: { id: number; name: string; photo: string };
  formation: string;
  startXI: { player: LineupPlayer }[];
  substitutes: { player: LineupPlayer }[];
}
interface MatchEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string };
  player: { id: number | null; name: string };
  assist: { id: number | null; name: string | null };
  type: string;   // "Goal" | "Card" | "subst" | "Var"
  detail: string; // "Normal Goal" | "Yellow Card" | "Red Card" | "Own Goal" etc.
}
interface LastLineupData {
  fixture: {
    id: number; date: string; round: string; venue: string | null;
    league: { id: number; name: string; logo: string };
    teams: {
      home: { id: number; name: string; logo: string; winner: boolean | null };
      away: { id: number; name: string; logo: string; winner: boolean | null };
    };
    goals: { home: number | null; away: number | null };
    score: { halftime: { home: number | null; away: number | null } };
  } | null;
  lineups: MatchLineup[];
  events: MatchEvent[];
}

// Raw stats from /teams/statistics — use `any` fields since the API returns
// more data than our TypeScript types capture
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawStats = Record<string, any>;

// ── helpers ────────────────────────────────────────────────────────────────────

// getSurname — extracts the last name from a full player name for display on the pitch
function getSurname(fullName: string): string {
  const parts = fullName.trim().split(" ");
  return parts[parts.length - 1];
}

// formatRound — converts "Regular Season - 21" → "GW 21"
function formatRound(round: string): string {
  const m = round.match(/Regular Season - (\d+)/);
  return m ? `GW ${m[1]}` : round;
}

// sumCardBuckets — sums yellow/red card counts across all minute-bucket entries
// The API returns cards as { "0-15": { total: 2 }, "16-30": { total: 1 }, ... }
function sumCardBuckets(buckets: Record<string, { total: number | null }> | null | undefined): number {
  if (!buckets) return 0;
  return Object.values(buckets).reduce((sum, b) => sum + (b.total ?? 0), 0);
}

// fmtNum — formats a large number with locale commas (e.g. 12345 → "12,345")
function fmtNum(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString();
}

// ── small shared components ────────────────────────────────────────────────────

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-bg-border ${className}`} />;
}
function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">{children}</h2>;
}
function EmptyCard({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-bg-border bg-bg-card py-12 shadow-sm">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
function FormBadge({ result }: { result: "W" | "D" | "L" }) {
  return (
    <span className={`flex h-7 w-7 items-center justify-center rounded-md border text-xs font-bold ${RESULT_STYLES[result]}`}>
      {result}
    </span>
  );
}
function PlayerCard({ player }: { player: SquadPlayer }) {
  return (
    <Link href={`/athletes/${player.id}`}
      className="group flex items-center gap-3 rounded-xl border border-bg-border bg-bg-card p-3 shadow-sm transition-colors hover:border-slate-600"
    >
      <PlayerPhoto photo={player.photo} name={player.name} size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white group-hover:text-accent-green">{player.name}</p>
        <p className="text-[11px] text-slate-500">
          {player.position}{player.number != null && <span className="ml-1.5 text-slate-600">#{player.number}</span>}
          {" · "}Age {player.age}
        </p>
      </div>
    </Link>
  );
}

// ── fixture row (Fixtures tab) ────────────────────────────────────────────────

function FixtureRow({ f, teamId }: { f: Fixture; teamId: number }) {
  const date     = new Date(f.fixture.date);
  const isHome   = f.teams.home.id === teamId;
  const isFin    = ["FT", "AET", "PEN"].includes(f.fixture.status.short);
  const isLive   = !["NS", "TBD", "FT", "AET", "PEN", "PST", "CANC", "SUSP"].includes(f.fixture.status.short);

  let result: "W" | "D" | "L" | null = null;
  if (isFin && f.goals.home != null && f.goals.away != null) {
    const scored = isHome ? f.goals.home : f.goals.away;
    const conc   = isHome ? f.goals.away : f.goals.home;
    result = scored > conc ? "W" : scored === conc ? "D" : "L";
  }
  const borderCls = result === "W" ? "border-l-emerald-500/50" : result === "L" ? "border-l-red-500/40" : result === "D" ? "border-l-slate-600" : "";

  return (
    <div className={`flex items-center gap-3 border-l-4 px-5 py-3.5 hover:bg-bg-border transition-colors ${borderCls || "border-l-transparent"}`}>
      <div className="w-7 shrink-0 text-center">
        {result && (
          <span className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-extrabold ${RESULT_STYLES[result]}`}>{result}</span>
        )}
      </div>
      <div className="w-24 shrink-0 text-xs text-slate-500">
        <p>{date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
        <p className="truncate text-[10px]">{f.league.round}</p>
      </div>
      <Link href={`/teams/${encodeURIComponent(f.teams.home.name)}`} className="flex flex-1 items-center justify-end gap-2 group min-w-0">
        <span className={`truncate text-sm font-semibold text-right group-hover:text-accent-green ${f.teams.home.id === teamId ? "text-white" : isFin ? (f.teams.home.winner ? "text-slate-300" : "text-slate-500") : "text-slate-300"}`}>{f.teams.home.name}</span>
        <div className="relative h-6 w-6 shrink-0"><Image src={f.teams.home.logo} alt="" fill className="object-contain" sizes="24px" /></div>
      </Link>
      <div className="w-16 shrink-0 text-center">
        {isLive ? (
          <span className="rounded-md bg-red-500/10 px-2 py-1 text-xs font-bold text-red-400 ring-1 ring-red-500/20">LIVE</span>
        ) : isFin && f.goals.home != null ? (
          <span className={`rounded-md px-2.5 py-1 text-sm font-extrabold tabular-nums ${result === "W" ? "bg-emerald-500/10 text-emerald-300" : result === "L" ? "bg-red-500/10 text-red-300" : "bg-bg-border text-white"}`}>
            {f.goals.home} – {f.goals.away}
          </span>
        ) : (
          <span className="text-xs font-medium text-slate-500">{date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
        )}
      </div>
      <Link href={`/teams/${encodeURIComponent(f.teams.away.name)}`} className="flex flex-1 items-center gap-2 group min-w-0">
        <div className="relative h-6 w-6 shrink-0"><Image src={f.teams.away.logo} alt="" fill className="object-contain" sizes="24px" /></div>
        <span className={`truncate text-sm font-semibold group-hover:text-accent-green ${f.teams.away.id === teamId ? "text-white" : isFin ? (f.teams.away.winner ? "text-slate-300" : "text-slate-500") : "text-slate-300"}`}>{f.teams.away.name}</span>
      </Link>
      {f.league.logo && (
        <div className="relative h-4 w-4 shrink-0"><Image src={f.league.logo} alt={f.league.name} fill className="object-contain" sizes="16px" title={f.league.name} /></div>
      )}
    </div>
  );
}

// ── formation pitch ────────────────────────────────────────────────────────────

// FormationPitch — renders a birds-eye view of the starting XI on a pitch.
// Players are grouped by grid row (1 = GK at bottom, higher = attackers at top).
// The grid field format is "row:col" (e.g. "2:3" = row 2, column 3).
function FormationPitch({ startXI, formation }: {
  startXI: { player: LineupPlayer }[];
  formation: string;
}) {
  // Group players by their row number, then sort each row left-to-right by column.
  const rowMap: Record<number, LineupPlayer[]> = {};
  for (const { player } of startXI) {
    if (!player.grid) continue;
    const [r, c] = player.grid.split(":").map(Number);
    if (!rowMap[r]) rowMap[r] = [];
    rowMap[r].push(player);
  }
  // Sort each row's players by column (left to right on pitch)
  for (const row of Object.values(rowMap)) {
    row.sort((a, b) => {
      const ca = Number(a.grid!.split(":")[1]);
      const cb = Number(b.grid!.split(":")[1]);
      return ca - cb;
    });
  }
  // Sort row numbers descending so attackers (high row number) appear at top
  const sortedRows = Object.entries(rowMap)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([, players]) => players);

  // If no grid data (some old fixtures lack it), fall back to a flat list
  if (sortedRows.length === 0) {
    return (
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 p-4">
        {startXI.map(({ player }) => (
          <div key={player.id} className="flex flex-col items-center gap-1">
            <div className="h-8 w-8 rounded-full bg-accent-green/20 border border-accent-green/40 flex items-center justify-center text-xs font-bold text-accent-green">{player.number}</div>
            <span className="text-[9px] text-white/70 text-center truncate w-full">{getSurname(player.name)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#1a3a24] border border-emerald-900/50">
      {/* ── Pitch markings ─────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0">
        {/* Halfway line */}
        <div className="absolute left-0 right-0 top-1/2 border-t border-white/10" />
        {/* Center circle */}
        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
        {/* Center dot */}
        <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20" />
        {/* Top penalty box (opponent end) */}
        <div className="absolute left-1/4 right-1/4 top-0 h-[14%] rounded-b-md border-b border-x border-white/10" />
        {/* Bottom penalty box (our end / GK end) */}
        <div className="absolute left-1/4 right-1/4 bottom-0 h-[14%] rounded-t-md border-t border-x border-white/10" />
      </div>

      {/* ── Player rows ────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col gap-4 px-3 py-5">
        {sortedRows.map((rowPlayers, rowIdx) => (
          <div key={rowIdx} className="flex justify-around">
            {rowPlayers.map((player) => (
              <div key={player.id} className="flex flex-col items-center gap-0.5 w-10 sm:w-12">
                <div className="h-8 w-8 rounded-full bg-accent-green flex items-center justify-center text-[11px] font-extrabold text-black shadow-md">
                  {player.number}
                </div>
                <span className="text-[9px] font-medium text-white/80 text-center leading-tight max-w-full truncate">
                  {getSurname(player.name)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── match events timeline ──────────────────────────────────────────────────────

// EventTimeline — compact list of goals, cards, and substitutions for a match.
// Filtered to a specific team so only that team's events are shown.
function EventTimeline({ events, teamId, label }: { events: MatchEvent[]; teamId: number; label: string }) {
  const relevant = events.filter(
    (e) => e.team.id === teamId && ["Goal", "Card", "subst"].includes(e.type)
  );
  if (!relevant.length) return null;

  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <div className="space-y-1.5">
        {relevant.map((e, i) => {
          const isGoal  = e.type === "Goal";
          const isYel   = e.type === "Card" && e.detail === "Yellow Card";
          const isRed   = e.type === "Card" && (e.detail === "Red Card" || e.detail === "Red Card (2nd Yellow)");
          const isSub   = e.type === "subst";
          const isOG    = e.detail === "Own Goal";
          const isPen   = e.detail === "Penalty";

          return (
            <div key={i} className="flex items-start gap-2 text-xs">
              {/* Time */}
              <span className="w-8 shrink-0 font-bold tabular-nums text-slate-500">
                {e.time.elapsed}{e.time.extra ? `+${e.time.extra}` : ""}&apos;
              </span>
              {/* Icon */}
              <span className="mt-0.5 shrink-0">
                {isGoal && !isOG && <span title="Goal" className="text-white">⚽</span>}
                {isGoal && isOG  && <span title="Own Goal" className="text-red-400">⚽</span>}
                {isYel  && <span className="inline-block h-3 w-2.5 rounded-sm bg-yellow-400" />}
                {isRed  && <span className="inline-block h-3 w-2.5 rounded-sm bg-red-500" />}
                {isSub  && <ArrowUpDown className="h-3 w-3 text-slate-400" />}
              </span>
              {/* Description */}
              <span className="text-slate-300 leading-snug">
                {isGoal && (
                  <>
                    <span className="font-semibold">{getSurname(e.player.name)}</span>
                    {isPen  && <span className="text-slate-500"> (pen)</span>}
                    {isOG   && <span className="text-red-400"> (OG)</span>}
                    {e.assist.name && !isOG && (
                      <span className="text-slate-500"> · {getSurname(e.assist.name)}</span>
                    )}
                  </>
                )}
                {(isYel || isRed) && (
                  <span className="font-semibold">{getSurname(e.player.name)}</span>
                )}
                {isSub && (
                  <>
                    <span className="text-emerald-400 font-semibold">↑ {getSurname(e.player.name)}</span>
                    {e.assist.name && (
                      <span className="text-slate-500"> ↓ {getSurname(e.assist.name)}</span>
                    )}
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── top performer card ─────────────────────────────────────────────────────────

function TopPerformerCard({ title, player, statValue, unit }: {
  title: string;
  player: TopScorer | null;
  statValue: number | null;
  unit: string;
}) {
  if (!player) {
    return (
      <div className="rounded-xl border border-bg-border bg-bg-card p-4 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">{title}</p>
        <p className="text-sm text-slate-600">No data</p>
      </div>
    );
  }
  const stat = player.statistics[0];
  return (
    <Link href={`/athletes/${player.player.id}`}
      className="group block rounded-xl border border-bg-border bg-bg-card p-4 shadow-sm transition-colors hover:border-slate-600"
    >
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">{title}</p>
      <div className="flex items-center gap-3">
        {player.player.photo ? (
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-bg-border">
            <Image src={player.player.photo} alt={player.player.name} fill className="object-cover" sizes="40px" />
          </div>
        ) : (
          <div className="h-10 w-10 shrink-0 rounded-full bg-bg-border" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white group-hover:text-accent-green">{player.player.name}</p>
          {stat?.games.appearences != null && (
            <p className="text-[11px] text-slate-500">{stat.games.appearences} apps</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xl font-extrabold text-white">{statValue ?? "—"}</p>
          <p className="text-[10px] text-slate-500">{unit}</p>
        </div>
      </div>
    </Link>
  );
}

// ── stats tab components ───────────────────────────────────────────────────────

// StatLine — one row in a stats category: label | bar | value
// `value` null means the stat isn't available from the API.
// `max` is used to scale the filled portion of the bar.
function StatLine({ label, value, max, unit = "" }: {
  label: string;
  value: number | string | null;
  max?: number;
  unit?: string;
}) {
  const isNA = value === null || value === undefined;
  const numVal = typeof value === "string"
    ? parseFloat(value.replace("%", ""))
    : (value as number | null);

  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <span className="w-52 shrink-0 text-sm text-slate-400">{label}</span>
      <div className="flex-1">
        {!isNA && max != null && numVal != null ? (
          <div className="h-1.5 overflow-hidden rounded-full bg-bg-border">
            <div
              className="h-full rounded-full bg-accent-green/70 transition-all"
              style={{ width: `${Math.min(100, (numVal / max) * 100)}%` }}
            />
          </div>
        ) : (
          <div className="h-1.5 rounded-full bg-bg-border/30" />
        )}
      </div>
      <span className={`w-20 shrink-0 text-right text-sm font-bold tabular-nums ${isNA ? "text-slate-700" : "text-white"}`}>
        {isNA ? "—" : `${typeof value === "number" ? fmtNum(value) : value}${unit}`}
      </span>
    </div>
  );
}

// StatsSection — a labelled card containing a group of StatLine rows
function StatsSection({ label, icon: Icon, items }: {
  label: string;
  icon: React.ElementType;
  items: { label: string; value: number | string | null; max?: number; unit?: string }[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-bg-border px-5 py-3">
        <Icon className="h-3.5 w-3.5 text-slate-500" />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p>
      </div>
      <div className="divide-y divide-bg-border">
        {items.map((item) => <StatLine key={item.label} {...item} />)}
      </div>
    </div>
  );
}

// ── main page ──────────────────────────────────────────────────────────────────

export default function TeamPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  // ── core data ────────────────────────────────────────────────────────────────
  const [data,        setData]        = useState<TeamData | null>(null);
  const [nextFixture, setNextFixture] = useState<OddsEvent | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [notFound,    setNotFound]    = useState(false);
  const [activeTab,   setActiveTab]   = useState<Tab>("overview");

  // ── fixtures tab ─────────────────────────────────────────────────────────────
  const [selectedSeason,     setSelectedSeason]     = useState(CURRENT_SEASON);
  const [teamFixtures,       setTeamFixtures]        = useState<{ upcoming: Fixture[]; recent: Fixture[] } | null>(null);
  const [fixturesLoading,    setFixturesLoading]     = useState(false);
  const [fixturesLoadedFor,  setFixturesLoadedFor]   = useState<string>("");

  // ── overview: standings ──────────────────────────────────────────────────────
  const [standings,       setStandings]      = useState<Standing[] | null>(null);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const standingsLoadedFor = useRef<string>("");

  // ── overview: last starting 11 ───────────────────────────────────────────────
  const [lineupData,    setLineupData]    = useState<LastLineupData | null>(null);
  const [lineupLoading, setLineupLoading] = useState(false);
  const lineupLoadedFor = useRef<string>("");

  // ── overview: top performers ─────────────────────────────────────────────────
  const [topScorers,       setTopScorers]       = useState<TopScorer[] | null>(null);
  const [topAssists,       setTopAssists]        = useState<TopScorer[] | null>(null);
  const [performersLoading, setPerformersLoading] = useState(false);
  const performersLoadedFor = useRef<string>("");

  // ── stats tab ────────────────────────────────────────────────────────────────
  const [teamStats,          setTeamStats]          = useState<RawStats | null>(null);
  const [statsLoading,       setStatsLoading]       = useState(false);
  const [statsSelectedSeason, setStatsSelectedSeason] = useState(CURRENT_SEASON);
  const statsLoadedFor = useRef<string>("");

  const teamName = decodeURIComponent(params.id);

  // ── initial load: team profile + next fixture prediction card ─────────────────
  useEffect(() => {
    const isNumeric = /^\d+$/.test(params.id);
    const query = isNumeric ? `id=${params.id}` : `name=${encodeURIComponent(teamName)}`;

    Promise.all([
      fetch(`/api/football/team?${query}`).then((r) => r.ok ? r.json() : null),
      fetch("/api/events?sport=football").then((r) => r.ok ? r.json() : { events: [] }),
    ])
      .then(([td, eventsData]) => {
        if (!td || td.error) { setNotFound(true); return; }
        setData(td);
        // Fuzzy-match team name against upcoming betting events for the PredictionCard
        const name = td.team.name;
        const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
        const nn = norm(name);
        const match = (eventsData.events as OddsEvent[]).find((e) => {
          const hn = norm(e.homeTeam), an = norm(e.awayTeam);
          return hn === nn || an === nn || hn.includes(nn) || nn.includes(hn) || an.includes(nn) || nn.includes(an);
        });
        setNextFixture(match ?? null);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id, teamName]);

  // ── overview tab: load standings, lineup, top performers in parallel ──────────
  useEffect(() => {
    if (activeTab !== "overview" || !data?.team?.id) return;
    const teamId   = data.team.id;
    const leagueId = data.stats?.league?.id;

    // Standings — only load once per league (they don't change per team)
    if (leagueId && standingsLoadedFor.current !== String(leagueId)) {
      standingsLoadedFor.current = String(leagueId);
      setStandingsLoading(true);
      fetch(`/api/football/standings?league=${leagueId}&season=${CURRENT_SEASON}`)
        .then((r) => r.ok ? r.json() : null)
        .then((d) => setStandings(d?.standings ?? []))
        .catch(() => setStandings([]))
        .finally(() => setStandingsLoading(false));
    }

    // Lineup — load once per team (last completed fixture doesn't change frequently)
    if (lineupLoadedFor.current !== String(teamId)) {
      lineupLoadedFor.current = String(teamId);
      setLineupLoading(true);
      fetch(`/api/football/fixture-lineup?team=${teamId}`)
        .then((r) => r.ok ? r.json() : { fixture: null, lineups: [], events: [] })
        .then((d) => setLineupData(d))
        .catch(() => setLineupData({ fixture: null, lineups: [], events: [] }))
        .finally(() => setLineupLoading(false));
    }

    // Top performers — load once per league
    if (leagueId && performersLoadedFor.current !== String(leagueId)) {
      performersLoadedFor.current = String(leagueId);
      setPerformersLoading(true);
      fetch(`/api/football/topscorers?league=${leagueId}&season=${CURRENT_SEASON}`)
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { setTopScorers(d?.topScorers ?? []); setTopAssists(d?.topAssists ?? []); })
        .catch(() => {})
        .finally(() => setPerformersLoading(false));
    }
  }, [activeTab, data]);

  // ── fixtures tab: load by season, memoized to avoid redundant fetches ─────────
  useEffect(() => {
    if (activeTab !== "fixtures" || !data?.team?.id) return;
    const key = `${data.team.id}:${selectedSeason}`;
    if (fixturesLoadedFor === key) return;
    setFixturesLoadedFor(key);
    setFixturesLoading(true);
    setTeamFixtures(null);
    fetch(`/api/football/team-fixtures?team=${data.team.id}&season=${selectedSeason}`)
      .then((r) => r.ok ? r.json() : { upcoming: [], recent: [] })
      .then((d) => setTeamFixtures({ upcoming: d.upcoming ?? [], recent: d.recent ?? [] }))
      .catch(() => setTeamFixtures({ upcoming: [], recent: [] }))
      .finally(() => setFixturesLoading(false));
  }, [activeTab, data?.team?.id, selectedSeason, fixturesLoadedFor]);

  // ── stats tab: load full stats when season or tab changes ─────────────────────
  useEffect(() => {
    if (activeTab !== "stats" || !data?.team?.id || !data?.stats?.league?.id) return;
    const key = `${data.team.id}:${data.stats.league.id}:${statsSelectedSeason}`;
    if (statsLoadedFor.current === key) return;
    statsLoadedFor.current = key;
    setStatsLoading(true);
    setTeamStats(null);
    fetch(`/api/football/team-season-stats?team=${data.team.id}&league=${data.stats.league.id}&season=${statsSelectedSeason}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setTeamStats(d?.stats ?? null))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [activeTab, data, statsSelectedSeason]);

  function handleSeasonChange(s: number) {
    setSelectedSeason(s);
    setFixturesLoadedFor(""); // clears the guard → triggers fixture reload
    setTeamFixtures(null);
  }

  // Derived values used across tabs
  const formChars = (data?.stats?.form ?? "").slice(-5).split("") as ("W" | "D" | "L")[];
  const teamId    = data?.team?.id ?? 0;

  // Find team's position in standings for the mini-table slice
  const teamRankIdx = standings ? standings.findIndex((s) => s.team.id === teamId) : -1;
  const miniTable   = standings
    ? standings.slice(Math.max(0, teamRankIdx - 2), teamRankIdx + 3)
    : [];

  // Find this team's top scorer and assister from the league-wide lists
  const teamTopScorer = topScorers?.find((p) => p.statistics[0]?.team.id === teamId) ?? null;
  const teamTopAssist = topAssists?.find( (p) => p.statistics[0]?.team.id === teamId) ?? null;

  // Find the lineup that belongs to this team
  const myLineup = lineupData?.lineups.find((l) => l.team.id === teamId) ?? null;

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview",  label: "Overview",  icon: BarChart3  },
    { key: "fixtures",  label: "Fixtures",  icon: Calendar   },
    { key: "squad",     label: "Squad",     icon: Users      },
    { key: "stats",     label: "Stats",     icon: Activity   },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          <button onClick={() => router.back()} className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-200 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-44 w-full rounded-2xl" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
            </div>
          )}

          {!loading && notFound && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-bg-border bg-bg-card py-20 text-center shadow-sm">
              <Shield className="mb-3 h-12 w-12 text-slate-700" />
              <p className="font-semibold text-slate-200">Team not found</p>
              <p className="mt-1 text-sm text-slate-500">"{teamName}" could not be found.</p>
              <Link href="/" className="mt-4 text-sm font-semibold text-accent-green hover:underline">← Back to predictions</Link>
            </div>
          )}

          {!loading && data && (
            <>
              {/* ── Hero ──────────────────────────────────────────────────── */}
              <div className="mb-6 overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                <div className="h-1.5 w-full bg-emerald-200" />
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="relative h-20 w-20 shrink-0">
                        <Image src={data.team.logo} alt={data.team.name} fill className="object-contain" sizes="80px" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-extrabold text-white sm:text-4xl">{data.team.name}</h1>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                          {data.stats?.league && (
                            <Link href={`/leagues/${data.stats.league.id}`} className="flex items-center gap-1.5 hover:text-slate-200 transition-colors">
                              <div className="relative h-4 w-4"><Image src={data.stats.league.logo} alt="" fill className="object-contain" sizes="16px" /></div>
                              {data.stats.league.name}
                            </Link>
                          )}
                          <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{data.venue.city}</span>
                          <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Est. {data.team.founded}</span>
                          <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{data.venue.name}</span>
                        </div>
                      </div>
                    </div>
                    {formChars.length > 0 && (
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs uppercase tracking-widest text-slate-500">Form</span>
                        <div className="flex gap-1.5">{formChars.map((r, i) => <FormBadge key={i} result={r} />)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Tabs ──────────────────────────────────────────────────── */}
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

              {/* ════════════════════════════════════════════════════════════
                  OVERVIEW TAB
              ════════════════════════════════════════════════════════════ */}
              {activeTab === "overview" && (
                <div className="space-y-8">

                  {/* Next Match + Team Form */}
                  <div className="grid gap-6 lg:grid-cols-3">
                    {/* Next fixture prediction card */}
                    <div className="lg:col-span-2">
                      <SectionHeading>Next Match</SectionHeading>
                      {nextFixture ? (
                        <PredictionCard event={nextFixture} />
                      ) : (
                        <EmptyCard message="No upcoming fixture found" />
                      )}
                    </div>
                    {/* Season stats summary */}
                    {data.stats && (
                      <div>
                        <SectionHeading>Season at a Glance</SectionHeading>
                        <div className="rounded-2xl border border-bg-border bg-bg-card p-5 shadow-sm space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { label: "Played", value: data.stats.fixtures.played.total },
                              { label: "Won",    value: data.stats.fixtures.wins.total },
                              { label: "Drawn",  value: data.stats.fixtures.draws.total },
                              { label: "Lost",   value: data.stats.fixtures.loses.total },
                              { label: "GF",     value: data.stats.goals.for.total.total },
                              { label: "GA",     value: data.stats.goals.against.total.total },
                            ].map((s) => (
                              <div key={s.label} className="rounded-xl border border-bg-border bg-bg-base px-3 py-3 text-center">
                                <div className="text-xl font-extrabold text-white">{s.value}</div>
                                <div className="text-[10px] text-slate-500">{s.label}</div>
                              </div>
                            ))}
                          </div>
                          {/* Clean sheets row */}
                          <div className="flex items-center justify-between rounded-xl border border-bg-border bg-bg-base px-4 py-3">
                            <span className="text-sm text-slate-400">Clean Sheets</span>
                            <span className="text-lg font-extrabold text-white">{data.stats.clean_sheet.total}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Last Starting 11 */}
                  <div>
                    <SectionHeading>Last Starting 11</SectionHeading>

                    {lineupLoading && (
                      <div className="space-y-3">
                        <Skeleton className="h-16 w-full rounded-2xl" />
                        <Skeleton className="h-72 w-full rounded-2xl" />
                      </div>
                    )}

                    {!lineupLoading && (!lineupData?.fixture) && (
                      <EmptyCard message="No recent lineup data available" />
                    )}

                    {!lineupLoading && lineupData?.fixture && (
                      <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                        {/* Fixture header */}
                        <div className="border-b border-bg-border px-5 py-4">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            {/* Teams + score */}
                            <div className="flex items-center gap-4">
                              <Link href={`/teams/${encodeURIComponent(lineupData.fixture.teams.home.name)}`} className="flex items-center gap-2 hover:text-white transition-colors">
                                {lineupData.fixture.teams.home.logo && (
                                  <div className="relative h-8 w-8 shrink-0"><Image src={lineupData.fixture.teams.home.logo} alt="" fill className="object-contain" sizes="32px" /></div>
                                )}
                                <span className={`text-sm font-bold ${lineupData.fixture.teams.home.winner ? "text-white" : "text-slate-400"}`}>{lineupData.fixture.teams.home.name}</span>
                              </Link>
                              <div className="rounded-lg bg-bg-border px-3 py-1.5 text-base font-extrabold text-white tabular-nums">
                                {lineupData.fixture.goals.home ?? 0} – {lineupData.fixture.goals.away ?? 0}
                              </div>
                              <Link href={`/teams/${encodeURIComponent(lineupData.fixture.teams.away.name)}`} className="flex items-center gap-2 hover:text-white transition-colors">
                                <span className={`text-sm font-bold ${lineupData.fixture.teams.away.winner ? "text-white" : "text-slate-400"}`}>{lineupData.fixture.teams.away.name}</span>
                                {lineupData.fixture.teams.away.logo && (
                                  <div className="relative h-8 w-8 shrink-0"><Image src={lineupData.fixture.teams.away.logo} alt="" fill className="object-contain" sizes="32px" /></div>
                                )}
                              </Link>
                            </div>
                            {/* Match meta */}
                            <div className="text-right text-xs text-slate-500">
                              <p>{new Date(lineupData.fixture.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</p>
                              <p>{formatRound(lineupData.fixture.round)} · {lineupData.fixture.league.name}</p>
                              {lineupData.fixture.venue && <p>{lineupData.fixture.venue}</p>}
                            </div>
                          </div>
                        </div>

                        {/* Manager + formation */}
                        {myLineup && (
                          <div className="flex items-center justify-between border-b border-bg-border px-5 py-3">
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <Users className="h-3.5 w-3.5 text-slate-500" />
                              <span>Manager: <span className="font-semibold text-white">{myLineup.coach.name}</span></span>
                            </div>
                            <span className="rounded-md bg-accent-green/10 px-2.5 py-1 text-xs font-bold text-accent-green">
                              {myLineup.formation}
                            </span>
                          </div>
                        )}

                        {/* Pitch + events layout */}
                        <div className="grid gap-6 p-5 lg:grid-cols-5">
                          {/* Formation pitch (3/5) */}
                          <div className="lg:col-span-3">
                            {myLineup ? (
                              <FormationPitch startXI={myLineup.startXI} formation={myLineup.formation} />
                            ) : (
                              <div className="flex items-center justify-center rounded-xl bg-[#1a3a24] py-16 text-sm text-emerald-900">Lineup not available</div>
                            )}
                          </div>

                          {/* Events + subs (2/5) */}
                          <div className="lg:col-span-2 space-y-5">
                            {/* Match events for this team */}
                            {lineupData.events.length > 0 && (
                              <EventTimeline events={lineupData.events} teamId={teamId} label="Events" />
                            )}
                            {/* Substitutes */}
                            {myLineup && myLineup.substitutes.length > 0 && (
                              <div>
                                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Substitutes</p>
                                <div className="flex flex-wrap gap-2">
                                  {myLineup.substitutes.map(({ player }) => (
                                    <span key={player.id} className="rounded-md bg-bg-border px-2 py-1 text-[11px] text-slate-400">
                                      <span className="mr-1 font-bold text-slate-500">{player.number}</span>
                                      {getSurname(player.name)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* League Table mini */}
                  {(standingsLoading || (standings && standings.length > 0)) && (
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <SectionHeading>League Table</SectionHeading>
                        {data.stats?.league && (
                          <Link href={`/leagues/${data.stats.league.id}`} className="text-xs font-semibold text-accent-green hover:underline">
                            Full table →
                          </Link>
                        )}
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                        {standingsLoading ? (
                          <div className="space-y-1 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-bg-border text-left text-[11px] text-slate-500">
                                  <th className="w-8 px-4 py-2.5 font-medium">#</th>
                                  <th className="px-4 py-2.5 font-medium">Team</th>
                                  <th className="px-3 py-2.5 text-center font-medium">P</th>
                                  <th className="hidden px-3 py-2.5 text-center font-medium sm:table-cell">W</th>
                                  <th className="hidden px-3 py-2.5 text-center font-medium sm:table-cell">D</th>
                                  <th className="hidden px-3 py-2.5 text-center font-medium sm:table-cell">L</th>
                                  <th className="hidden px-3 py-2.5 text-center font-medium sm:table-cell">GD</th>
                                  <th className="px-3 py-2.5 text-center font-bold">Pts</th>
                                  <th className="px-4 py-2.5 font-medium">Form</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-bg-border">
                                {miniTable.map((row) => {
                                  const isMyTeam = row.team.id === teamId;
                                  return (
                                    <tr key={row.team.id} className={`transition-colors ${isMyTeam ? "bg-accent-green/5 border-l-2 border-l-accent-green" : "hover:bg-bg-border"}`}>
                                      <td className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500">{row.rank}</td>
                                      <td className="px-4 py-2.5">
                                        <Link href={`/teams/${encodeURIComponent(row.team.name)}`} className="group flex items-center gap-2">
                                          {row.team.logo && (
                                            <div className="relative h-5 w-5 shrink-0"><Image src={row.team.logo} alt="" fill className="object-contain" sizes="20px" /></div>
                                          )}
                                          <span className={`truncate font-semibold group-hover:text-accent-green ${isMyTeam ? "text-accent-green" : "text-white"}`}>{row.team.name}</span>
                                        </Link>
                                      </td>
                                      <td className="px-3 py-2.5 text-center text-slate-400">{row.all.played}</td>
                                      <td className="hidden px-3 py-2.5 text-center text-slate-400 sm:table-cell">{row.all.win}</td>
                                      <td className="hidden px-3 py-2.5 text-center text-slate-400 sm:table-cell">{row.all.draw}</td>
                                      <td className="hidden px-3 py-2.5 text-center text-slate-400 sm:table-cell">{row.all.lose}</td>
                                      <td className={`hidden px-3 py-2.5 text-center font-medium sm:table-cell ${row.goalsDiff > 0 ? "text-emerald-500" : row.goalsDiff < 0 ? "text-red-400" : "text-slate-500"}`}>
                                        {row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff}
                                      </td>
                                      <td className={`px-3 py-2.5 text-center font-extrabold ${isMyTeam ? "text-accent-green" : "text-white"}`}>{row.points}</td>
                                      <td className="px-4 py-2.5">
                                        <div className="flex gap-0.5">
                                          {row.form.slice(-5).split("").map((c, i) => (
                                            <span key={i} className={`inline-flex h-4 w-4 items-center justify-center rounded text-[9px] font-extrabold ${c === "W" ? "bg-emerald-500/15 text-emerald-400" : c === "D" ? "bg-slate-600/50 text-slate-400" : "bg-red-500/15 text-red-400"}`}>{c}</span>
                                          ))}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Top Performers */}
                  <div>
                    <SectionHeading>Top Performers</SectionHeading>
                    {performersLoading ? (
                      <div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <TopPerformerCard
                          title="Top Goal Scorer"
                          player={teamTopScorer}
                          statValue={teamTopScorer?.statistics[0]?.goals.total ?? null}
                          unit="goals"
                        />
                        <TopPerformerCard
                          title="Most Assists"
                          player={teamTopAssist}
                          statValue={teamTopAssist?.statistics[0]?.goals.assists ?? null}
                          unit="assists"
                        />
                      </div>
                    )}
                  </div>

                  {/* Key Players teaser */}
                  {Object.values(data.squad).flat().length > 0 && (
                    <div>
                      <SectionHeading>Key Players</SectionHeading>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {Object.values(data.squad).flat().slice(0, 6).map((p) => <PlayerCard key={p.id} player={p} />)}
                      </div>
                      <button onClick={() => setActiveTab("squad")} className="mt-3 text-xs font-semibold text-accent-green hover:underline">
                        View full squad →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ════════════════════════════════════════════════════════════
                  FIXTURES TAB
              ════════════════════════════════════════════════════════════ */}
              {activeTab === "fixtures" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">All Fixtures</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Season</span>
                      <div className="flex overflow-hidden rounded-lg border border-bg-border bg-bg-base">
                        {SEASONS.map((s) => (
                          <button key={s} onClick={() => handleSeasonChange(s)}
                            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${selectedSeason === s ? "bg-accent-green text-white" : "text-slate-400 hover:text-white hover:bg-bg-border"}`}
                          >
                            {seasonLabel(s)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                    {fixturesLoading ? (
                      <div className="space-y-1 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
                    ) : !teamFixtures || (teamFixtures.upcoming.length === 0 && teamFixtures.recent.length === 0) ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <List className="mb-3 h-10 w-10 text-slate-600" />
                        <p className="text-sm text-slate-500">No fixtures found for {seasonLabel(selectedSeason)}</p>
                      </div>
                    ) : (
                      <>
                        {teamFixtures.upcoming.length > 0 && (
                          <>
                            <div className="border-b border-bg-border px-5 py-3">
                              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Upcoming</p>
                            </div>
                            <div className="divide-y divide-bg-border">
                              {teamFixtures.upcoming.map((f) => <FixtureRow key={f.fixture.id} f={f} teamId={teamId} />)}
                            </div>
                          </>
                        )}
                        {teamFixtures.recent.length > 0 && (
                          <>
                            <div className={`border-b border-bg-border px-5 py-3 ${teamFixtures.upcoming.length ? "border-t" : ""}`}>
                              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Results</p>
                            </div>
                            <div className="divide-y divide-bg-border">
                              {[...teamFixtures.recent].reverse().map((f) => <FixtureRow key={f.fixture.id} f={f} teamId={teamId} />)}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ════════════════════════════════════════════════════════════
                  SQUAD TAB
              ════════════════════════════════════════════════════════════ */}
              {activeTab === "squad" && (
                <div className="space-y-6">
                  {Object.entries(data.squad).map(([group, players]) =>
                    players.length > 0 ? (
                      <div key={group}>
                        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                          {group} <span className="ml-1 font-normal normal-case text-slate-600">({players.length})</span>
                        </h3>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {players.map((p) => <PlayerCard key={p.id} player={p} />)}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              )}

              {/* ════════════════════════════════════════════════════════════
                  STATS TAB
              ════════════════════════════════════════════════════════════ */}
              {activeTab === "stats" && (
                <div className="space-y-6">
                  {/* Season selector */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Season Statistics</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Season</span>
                      <div className="flex overflow-hidden rounded-lg border border-bg-border bg-bg-base">
                        {SEASONS.map((s) => (
                          <button key={s} onClick={() => { setStatsSelectedSeason(s); statsLoadedFor.current = ""; setTeamStats(null); }}
                            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${statsSelectedSeason === s ? "bg-accent-green text-white" : "text-slate-400 hover:text-white hover:bg-bg-border"}`}
                          >
                            {seasonLabel(s)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {statsLoading && (
                    <div className="space-y-4">
                      <Skeleton className="h-24 rounded-2xl" />
                      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
                    </div>
                  )}

                  {!statsLoading && !teamStats && (
                    <EmptyCard message={`No statistics available for ${seasonLabel(statsSelectedSeason)}`} />
                  )}

                  {!statsLoading && teamStats && (() => {
                    // Parse card totals from minute-bucket objects
                    const yellows = sumCardBuckets(teamStats.cards?.yellow);
                    const reds    = sumCardBuckets(teamStats.cards?.red);

                    // shots can be an int or { total: int, on: int } depending on API version
                    const shotsTotal = typeof teamStats.shots === "object" && teamStats.shots !== null
                      ? (teamStats.shots?.total ?? teamStats.shots?.total?.total ?? null)
                      : (teamStats.shots ?? null);
                    const shotsOn = typeof teamStats.shots === "object" && teamStats.shots !== null
                      ? (teamStats.shots?.on ?? teamStats.shots?.on?.total ?? null)
                      : null;

                    const foulsTotal = typeof teamStats.fouls === "object" && teamStats.fouls !== null
                      ? (teamStats.fouls?.total ?? null)
                      : (teamStats.fouls ?? null);

                    const passTotal  = teamStats.passes?.total ?? null;
                    const passAcc    = teamStats.passes?.percentage ?? null;
                    const played     = teamStats.fixtures?.played?.total ?? 0;
                    const gf         = teamStats.goals?.for?.total?.total ?? 0;
                    const ga         = teamStats.goals?.against?.total?.total ?? 0;
                    const cs         = teamStats.clean_sheet?.total ?? null;
                    const penScored  = teamStats.penalty?.scored?.total ?? null;
                    const penSavedPct = teamStats.penalty?.saved?.percentage ?? null;
                    const mostCommonFormation = teamStats.lineups?.[0]?.formation ?? null;

                    return (
                      <>
                        {/* Summary cards */}
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                          {[
                            { label: "Played",       value: played },
                            { label: "Goals",        value: gf },
                            { label: "Conceded",     value: ga },
                            { label: "Clean Sheets", value: cs ?? "—" },
                            { label: "Wins",         value: teamStats.fixtures?.wins?.total ?? "—" },
                            { label: "Formation",    value: mostCommonFormation ?? "—" },
                          ].map((s) => (
                            <div key={s.label} className="rounded-xl border border-bg-border bg-bg-card px-3 py-4 text-center shadow-sm">
                              <div className="text-xl font-extrabold text-white">{s.value}</div>
                              <div className="mt-0.5 text-[10px] text-slate-500">{s.label}</div>
                            </div>
                          ))}
                        </div>

                        {/* Stats sections */}
                        <div className="grid gap-6 lg:grid-cols-2">
                          <StatsSection label="Attack" icon={Target} items={[
                            { label: "Goals",                      value: gf,        max: 120 },
                            { label: "xG (Expected Goals)",        value: null },
                            { label: "Shots Total",                value: shotsTotal, max: 700 },
                            { label: "Shots on Target",            value: shotsOn,    max: 400 },
                            { label: "Shots on Target (in box)",   value: null },
                            { label: "Shots on Target (out box)",  value: null },
                            { label: "Touches in Opp. Box",        value: null },
                            { label: "Penalties Scored",           value: penScored,  max: 15 },
                            { label: "Free Kicks Scored",          value: null },
                            { label: "Hit Woodwork",               value: null },
                            { label: "Crosses Completed %",        value: null },
                          ]} />

                          <StatsSection label="Defence" icon={Shield} items={[
                            { label: "Goals Conceded",             value: ga,        max: 100 },
                            { label: "Clean Sheets",               value: cs,        max: 40 },
                            { label: "Interceptions",              value: null },
                            { label: "Blocks",                     value: null },
                            { label: "Clearances",                 value: null },
                            { label: "Penalties Saved %",          value: penSavedPct },
                          ]} />

                          <StatsSection label="Possession" icon={Activity} items={[
                            { label: "Passes",                     value: passTotal,  max: 25000 },
                            { label: "Pass Accuracy %",            value: passAcc },
                            { label: "Long Passes Completed %",    value: null },
                            { label: "Corners Taken",              value: null },
                          ]} />

                          <StatsSection label="Physical" icon={Zap} items={[
                            { label: "Dribbles Completed %",       value: null },
                            { label: "Duels Won",                  value: null },
                            { label: "Aerial Duels Won",           value: null },
                          ]} />

                          <StatsSection label="Discipline" icon={TrendingUp} items={[
                            { label: "Yellow Cards",               value: yellows,    max: 120 },
                            { label: "Red Cards",                  value: reds,       max: 10 },
                            { label: "Fouls Committed",            value: foulsTotal, max: 600 },
                            { label: "Offsides",                   value: null },
                            { label: "Own Goals",                  value: null },
                          ]} />
                        </div>
                      </>
                    );
                  })()}
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
