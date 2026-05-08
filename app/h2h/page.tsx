"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Search, X, ChevronRight, Users, User, Shield, TrendingUp, Target, Star, Clock, Zap, Swords } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// ── types ──────────────────────────────────────────────────────────────────────

interface TeamResult {
  id: number; name: string; logo: string; country: string;
}

interface SquadPlayer {
  id: number; name: string; position: string; number: number | null; photo: string;
}

interface PlayerSearchResult {
  id: number; name: string; photo: string | null; position: string | null;
  team: { id: number; name: string; logo: string } | null;
}

interface H2HMatch {
  date: string;
  homeTeamId: number; homeTeam: string; homeLogo: string; homeScore: number | null;
  awayTeamId: number; awayTeam: string; awayLogo: string; awayScore: number | null;
  winner: "home" | "away" | "draw" | null;
  league: string; leagueLogo: string;
}

interface TeamH2HStats {
  wins: number; draws: number; losses: number;
  goalsFor: number; goalsAgainst: number;
  cleanSheets: number; biggestWinMargin: number;
  total: number;
}

interface PlayerSummary {
  appearances: number; goals: number; assists: number;
  minutesPlayed: number; avgMinutesPerGame: number;
  goalsPerGame: number; assistsPerGame: number;
  shotsOnTarget: number; keyPasses: number;
  avgRating: number | null;
}

interface PlayerAppearance {
  fixtureId: number; date: string;
  homeTeamId: number; homeTeam: string; homeLogo: string;
  awayTeamId: number; awayTeam: string; awayLogo: string;
  homeScore: number | null; awayScore: number | null;
  isHome: boolean; league: string; leagueLogo: string;
  minutes: number; rating: number | null;
  goals: number; assists: number;
  shotsOn: number; shotsTotal: number; keyPasses: number;
  yellowCard: boolean; redCard: boolean;
}

type Mode = "teams" | "player";

// ── helpers ────────────────────────────────────────────────────────────────────

