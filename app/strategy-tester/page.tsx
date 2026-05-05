"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search, X, TrendingUp, Target, Activity,
  ChevronRight, Info, BarChart2, Zap, Sparkles, RefreshCw,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// ── types ──────────────────────────────────────────────────────────────────────

interface TeamResult {
  id: number;
  name: string;
  logo: string;
  country: string;
}

interface FixtureResult {
  id: number;
  date: string;
  round: string;
  isHome: boolean;
  homeTeam: { id: number; name: string; logo: string };
  awayTeam: { id: number; name: string; logo: string };
  goals: { for: number; against: number; total: number };
  result: "W" | "D" | "L";
  btts: boolean;
  over25: boolean;
  league: { id: number; name: string; logo: string };
}

interface FixtureOdds {
  home:   number | null;
  draw:   number | null;
  away:   number | null;
  over25: number | null;
  btts:   number | null;
}

type Strategy = "win" | "draw" | "over25" | "btts";

// ── constants ──────────────────────────────────────────────────────────────────

const CURRENT_SEASON = (() => {
  const d = new Date();
  return d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1;
})();
const SEASONS = [CURRENT_SEASON, CURRENT_SEASON - 1, CURRENT_SEASON - 2];
function seasonLabel(s: number) { return `${s}/${String(s + 1).slice(2)}`; }

// Domestic leagues only — the Odds API historical endpoint has reliable
// pre-match odds for these. Cups and European competition are excluded
// until we have a database to store their odds separately.
const DOMESTIC_LEAGUE_IDS = new Set([
  39,  // Premier League
  140, // La Liga
  135, // Serie A
  78,  // Bundesliga
  61,  // Ligue 1
]);

const STRATEGIES: Record<Strategy, {
  label: string;
  description: string;
  hitLabel: string;
  icon: React.ElementType;
  oddsKey: keyof FixtureOdds;
}> = {
  win:    { label: "Back to Win",           description: "Bet on the team to win every single match",    hitLabel: "Wins",     icon: TrendingUp, oddsKey: "home"   },
  draw:   { label: "Back the Draw",         description: "Bet every match ends level",                   hitLabel: "Draws",    icon: Activity,   oddsKey: "draw"   },
  over25: { label: "Over 2.5 Goals",        description: "Bet on 3 or more total goals in every match",  hitLabel: "Over 2.5", icon: Target,     oddsKey: "over25" },
  btts:   { label: "Both Teams to Score",   description: "Bet both teams get on the scoresheet",         hitLabel: "BTTS Yes", icon: Zap,        oddsKey: "btts"   },
};

const RESULT_STYLES = {
  W: "bg-emerald-500/10 text-emerald-400",
  D: "bg-slate-600/40 text-slate-400",
  L: "bg-red-500/10 text-red-400",
};

// ── helpers ────────────────────────────────────────────────────────────────────

function getHit(f: FixtureResult, strategy: Strategy): boolean {
  switch (strategy) {
    case "win":    return f.result === "W";
    case "draw":   return f.result === "D";
    case "over25": return f.over25;
    case "btts":   return f.btts;
  }
}

// Returns the actual bookmaker odds for this fixture + strategy, or null if unavailable.
function getActualOdds(
  f: FixtureResult,
  strategy: Strategy,
  oddsMap: Record<number, FixtureOdds | null> | null
): number | null {
  if (!oddsMap) return null;
  const fo = oddsMap[f.id];
  if (!fo) return null;
  if (strategy === "win") {
    const o = f.isHome ? fo.home : fo.away;
    return o && o > 1.01 ? o : null;
  }
  const key = STRATEGIES[strategy].oddsKey as keyof FixtureOdds;
  const o = fo[key] as number | null;
  return o && o > 1.01 ? o : null;
}

// ── backtest logic ─────────────────────────────────────────────────────────────

interface GameRecord {
  fixtureId: number;
  oddsUsed: number | null; // null = no odds available, game excluded from P&L
  hit: boolean;
  pnl: number;
  running: number;
  skipped: boolean;
}

interface BacktestStats {
  totalPnL: number;
  roi: number;
  hits: number;
  total: number;      // games with odds (counted toward P&L)
  totalGames: number; // all games
  skipped: number;    // games excluded due to missing odds
  strikeRate: number;
  breakEvenOdds: number;
  avgOdds: number | null;
  cumulativePnL: number[];
  homeHits: number; homeTotal: number; homePnL: number;
  awayHits: number; awayTotal: number; awayPnL: number;
  maxWinStreak: number;
  maxLoseStreak: number;
  games: GameRecord[];
}