function computeTeamStats(matches: H2HMatch[], teamId: number): TeamH2HStats {
  let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0, cleanSheets = 0, biggestWinMargin = 0;
  for (const m of matches) {
    const isHome = m.homeTeamId === teamId;
    const gf = (isHome ? m.homeScore : m.awayScore) ?? 0;
    const ga = (isHome ? m.awayScore : m.homeScore) ?? 0;
    goalsFor += gf; goalsAgainst += ga;
    if (ga === 0) cleanSheets++;
    biggestWinMargin = Math.max(biggestWinMargin, gf - ga);
    if (!m.winner) { draws++; continue; }
    const won = (isHome && m.winner === "home") || (!isHome && m.winner === "away");
    const lost = (isHome && m.winner === "away") || (!isHome && m.winner === "home");
    if (won) wins++; else if (lost) losses++; else draws++;
  }
  return { wins, draws, losses, goalsFor, goalsAgainst, cleanSheets, biggestWinMargin, total: matches.length };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ── shared sub-components ──────────────────────────────────────────────────────

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-white/5 ${className}`} />;
}

function StatCard({ label, value, sub, highlight }: {
  label: string; value: string | number; sub?: string; highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`text-2xl font-extrabold tabular-nums ${highlight ? "text-accent-green" : "text-white"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

// Reusable team search input with dropdown
function TeamSearchBox({
  placeholder, value, onChange, results, onSelect, onClear, loading,
}: {
  placeholder: string;
  value: string;
  onChange: (q: string) => void;
  results: TeamResult[];
  onSelect: (item: TeamResult) => void;
  onClear: () => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => { if (results.length > 0) setOpen(true); }, [results]);

  return (
    <div className="relative" ref={ref}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
        {loading
          ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-accent-green" />
          : <Search className="h-4 w-4 text-slate-500" />}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-9 text-sm text-white placeholder-slate-600 outline-none transition focus:border-accent-green/50 focus:ring-2 focus:ring-accent-green/20"
      />
      {value && (
        <button onClick={onClear} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-200">
          <X className="h-4 w-4" />
        </button>
      )}
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-white/10 bg-bg-card shadow-xl">
          {results.map((t) => (
            <button key={t.id} onClick={() => { onSelect(t); setOpen(false); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/5"
            >
              {t.logo && <div className="relative h-6 w-6 shrink-0"><Image src={t.logo} alt="" fill className="object-contain" sizes="24px" /></div>}
              <div>
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <p className="text-xs text-slate-500">{t.country}</p>
              </div>
              <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-600" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Player search input with dropdown (name → team shown as subtitle)
function PlayerSearchBox({
  placeholder, value, onChange, results, onSelect, onClear, loading,
}: {
  placeholder: string;
  value: string;
  onChange: (q: string) => void;
  results: PlayerSearchResult[];
  onSelect: (item: PlayerSearchResult) => void;
  onClear: () => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => { if (results.length > 0) setOpen(true); }, [results]);

  return (
    <div className="relative" ref={ref}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
        {loading
          ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-accent-green" />
          : <User className="h-4 w-4 text-slate-500" />}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-9 text-sm text-white placeholder-slate-600 outline-none transition focus:border-accent-green/50 focus:ring-2 focus:ring-accent-green/20"
      />
      {value && (
        <button onClick={onClear} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-200">
          <X className="h-4 w-4" />
        </button>
      )}
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-white/10 bg-bg-card shadow-xl [scrollbar-width:thin]">
          {results.map((p) => (
            <button key={p.id} onClick={() => { onSelect(p); setOpen(false); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/5"
            >
              {p.photo ? (
                <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full">
                  <Image src={p.photo} alt="" fill className="object-cover" sizes="28px" />
                </div>
              ) : (
                <div className="h-7 w-7 shrink-0 rounded-full bg-white/8 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-slate-500" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{p.name}</p>
                <p className="text-xs text-slate-500">
                  {p.team?.name ?? "Unknown team"}{p.position ? ` · ${p.position}` : ""}
                </p>
              </div>
              {p.team?.logo && (
                <div className="relative h-5 w-5 shrink-0">
                  <Image src={p.team.logo} alt="" fill className="object-contain" sizes="20px" />
                </div>
              )}
              <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-600" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── team H2H display ───────────────────────────────────────────────────────────

function TeamH2HView({ matches, team1, team2 }: {
  matches: H2HMatch[];
  team1: TeamResult;
  team2: TeamResult;
}) {
  const s1 = computeTeamStats(matches, team1.id);
  const s2 = computeTeamStats(matches, team2.id);
  const avgGoals = matches.length > 0
    ? (((s1.goalsFor + s1.goalsAgainst) / matches.length)).toFixed(1)
    : "—";

  return (
    <div className="space-y-5">
      {/* Head-to-head record bar */}
      <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/3">
        <div className="border-b border-white/8 px-5 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Head-to-Head Record — last {matches.length} meetings
          </p>
        </div>
        <div className="p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex flex-col items-center gap-2 text-center">
              {team1.logo && <div className="relative h-12 w-12"><Image src={team1.logo} alt="" fill className="object-contain" sizes="48px" /></div>}
              <p className="text-sm font-bold text-white">{team1.name}</p>
              <p className="text-3xl font-extrabold text-accent-green">{s1.wins}</p>
              <p className="text-xs text-slate-500">wins</p>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-2xl font-extrabold text-white">{s1.draws}</p>
              <p className="text-xs font-semibold text-slate-500">draws</p>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              {team2.logo && <div className="relative h-12 w-12"><Image src={team2.logo} alt="" fill className="object-contain" sizes="48px" /></div>}
              <p className="text-sm font-bold text-white">{team2.name}</p>
              <p className="text-3xl font-extrabold text-accent-green">{s2.wins}</p>
              <p className="text-xs text-slate-500">wins</p>
            </div>
          </div>
          {matches.length > 0 && (
            <div className="flex h-2 overflow-hidden rounded-full">
              <div className="bg-accent-green/70 transition-all" style={{ width: `${(s1.wins / matches.length) * 100}%` }} />
              <div className="bg-white/15 transition-all" style={{ width: `${(s1.draws / matches.length) * 100}%` }} />
              <div className="bg-red-500/50 transition-all" style={{ width: `${(s2.wins / matches.length) * 100}%` }} />
            </div>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Avg Goals/Game" value={avgGoals} sub={`${s1.goalsFor + s1.goalsAgainst} total goals`} />
        <StatCard label={`${team1.name} Goals`} value={s1.goalsFor} sub={`${s1.goalsAgainst} conceded`} />
        <StatCard label={`${team1.name} Clean Sheets`} value={s1.cleanSheets} sub={`${s2.cleanSheets} for ${team2.name}`} />
        <StatCard
          label={`${team1.name} Best Win`}
          value={s1.biggestWinMargin > 0 ? `+${s1.biggestWinMargin}` : s1.biggestWinMargin === 0 ? "—" : s1.biggestWinMargin}
          sub={`${team2.name}: ${s2.biggestWinMargin > 0 ? "+" + s2.biggestWinMargin : "—"}`}
        />
      </div>

      {/* Match history */}
      <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/3">
        <div className="border-b border-white/8 px-5 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Match History</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-left text-[11px] text-slate-500">
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Match</th>
                <th className="px-3 py-2.5 text-center font-medium">Score</th>
                <th className="hidden px-3 py-2.5 font-medium sm:table-cell">Competition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {matches.map((m) => {
                const t1Won = (m.homeTeamId === team1.id && m.winner === "home") ||
                              (m.awayTeamId === team1.id && m.winner === "away");
                const t2Won = (m.homeTeamId === team2.id && m.winner === "home") ||
                              (m.awayTeamId === team2.id && m.winner === "away");
                return (
                  <tr key={`${m.date}-${m.homeTeam}`} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">{fmtDate(m.date)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {m.homeLogo && <div className="relative h-4 w-4 shrink-0"><Image src={m.homeLogo} alt="" fill className="object-contain" sizes="16px" /></div>}
                        <span className={`text-xs font-semibold ${t1Won && m.homeTeamId === team1.id ? "text-accent-green" : t2Won && m.homeTeamId === team2.id ? "text-accent-green" : "text-slate-300"}`}>
                          {m.homeTeam}
                        </span>
                        <span className="text-slate-600 text-[10px]">vs</span>
                        {m.awayLogo && <div className="relative h-4 w-4 shrink-0"><Image src={m.awayLogo} alt="" fill className="object-contain" sizes="16px" /></div>}
                        <span className={`text-xs font-semibold ${t1Won && m.awayTeamId === team1.id ? "text-accent-green" : t2Won && m.awayTeamId === team2.id ? "text-accent-green" : "text-slate-300"}`}>
                          {m.awayTeam}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-block rounded-md px-2 py-0.5 text-sm font-extrabold tabular-nums ${
                        m.winner === null ? "bg-white/8 text-slate-300" :
                        t1Won ? "bg-accent-green/15 text-accent-green" : "bg-red-500/10 text-red-400"
                      }`}>
                        {m.homeScore ?? "?"} – {m.awayScore ?? "?"}
                      </span>
                    </td>
                    <td className="hidden px-3 py-2.5 sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        {m.leagueLogo && <div className="relative h-3.5 w-3.5 shrink-0"><Image src={m.leagueLogo} alt="" fill className="object-contain" sizes="14px" /></div>}
                        <span className="text-xs text-slate-500">{m.league}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── player H2H display ─────────────────────────────────────────────────────────

function PlayerH2HView({ summary, appearances, player, playerTeam, opponent }: {
  summary: PlayerSummary;
  appearances: PlayerAppearance[];
  player: SquadPlayer;
  playerTeam: TeamResult;
  opponent: TeamResult;
}) {
  return (
    <div className="space-y-5">
      {/* Player header */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/8 bg-white/3 p-5">
        {player.photo && (
          <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white/10">
            <Image src={player.photo} alt={player.name} fill className="object-cover" sizes="64px" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-extrabold text-white">{player.name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            {playerTeam.logo && <div className="relative h-4 w-4 shrink-0"><Image src={playerTeam.logo} alt="" fill className="object-contain" sizes="16px" /></div>}
            <span>{playerTeam.name}</span>
            {player.position && <><span className="text-slate-700">·</span><span className="rounded bg-white/8 px-1.5 py-0.5 font-semibold">{player.position}</span></>}
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/3 px-4 py-2">
          <Swords className="h-4 w-4 text-slate-500" />
          <div className="text-center">
            <p className="text-xs text-slate-500">vs</p>
            <p className="text-sm font-bold text-white">{opponent.name}</p>
          </div>
          {opponent.logo && <div className="relative h-8 w-8 shrink-0"><Image src={opponent.logo} alt="" fill className="object-contain" sizes="32px" /></div>}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Appearances" value={summary.appearances} sub={`${summary.avgMinutesPerGame} min avg`} />
        <StatCard label="Goals" value={summary.goals} sub={`${summary.goalsPerGame} per game`} highlight={summary.goals > 0} />
        <StatCard label="Assists" value={summary.assists} sub={`${summary.assistsPerGame} per game`} highlight={summary.assists > 0} />
        <StatCard label="Avg Rating" value={summary.avgRating ?? "—"} sub="out of 10" highlight={(summary.avgRating ?? 0) >= 7} />
        <StatCard label="Shots on Target" value={summary.shotsOnTarget} sub={`${summary.appearances ? (summary.shotsOnTarget / summary.appearances).toFixed(1) : 0} per game`} />
        <StatCard label="Key Passes" value={summary.keyPasses} sub={`${summary.appearances ? (summary.keyPasses / summary.appearances).toFixed(1) : 0} per game`} />
      </div>

      {/* Per-game table */}
      <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/3">
        <div className="border-b border-white/8 px-5 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Game by Game</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-left text-[11px] text-slate-500">
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Match</th>
                <th className="px-3 py-2.5 text-center font-medium">Score</th>
                <th className="px-3 py-2.5 text-center font-medium">Mins</th>
                <th className="px-3 py-2.5 text-center font-medium">G</th>
                <th className="px-3 py-2.5 text-center font-medium">A</th>
                <th className="hidden px-3 py-2.5 text-center font-medium sm:table-cell">SOT</th>
                <th className="hidden px-3 py-2.5 text-center font-medium sm:table-cell">KP</th>
                <th className="px-3 py-2.5 text-right font-medium">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {appearances.map((a) => {
                const playerWon = (a.isHome && (a.homeScore ?? 0) > (a.awayScore ?? 0)) ||
                                  (!a.isHome && (a.awayScore ?? 0) > (a.homeScore ?? 0));
                const draw = a.homeScore === a.awayScore;
                return (
                  <tr key={a.fixtureId} className="transition-colors hover:bg-white/3">
                    <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">{fmtDate(a.date)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {a.homeLogo && <div className="relative h-4 w-4 shrink-0"><Image src={a.homeLogo} alt="" fill className="object-contain" sizes="16px" /></div>}
                        <span className="text-xs text-slate-300 truncate max-w-[60px] sm:max-w-none">{a.homeTeam}</span>
                        <span className="text-[10px] text-slate-600">vs</span>
                        {a.awayLogo && <div className="relative h-4 w-4 shrink-0"><Image src={a.awayLogo} alt="" fill className="object-contain" sizes="16px" /></div>}
                        <span className="text-xs text-slate-300 truncate max-w-[60px] sm:max-w-none">{a.awayTeam}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-extrabold tabular-nums ${playerWon ? "bg-accent-green/15 text-accent-green" : draw ? "bg-white/8 text-slate-300" : "bg-red-500/10 text-red-400"}`}>
                        {a.homeScore ?? "?"} – {a.awayScore ?? "?"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs tabular-nums text-slate-400">{a.minutes}&apos;</td>
                    <td className="px-3 py-2.5 text-center text-sm font-bold tabular-nums">
                      <span className={a.goals > 0 ? "text-accent-green" : "text-slate-700"}>{a.goals}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center text-sm font-bold tabular-nums">
                      <span className={a.assists > 0 ? "text-blue-400" : "text-slate-700"}>{a.assists}</span>
                    </td>
                    <td className="hidden px-3 py-2.5 text-center text-xs tabular-nums text-slate-400 sm:table-cell">{a.shotsOn}</td>
                    <td className="hidden px-3 py-2.5 text-center text-xs tabular-nums text-slate-400 sm:table-cell">{a.keyPasses}</td>
                    <td className="px-3 py-2.5 text-right">
                      {a.rating !== null ? (
                        <span className={`text-sm font-bold tabular-nums ${a.rating >= 7 ? "text-accent-green" : a.rating >= 6 ? "text-slate-300" : "text-red-400"}`}>
                          {a.rating.toFixed(1)}
                        </span>
                      ) : <span className="text-slate-700">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── main page ──────────────────────────────────────────────────────────────────

export default function H2HPage() {
  const [mode, setMode] = useState<Mode>("teams");

  // team mode — team 1
  const [query1, setQuery1] = useState("");
  const [results1, setResults1] = useState<TeamResult[]>([]);
  const [loading1, setLoading1] = useState(false);
  const [team1, setTeam1] = useState<TeamResult | null>(null);

  // shared — team 2 / opponent
  const [query2, setQuery2] = useState("");
  const [results2, setResults2] = useState<TeamResult[]>([]);
  const [loading2, setLoading2] = useState(false);
  const [team2, setTeam2] = useState<TeamResult | null>(null);

  // player mode — direct player search
  const [playerQuery, setPlayerQuery] = useState("");
  const [playerResults, setPlayerResults] = useState<PlayerSearchResult[]>([]);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [player, setPlayer] = useState<SquadPlayer | null>(null);
  const [playerTeam, setPlayerTeam] = useState<TeamResult | null>(null);

  // results
  const [h2hMatches, setH2hMatches] = useState<H2HMatch[] | null>(null);
  const [h2hLoading, setH2hLoading] = useState(false);
  const [playerH2H, setPlayerH2H] = useState<{ summary: PlayerSummary; appearances: PlayerAppearance[] } | null>(null);
  const [playerH2HLoading, setPlayerH2HLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const db1 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const db2 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dbPl = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced team search 1 (Teams mode left)
  useEffect(() => {
    if (query1.length < 2) { setResults1([]); return; }
    if (db1.current) clearTimeout(db1.current);
    db1.current = setTimeout(() => {
      setLoading1(true);
      fetch(`/api/football/search?q=${encodeURIComponent(query1)}`)
        .then((r) => r.ok ? r.json() : { teams: [] })
        .then((d) => setResults1(d.teams ?? []))
        .finally(() => setLoading1(false));
    }, 300);
  }, [query1]);

  // Debounced team search 2 (opponent — both modes)
  useEffect(() => {
    if (query2.length < 2) { setResults2([]); return; }
    if (db2.current) clearTimeout(db2.current);
    db2.current = setTimeout(() => {
      setLoading2(true);
      fetch(`/api/football/search?q=${encodeURIComponent(query2)}`)
        .then((r) => r.ok ? r.json() : { teams: [] })
        .then((d) => setResults2(d.teams ?? []))
        .finally(() => setLoading2(false));
    }, 300);
  }, [query2]);

  // Debounced player search (Player mode left)
  useEffect(() => {
    if (playerQuery.length < 3) { setPlayerResults([]); return; }
    if (dbPl.current) clearTimeout(dbPl.current);
    dbPl.current = setTimeout(() => {
      setPlayerLoading(true);
      fetch(`/api/football/player-search?q=${encodeURIComponent(playerQuery)}`)
        .then((r) => r.ok ? r.json() : { players: [] })
        .then((d) => setPlayerResults(d.players ?? []))
        .finally(() => setPlayerLoading(false));
    }, 300);
  }, [playerQuery]);

  // Fetch team H2H when both teams selected
  useEffect(() => {
    if (mode !== "teams" || !team1 || !team2) return;
    setH2hMatches(null); setError(null); setH2hLoading(true);
    fetch(`/api/football/h2h?home=${team1.id}&away=${team2.id}&last=20`)
      .then((r) => r.ok ? r.json() : { matches: [] })
      .then((d) => setH2hMatches(d.matches ?? []))
      .catch(() => setError("Failed to load H2H data."))
      .finally(() => setH2hLoading(false));
  }, [team1, team2, mode]);

  // Fetch player H2H when player + playerTeam + opponent are all set
  useEffect(() => {
    if (mode !== "player" || !player || !playerTeam || !team2) return;
    setPlayerH2H(null); setError(null); setPlayerH2HLoading(true);
    fetch(`/api/football/player-h2h?player=${player.id}&team1=${playerTeam.id}&team2=${team2.id}`)
      .then((r) => r.ok ? r.json() : { appearances: [], summary: null })
      .then((d) => {
        if (d.summary) {
          setPlayerH2H({ summary: d.summary, appearances: d.appearances });
        } else {
          setPlayerH2H({
            summary: { appearances: 0, goals: 0, assists: 0, minutesPlayed: 0, avgMinutesPerGame: 0, goalsPerGame: 0, assistsPerGame: 0, shotsOnTarget: 0, keyPasses: 0, avgRating: null },
            appearances: [],
          });
        }
      })
      .catch(() => setError("Failed to load player data."))
      .finally(() => setPlayerH2HLoading(false));
  }, [player, playerTeam, team2, mode]);

  const clearAll = useCallback(() => {
    setTeam1(null); setTeam2(null);
    setQuery1(""); setQuery2("");
    setResults1([]); setResults2([]);
    setPlayer(null); setPlayerTeam(null);
    setPlayerQuery(""); setPlayerResults([]);
    setH2hMatches(null); setPlayerH2H(null); setError(null);
  }, []);

  const switchMode = useCallback((m: Mode) => {
    setMode(m); clearAll();
  }, [clearAll]);

  const isLoading = h2hLoading || playerH2HLoading;
  const hasResult = mode === "teams"
    ? (h2hMatches !== null && team1 && team2)
    : (playerH2H !== null && player && playerTeam && team2);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl">Head-to-Head</h1>
            <p className="mt-2 max-w-2xl text-slate-400">
              Compare two teams&apos; historical record against each other, or see how a player performs against a specific opponent.
            </p>
          </div>

          {/* Mode toggle */}
          <div className="mb-6 flex overflow-hidden rounded-xl border border-white/8 bg-white/3 w-fit">
            <button onClick={() => switchMode("teams")}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-colors ${mode === "teams" ? "bg-accent-green text-white" : "text-slate-400 hover:text-white"}`}
            >
              <Users className="h-4 w-4" /> Teams
            </button>
            <button onClick={() => switchMode("player")}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-colors ${mode === "player" ? "bg-accent-green text-white" : "text-slate-400 hover:text-white"}`}
            >
              <User className="h-4 w-4" /> Player
            </button>
          </div>

          {/* Search inputs */}
          <div className="mb-6 grid items-start gap-3 sm:grid-cols-[1fr_auto_1fr]">

            {/* Left side */}
            {mode === "teams" ? (
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">Team</label>
                <TeamSearchBox
                  placeholder="Search team…"
                  value={team1 ? team1.name : query1}
                  onChange={(q) => { setQuery1(q); if (team1) { setTeam1(null); setH2hMatches(null); } }}
                  results={results1}
                  loading={loading1}
                  onSelect={(t) => { setTeam1(t); setQuery1(t.name); setResults1([]); }}
                  onClear={() => { setTeam1(null); setQuery1(""); setH2hMatches(null); }}
                />
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">Player</label>
                <PlayerSearchBox
                  placeholder="Search player by name…"
                  value={player ? player.name : playerQuery}
                  onChange={(q) => { setPlayerQuery(q); if (player) { setPlayer(null); setPlayerTeam(null); setPlayerH2H(null); } }}
                  results={playerResults}
                  loading={playerLoading}
                  onSelect={(p) => {
                    setPlayer({ id: p.id, name: p.name, position: p.position ?? "", number: null, photo: p.photo ?? "" });
                    setPlayerTeam(p.team ? { id: p.team.id, name: p.team.name, logo: p.team.logo, country: "" } : null);
                    setPlayerQuery(p.name);
                    setPlayerResults([]);
                    setPlayerH2H(null);
                  }}
                  onClear={() => { setPlayer(null); setPlayerTeam(null); setPlayerQuery(""); setPlayerH2H(null); }}
                />
              </div>
            )}

            {/* VS divider */}
            <div className="flex items-center justify-center pt-7">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <span className="text-xs font-bold text-slate-500">VS</span>
              </div>
            </div>

            {/* Right: opponent */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
                {mode === "teams" ? "Opponent" : "Opponent Team"}
              </label>
              <TeamSearchBox
                placeholder="Search opponent…"
                value={team2 ? team2.name : query2}
                onChange={(q) => { setQuery2(q); if (team2) { setTeam2(null); setH2hMatches(null); setPlayerH2H(null); } }}
                results={results2}
                loading={loading2}
                onSelect={(t) => { setTeam2(t); setQuery2(t.name); setResults2([]); }}
                onClear={() => { setTeam2(null); setQuery2(""); setH2hMatches(null); setPlayerH2H(null); }}
              />
            </div>
          </div>

          {/* Results area */}
          {isLoading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
              </div>
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
            </div>
          )}

          {error && !isLoading && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center text-sm text-red-400">{error}</div>
          )}

          {!isLoading && !error && mode === "teams" && h2hMatches && team1 && team2 && (
            h2hMatches.length === 0 ? (
              <div className="rounded-2xl border border-white/8 bg-white/3 py-16 text-center">
                <Shield className="mx-auto mb-3 h-10 w-10 text-slate-700" />
                <p className="font-semibold text-slate-300">No H2H matches found</p>
                <p className="mt-1 text-sm text-slate-500">These teams may not have met in recent seasons.</p>
              </div>
            ) : (
              <TeamH2HView matches={h2hMatches} team1={team1} team2={team2} />
            )
          )}

          {!isLoading && !error && mode === "player" && playerH2H && player && playerTeam && team2 && (
            playerH2H.appearances.length === 0 ? (
              <div className="rounded-2xl border border-white/8 bg-white/3 py-16 text-center">
                <User className="mx-auto mb-3 h-10 w-10 text-slate-700" />
                <p className="font-semibold text-slate-300">No appearances found</p>
                <p className="mt-1 text-sm text-slate-500">{player.name} may not have featured against {team2.name} in recent seasons.</p>
              </div>
            ) : (
              <PlayerH2HView
                summary={playerH2H.summary}
                appearances={playerH2H.appearances}
                player={player}
                playerTeam={playerTeam}
                opponent={team2}
              />
            )
          )}

          {!isLoading && !error && !hasResult && (
            <div className="mt-16 text-center">
              <Swords className="mx-auto mb-4 h-14 w-14 text-slate-800" />
              <p className="text-lg font-semibold text-slate-400">
                {mode === "teams"
                  ? "Select two teams to compare their H2H record"
                  : !player
                    ? "Search for a player by name"
                    : "Select an opponent to see the H2H record"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {mode === "teams" ? "Shows up to 20 historical meetings with stats breakdown." : "Shows goals, assists, ratings and more across all H2H matches."}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