function runBacktest(
  fixtures: FixtureResult[],
  strategy: Strategy,
  betAmount: number,
  oddsMap: Record<number, FixtureOdds | null> | null
): BacktestStats {
  let totalPnL = 0, homePnL = 0, awayPnL = 0;
  let hits = 0, homeHits = 0, awayHits = 0, homeTotal = 0, awayTotal = 0;
  let curWin = 0, curLose = 0, maxWin = 0, maxLose = 0;
  let oddsSum = 0, oddsCount = 0, skipped = 0;
  const cumulativePnL: number[] = [];
  const games: GameRecord[] = [];

  for (const f of fixtures) {
    const oddsUsed = getActualOdds(f, strategy, oddsMap);

    if (oddsUsed === null) {
      // No bookmaker odds available — exclude from P&L but still show in table
      skipped++;
      games.push({ fixtureId: f.id, oddsUsed: null, hit: getHit(f, strategy), pnl: 0, running: totalPnL, skipped: true });
      continue;
    }

    const hit = getHit(f, strategy);
    const pnl = hit ? +(betAmount * (oddsUsed - 1)).toFixed(2) : -betAmount;

    totalPnL = +(totalPnL + pnl).toFixed(2);
    cumulativePnL.push(totalPnL);
    oddsSum += oddsUsed; oddsCount++;

    if (f.isHome) { homePnL = +(homePnL + pnl).toFixed(2); if (hit) homeHits++; homeTotal++; }
    else           { awayPnL = +(awayPnL + pnl).toFixed(2); if (hit) awayHits++; awayTotal++; }
    hits += hit ? 1 : 0;

    if (hit)  { curWin++;  curLose = 0; maxWin  = Math.max(maxWin,  curWin);  }
    else       { curLose++; curWin  = 0; maxLose = Math.max(maxLose, curLose); }

    games.push({ fixtureId: f.id, oddsUsed, hit, pnl, running: totalPnL, skipped: false });
  }

  const n = oddsCount; // only games with odds count toward staked
  const totalStaked = betAmount * n;
  return {
    totalPnL,
    roi:           n > 0 ? +((totalPnL / totalStaked) * 100).toFixed(1) : 0,
    hits, total: n,
    totalGames: fixtures.length,
    skipped,
    strikeRate:    n > 0 ? +((hits / n) * 100).toFixed(1) : 0,
    breakEvenOdds: hits > 0 ? +(n / hits).toFixed(2) : 0,
    avgOdds:       oddsCount > 0 ? +(oddsSum / oddsCount).toFixed(2) : null,
    cumulativePnL,
    homeHits, homeTotal, homePnL,
    awayHits, awayTotal, awayPnL,
    maxWinStreak: maxWin, maxLoseStreak: maxLose,
    games,
  };
}

// ── P&L chart ──────────────────────────────────────────────────────────────────

function PnLChart({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const values = [0, ...data];
  const W = 800, H = 160;
  const PAD = { t: 12, r: 12, b: 28, l: 60 };
  const iW = W - PAD.l - PAD.r, iH = H - PAD.t - PAD.b;
  const minV = Math.min(0, ...values), maxV = Math.max(0, ...values);
  const range = maxV - minV || 1;
  const mx = (i: number) => PAD.l + (i / (values.length - 1)) * iW;
  const my = (v: number) => PAD.t + (1 - (v - minV) / range) * iH;
  const zeroY = my(0);
  const lastPnL = data[data.length - 1];
  const lineCol = lastPnL >= 0 ? "#22c55e" : "#ef4444";
  const areaCl  = lastPnL >= 0 ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)";
  const pts   = values.map((v, i) => `${mx(i)},${my(v)}`).join(" ");
  const areaD = values.map((v, i) => `${i === 0 ? "M" : "L"}${mx(i).toFixed(1)},${my(v).toFixed(1)}`).join(" ")
    + ` L${mx(values.length - 1).toFixed(1)},${zeroY.toFixed(1)} L${mx(0).toFixed(1)},${zeroY.toFixed(1)} Z`;
  const ticks = [minV, minV + (maxV - minV) * 0.5, maxV].filter(
    (v, i, a) => a.findIndex((t) => Math.abs(t - v) < 0.01) === i
  );
  const fmt = (v: number) => v === 0 ? "£0" : `${v > 0 ? "+" : ""}£${Math.abs(v).toFixed(0)}`;
  const xTicks = [0, Math.floor((values.length - 1) / 2), values.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-36 sm:h-44" preserveAspectRatio="xMidYMid meet">
      {ticks.map((v) => (
        <g key={v}>
          <line x1={PAD.l} y1={my(v)} x2={W - PAD.r} y2={my(v)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <text x={PAD.l - 6} y={my(v) + 4} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.35)">{fmt(v)}</text>
        </g>
      ))}
      {xTicks.map((i) => (
        <text key={i} x={mx(i)} y={H - 4} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.3)">
          {i === 0 ? "Start" : i === values.length - 1 ? `G${data.length}` : `G${i}`}
        </text>
      ))}
      <line x1={PAD.l} y1={zeroY} x2={W - PAD.r} y2={zeroY} stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4,3" />
      <path d={areaD} fill={areaCl} />
      <polyline points={pts} fill="none" stroke={lineCol} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={mx(values.length - 1)} cy={my(values[values.length - 1])} r="4" fill={lineCol} />
    </svg>
  );
}

// ── small shared UI ────────────────────────────────────────────────────────────

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-white/5 ${className}`} />;
}

function StatCard({ label, value, sub, positive }: {
  label: string; value: string; sub?: string; positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`text-2xl font-extrabold tabular-nums ${positive === true ? "text-emerald-400" : positive === false ? "text-red-400" : "text-white"}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

// ── main page ──────────────────────────────────────────────────────────────────

export default function StrategyTesterPage() {
  // search
  const [query,         setQuery]         = useState("");
  const [results,       setResults]       = useState<TeamResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown,  setShowDropdown]  = useState(false);
  const searchRef   = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // team + fixtures
  const [team,            setTeam]            = useState<TeamResult | null>(null);
  const [season,          setSeason]          = useState(CURRENT_SEASON);
  const [fixtures,        setFixtures]        = useState<FixtureResult[] | null>(null);
  const [fixturesLoading, setFixturesLoading] = useState(false);

  // actual odds
  const [oddsMap,     setOddsMap]     = useState<Record<number, FixtureOdds | null> | null>(null);
  const [oddsLoading, setOddsLoading] = useState(false);
  const [oddsError,   setOddsError]   = useState<string | null>(null);

  // strategy settings
  const [strategy,  setStrategy]  = useState<Strategy>("win");
  const [betAmount, setBetAmount] = useState(10);

  // debounced search
  useEffect(() => {
    if (query.length < 2) { setResults([]); setShowDropdown(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchLoading(true);
      fetch(`/api/football/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.ok ? r.json() : { teams: [] })
        .then((d) => { setResults(d.teams ?? []); setShowDropdown(true); })
        .catch(() => {})
        .finally(() => setSearchLoading(false));
    }, 300);
  }, [query]);

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // load fixtures then immediately fetch their actual odds
  useEffect(() => {
    if (!team) return;
    setFixturesLoading(true);
    setFixtures(null);
    setOddsMap(null);
    setOddsError(null);

    fetch(`/api/football/team-results?team=${team.id}&season=${season}`)
      .then((r) => r.ok ? r.json() : { fixtures: [] })
      .then(async (d) => {
        const all: FixtureResult[] = d.fixtures ?? [];
        // Only keep domestic league games — cups and European competition
        // are excluded until we have database-backed historical odds for them.
        const loaded = all.filter((f) => DOMESTIC_LEAGUE_IDS.has(f.league.id));
        setFixtures(loaded);
        if (loaded.length === 0) return;

        setOddsLoading(true);
        try {
          const fixtures = loaded.map((f) => ({
            id:       f.id,
            date:     f.date,
            homeTeam: f.homeTeam.name,
            awayTeam: f.awayTeam.name,
            leagueId: f.league.id,
          }));
          const res = await fetch("/api/football/historical-odds", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ fixtures }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          const map: Record<number, FixtureOdds | null> = {};
          for (const [k, v] of Object.entries(data.odds ?? {})) {
            map[Number(k)] = v as FixtureOdds | null;
          }
          setOddsMap(map);
        } catch {
          setOddsError("Could not load odds — API quota may be exhausted.");
        } finally {
          setOddsLoading(false);
        }
      })
      .catch(() => setFixtures([]))
      .finally(() => setFixturesLoading(false));
  }, [team, season]);

  const handleSelectTeam = useCallback((t: TeamResult) => {
    setTeam(t);
    setQuery(t.name);
    setShowDropdown(false);
    setFixtures(null);
    setOddsMap(null);
  }, []);

  const handleClear = useCallback(() => {
    setTeam(null);
    setQuery("");
    setFixtures(null);
    setOddsMap(null);
    setShowDropdown(false);
  }, []);

  // derived stats (recalculates instantly on any input change)
  const stats = useMemo<BacktestStats | null>(() => {
    if (!fixtures || fixtures.length === 0 || !oddsMap) return null;
    return runBacktest(fixtures, strategy, betAmount, oddsMap);
  }, [fixtures, strategy, betAmount, oddsMap]);

  const pnlPositive = (stats?.totalPnL ?? 0) >= 0;
  const profitStr   = stats ? `${pnlPositive ? "+" : ""}£${stats.totalPnL.toFixed(2)}` : null;
  const roiStr      = stats ? `${stats.roi >= 0 ? "+" : ""}${stats.roi}%` : null;
  const coveredPct  = stats && stats.totalGames > 0
    ? Math.round((stats.total / stats.totalGames) * 100)
    : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">

          {/* ── Page header ──────────────────────────────────────────────── */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl">Strategy Tester</h1>
            <p className="mt-2 max-w-2xl text-slate-400">
              Pick a team, a betting strategy, and a stake — then see exactly how profitable
              (or painful) it would have been across their entire season.
            </p>
          </div>

          {/* ── Team search ──────────────────────────────────────────────── */}
          <div className="mb-6" ref={searchRef}>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Search for a team</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                {searchLoading
                  ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-accent-green" />
                  : <Search className="h-4 w-4 text-slate-500" />}
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => results.length > 0 && setShowDropdown(true)}
                placeholder="e.g. Manchester City, Barcelona, Juventus…"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-10 text-white placeholder-slate-600 outline-none transition focus:border-accent-green/50 focus:ring-2 focus:ring-accent-green/20 sm:text-sm"
              />
              {query && (
                <button onClick={handleClear} className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 hover:text-slate-200">
                  <X className="h-4 w-4" />
                </button>
              )}
              {showDropdown && results.length > 0 && (
                <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-white/10 bg-bg-card shadow-xl">
                  {results.map((t) => (
                    <button key={t.id} onClick={() => handleSelectTeam(t)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
                    >
                      {t.logo && <div className="relative h-7 w-7 shrink-0"><Image src={t.logo} alt="" fill className="object-contain" sizes="28px" /></div>}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{t.name}</p>
                        <p className="text-xs text-slate-500">{t.country}</p>
                      </div>
                      <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-600" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {team && (
            <>
              {/* ── Team badge + season selector ───────────────────────── */}
              <div className="mb-6 flex flex-wrap items-center gap-3">
                {team.logo && <div className="relative h-10 w-10 shrink-0"><Image src={team.logo} alt="" fill className="object-contain" sizes="40px" /></div>}
                <div>
                  <Link href={`/teams/${encodeURIComponent(team.name)}`} className="text-lg font-bold text-white hover:text-accent-green transition-colors">
                    {team.name}
                  </Link>
                  <p className="text-xs text-slate-500">{team.country}</p>
                </div>
                <div className="ml-auto flex overflow-hidden rounded-lg border border-white/8 bg-white/3">
                  {SEASONS.map((s) => (
                    <button key={s} onClick={() => setSeason(s)}
                      className={`px-3 py-1.5 text-xs font-semibold transition-colors ${season === s ? "bg-accent-green text-white" : "text-slate-400 hover:text-white"}`}
                    >
                      {seasonLabel(s)}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Bet settings ────────────────────────────────────────── */}
              <div className="mb-6 overflow-hidden rounded-2xl border border-white/8 bg-white/3">
                <div className="border-b border-white/8 px-5 py-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Bet Settings</p>
                </div>
                <div className="grid gap-6 p-5 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Strategy picker */}
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-semibold text-slate-400">Strategy</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.entries(STRATEGIES) as [Strategy, typeof STRATEGIES[Strategy]][]).map(([key, s]) => {
                        const Icon = s.icon;
                        const active = strategy === key;
                        return (
                          <button key={key} onClick={() => setStrategy(key)}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                              active
                                ? "border-accent-green/50 bg-accent-green/10 text-accent-green"
                                : "border-white/8 text-slate-400 hover:border-white/15 hover:text-white"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-semibold leading-tight">{s.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[11px] text-slate-600">{STRATEGIES[strategy].description}</p>
                  </div>

                  {/* Stake */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-400">Stake per game</label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-500">£</span>
                      <input type="number" min={1} step={1} value={betAmount}
                        onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-7 pr-3 text-right text-sm font-bold text-white outline-none transition focus:border-accent-green/50 focus:ring-2 focus:ring-accent-green/20"
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-600">
                      Total staked: £{stats ? (betAmount * stats.total).toFixed(2) : "—"}
                    </p>
                  </div>
                </div>

                {/* Odds status bar */}
                {fixtures && fixtures.length > 0 && (
                  <div className="border-t border-white/8 px-5 py-3">
                    {oddsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Loading bookmaker odds…
                      </div>
                    ) : oddsError ? (
                      <p className="text-xs text-red-400">{oddsError}</p>
                    ) : oddsMap ? (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-accent-green" />
                          <span>
                            Actual bookmaker odds loaded —{" "}
                            <span className="text-slate-300 font-semibold">{stats?.total ?? 0}/{fixtures.length} games</span> with odds
                            {stats?.skipped ? `, ${stats.skipped} excluded (no data)` : ""}
                            {stats?.avgOdds ? ` · avg ${stats.avgOdds}x` : ""}
                          </span>
                        </span>
                        <span className="text-slate-700">·</span>
                        <span className="text-slate-600">Domestic league only — cups &amp; European games excluded</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* ── Results ─────────────────────────────────────────────── */}
              {(fixturesLoading || oddsLoading) && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
                  </div>
                  <Skeleton className="h-44 rounded-2xl" />
                  <Skeleton className="h-64 rounded-2xl" />
                </div>
              )}

              {!fixturesLoading && !oddsLoading && fixtures && fixtures.length === 0 && (
                <div className="flex items-center justify-center rounded-2xl border border-white/8 bg-white/3 py-16 text-center">
                  <div>
                    <BarChart2 className="mx-auto mb-3 h-10 w-10 text-slate-700" />
                    <p className="font-semibold text-slate-300">No completed fixtures found</p>
                    <p className="mt-1 text-sm text-slate-500">Try a different season or team.</p>
                  </div>
                </div>
              )}

              {!fixturesLoading && !oddsLoading && stats && fixtures && (
                <div className="space-y-5">

                  {/* Summary cards */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatCard label="Total P&L" value={profitStr!}
                      sub={`${stats.total} games · £${betAmount}/game`} positive={pnlPositive} />
                    <StatCard label="ROI" value={roiStr!}
                      sub={`£${(betAmount * stats.total).toFixed(0)} total staked`} positive={stats.roi >= 0} />
                    <StatCard label={STRATEGIES[strategy].hitLabel} value={`${stats.hits} / ${stats.total}`}
                      sub={`${stats.strikeRate}% strike rate`} />
                    <StatCard label="Break-even Odds" value={`${stats.breakEvenOdds}x`}
                      sub={stats.avgOdds ? `Avg actual odds: ${stats.avgOdds}x` : "No odds data"}
                      positive={stats.avgOdds ? stats.avgOdds >= stats.breakEvenOdds : undefined} />
                  </div>

                  {/* Streak + home/away split */}
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">Best Run</p>
                      <p className="text-xl font-extrabold text-emerald-400">{stats.maxWinStreak} <span className="text-sm font-semibold text-slate-500">in a row</span></p>
                      <p className="mt-0.5 text-xs text-slate-600">Worst losing run: <span className="font-semibold text-red-400">{stats.maxLoseStreak}</span></p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">Home Games</p>
                      <p className={`text-xl font-extrabold tabular-nums ${stats.homePnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {stats.homePnL >= 0 ? "+" : ""}£{stats.homePnL.toFixed(2)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {stats.homeHits}/{stats.homeTotal} hits · {stats.homeTotal > 0 ? ((stats.homeHits / stats.homeTotal) * 100).toFixed(0) : 0}% strike rate
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">Away Games</p>
                      <p className={`text-xl font-extrabold tabular-nums ${stats.awayPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {stats.awayPnL >= 0 ? "+" : ""}£{stats.awayPnL.toFixed(2)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {stats.awayHits}/{stats.awayTotal} hits · {stats.awayTotal > 0 ? ((stats.awayHits / stats.awayTotal) * 100).toFixed(0) : 0}% strike rate
                      </p>
                    </div>
                  </div>

                  {/* P&L Chart */}
                  <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/3">
                    <div className="flex items-center justify-between border-b border-white/8 px-5 py-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Cumulative P&L</p>
                      <span className={`text-xs font-bold ${pnlPositive ? "text-emerald-400" : "text-red-400"}`}>{profitStr}</span>
                    </div>
                    <div className="p-4"><PnLChart data={stats.cumulativePnL} /></div>
                  </div>

                  {/* Disclaimer */}
                  <div className="flex items-start gap-2 rounded-xl border border-white/6 bg-white/2 px-4 py-3 text-xs text-slate-500">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600" />
                    <p>
                      Using actual pre-match bookmaker odds from API-Football.{" "}
                      <strong className="text-slate-400">{stats.total}</strong> of{" "}
                      <strong className="text-slate-400">{stats.totalGames}</strong> games have odds data ({coveredPct}% coverage).
                      {stats.skipped > 0 && <> <strong className="text-slate-400">{stats.skipped}</strong> game(s) excluded — no bookmaker data available.</>}
                      {" "}Break-even: <strong className="text-slate-400">{stats.breakEvenOdds}x</strong>.
                    </p>
                  </div>

                  {/* Game-by-game table */}
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
                            <th className="hidden px-3 py-2.5 text-center font-medium sm:table-cell">H/A</th>
                            <th className="px-3 py-2.5 text-center font-medium">Score</th>
                            <th className="px-3 py-2.5 text-center font-medium">Result</th>
                            <th className="px-3 py-2.5 text-center font-medium">Hit?</th>
                            <th className="px-3 py-2.5 text-right font-medium">Odds</th>
                            <th className="px-3 py-2.5 text-right font-medium">P&L</th>
                            <th className="px-4 py-2.5 text-right font-medium">Running</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {fixtures.map((f, idx) => {
                            const g = stats.games[idx];
                            if (!g) return null;
                            const date = new Date(f.date);
                            return (
                              <tr key={f.id} className={`transition-colors ${g.skipped ? "opacity-40" : `hover:bg-white/3 ${g.hit ? "border-l-2 border-l-emerald-500/30" : ""}`}`}>
                                <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                                  {date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="flex items-center gap-1.5">
                                    {f.homeTeam.logo && <div className="relative h-4 w-4 shrink-0"><Image src={f.homeTeam.logo} alt="" fill className="object-contain" sizes="16px" /></div>}
                                    <span className="truncate text-xs text-slate-300 max-w-[72px] sm:max-w-none">{f.homeTeam.name}</span>
                                    <span className="text-[10px] text-slate-600">vs</span>
                                    {f.awayTeam.logo && <div className="relative h-4 w-4 shrink-0"><Image src={f.awayTeam.logo} alt="" fill className="object-contain" sizes="16px" /></div>}
                                    <span className="truncate text-xs text-slate-300 max-w-[72px] sm:max-w-none">{f.awayTeam.name}</span>
                                  </div>
                                </td>
                                <td className="hidden px-3 py-2.5 text-center sm:table-cell">
                                  <span className={`text-[10px] font-bold ${f.isHome ? "text-slate-300" : "text-slate-500"}`}>{f.isHome ? "H" : "A"}</span>
                                </td>
                                <td className="px-3 py-2.5 text-center text-sm font-extrabold tabular-nums text-white whitespace-nowrap">
                                  {f.goals.for} – {f.goals.against}
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-extrabold ${RESULT_STYLES[f.result]}`}>{f.result}</span>
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  {g.skipped
                                    ? <span className="text-xs text-slate-700">—</span>
                                    : <span className={`text-sm font-bold ${g.hit ? "text-emerald-400" : "text-slate-700"}`}>{g.hit ? "✓" : "✗"}</span>}
                                </td>
                                <td className="px-3 py-2.5 text-right text-xs font-semibold tabular-nums text-slate-300 whitespace-nowrap">
                                  {g.oddsUsed !== null ? g.oddsUsed.toFixed(2) : <span className="text-slate-700">—</span>}
                                </td>
                                <td className={`px-3 py-2.5 text-right text-sm font-bold tabular-nums ${g.skipped ? "text-slate-700" : g.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                  {g.skipped ? "—" : `${g.pnl >= 0 ? "+" : ""}£${g.pnl.toFixed(2)}`}
                                </td>
                                <td className={`px-4 py-2.5 text-right text-sm font-extrabold tabular-nums ${g.running >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                  {g.running >= 0 ? "+" : ""}£{g.running.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {!team && (
            <div className="mt-16 text-center">
              <BarChart2 className="mx-auto mb-4 h-14 w-14 text-slate-800" />
              <p className="text-lg font-semibold text-slate-400">Search for a team to get started</p>
              <p className="mt-1 text-sm text-slate-600">
                Test strategies like "back to win every game" or "over 2.5 goals" across a full season.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
