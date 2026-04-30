"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, User, Activity, Target, Shield, Zap } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TeamLogo from "@/components/TeamLogo";

// ── season helpers ────────────────────────────────────────────────────────────

const CURRENT_SEASON = (() => {
  const now = new Date();
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
})();
const SEASONS = [CURRENT_SEASON, CURRENT_SEASON - 1, CURRENT_SEASON - 2];
function seasonLabel(s: number) { return `${s}/${String(s + 1).slice(2)}`; }

// ── types ─────────────────────────────────────────────────────────────────────

interface PlayerStats {
  team:     { id: number; name: string; logo: string };
  league:   { id: number; name: string; logo: string; country: string; season: number };
  games:    { appearences: number | null; lineups: number | null; minutes: number | null; position: string; rating: string | null };
  goals:    { total: number | null; assists: number | null; conceded: number | null; saves: number | null };
  shots:    { total: number | null; on: number | null };
  passes:   { total: number | null; key: number | null; accuracy: string | null };
  tackles:  { total: number | null; blocks: number | null; interceptions: number | null };
  duels:    { total: number | null; won: number | null };
  dribbles: { attempts: number | null; success: number | null };
  cards:    { yellow: number; red: number };
}

interface PlayerData {
  player: {
    id: number; name: string; firstname: string; lastname: string;
    age: number; nationality: string; height: string | null; weight: string | null;
    photo: string; injured: boolean;
  };
  statistics: PlayerStats[];
}

// ── stat helpers ──────────────────────────────────────────────────────────────

function pct(num: number | null, den: number | null): number | null {
  if (num === null || den === null || den === 0) return null;
  return Math.round((num / den) * 100);
}

function per90(value: number | null, minutes: number | null): string | null {
  if (value === null || !minutes) return null;
  return ((value / minutes) * 90).toFixed(2);
}

function sumStat<K extends keyof PlayerStats>(
  stats: PlayerStats[], key: K, sub: keyof PlayerStats[K]
): number | null {
  let total = 0;
  let any = false;
  for (const s of stats) {
    const val = (s[key] as Record<string, number | null>)[sub as string];
    if (val != null) { total += val; any = true; }
  }
  return any ? total : null;
}

function avgRating(stats: PlayerStats[]): string | null {
  const rated = stats.filter(s => s.games.rating);
  if (!rated.length) return null;
  const avg = rated.reduce((sum, s) => sum + parseFloat(s.games.rating!), 0) / rated.length;
  return avg.toFixed(1);
}

// ── sub-components ────────────────────────────────────────────────────────────

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-bg-border ${className}`} />;
}

function StatBar({ label, value, max, suffix = "", highlight = false }: {
  label: string; value: number | null; max: number; suffix?: string; highlight?: boolean;
}) {
  if (value === null) return null;
  const pctFill = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="w-36 shrink-0 text-sm text-slate-400">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-border">
        <div
          className={`h-full rounded-full transition-all ${highlight ? "bg-accent-green" : "bg-slate-500"}`}
          style={{ width: `${pctFill}%` }}
        />
      </div>
      <span className={`w-14 shrink-0 text-right text-sm font-bold tabular-nums ${highlight ? "text-accent-green" : "text-white"}`}>
        {value}{suffix}
      </span>
    </div>
  );
}

function PctBar({ label, value, highlight = false }: { label: string; value: number | null; highlight?: boolean }) {
  return <StatBar label={label} value={value} max={100} suffix="%" highlight={highlight} />;
}

function BigStat({ label, value, sub }: { label: string; value: string | number | null; sub?: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-bg-border bg-bg-card px-4 py-4 text-center shadow-sm">
      <span className="text-2xl font-extrabold text-white">{value ?? "—"}</span>
      <span className="mt-0.5 text-[11px] text-slate-500">{label}</span>
      {sub && <span className="text-[10px] text-slate-600">{sub}</span>}
    </div>
  );
}

function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-slate-500" />
      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{children}</span>
      <div className="flex-1 border-t border-bg-border" />
    </div>
  );
}

// ── position-aware stat sections ──────────────────────────────────────────────

function PositionStats({ stats, position, minutes }: {
  stats: PlayerStats[]; position: string; minutes: number | null;
}) {
  const isGK  = position === "Goalkeeper";
  const isDef = position === "Defender";
  const isMid = position === "Midfielder";

  const goals      = sumStat(stats, "goals", "total");
  const assists    = sumStat(stats, "goals", "assists");
  const saves      = sumStat(stats, "goals", "saves");
  const conceded   = sumStat(stats, "goals", "conceded");
  const shotsTotal = sumStat(stats, "shots", "total");
  const shotsOn    = sumStat(stats, "shots", "on");
  const keyPasses  = sumStat(stats, "passes", "key");
  const passAcc    = stats[0]?.passes.accuracy ? parseFloat(stats[0].passes.accuracy) : null;
  const tackles    = sumStat(stats, "tackles", "total");
  const blocks     = sumStat(stats, "tackles", "blocks");
  const inters     = sumStat(stats, "tackles", "interceptions");
  const duelsTotal = sumStat(stats, "duels", "total");
  const duelsWon   = sumStat(stats, "duels", "won");
  const dribAtts   = sumStat(stats, "dribbles", "attempts");
  const dribSucc   = sumStat(stats, "dribbles", "success");

  const shotAcc  = pct(shotsOn, shotsTotal);
  const duelWin  = pct(duelsWon, duelsTotal);
  const dribSuccPct = pct(dribSucc, dribAtts);
  const savePct  = pct(saves, saves !== null && conceded !== null ? saves + conceded : null);

  return (
    <div className="space-y-8">
      {/* Goalkeeper */}
      {isGK && (
        <div>
          <SectionTitle icon={Shield}>Shot Stopping</SectionTitle>
          <div className="space-y-0.5">
            <StatBar label="Saves" value={saves} max={200} highlight />
            <PctBar  label="Save %" value={savePct} highlight />
            <StatBar label="Goals Conceded" value={conceded} max={100} />
            <StatBar label="Tackles" value={tackles} max={150} />
            <StatBar label="Blocks" value={blocks} max={60} />
          </div>
        </div>
      )}

      {/* Defender */}
      {isDef && (
        <>
          <div>
            <SectionTitle icon={Shield}>Defensive</SectionTitle>
            <div className="space-y-0.5">
              <StatBar label="Tackles" value={tackles} max={200} highlight />
              <StatBar label="Interceptions" value={inters} max={100} highlight />
              <StatBar label="Blocks" value={blocks} max={60} />
              <PctBar  label="Duel Win %" value={duelWin} />
            </div>
          </div>
          <div>
            <SectionTitle icon={Activity}>Passing</SectionTitle>
            <div className="space-y-0.5">
              <StatBar label="Key Passes" value={keyPasses} max={80} />
              <PctBar  label="Pass Accuracy" value={passAcc} />
            </div>
          </div>
        </>
      )}

      {/* Midfielder */}
      {isMid && (
        <>
          <div>
            <SectionTitle icon={Activity}>Creation</SectionTitle>
            <div className="space-y-0.5">
              <StatBar label="Key Passes" value={keyPasses} max={120} highlight />
              <PctBar  label="Pass Accuracy" value={passAcc} highlight />
              <StatBar label="Goals" value={goals} max={30} />
              <StatBar label="Assists" value={assists} max={20} />
            </div>
          </div>
          <div>
            <SectionTitle icon={Zap}>Ball Carrying</SectionTitle>
            <div className="space-y-0.5">
              <StatBar label="Dribble Attempts" value={dribAtts} max={150} />
              <PctBar  label="Dribble Success %" value={dribSuccPct} />
              <PctBar  label="Duel Win %" value={duelWin} />
            </div>
          </div>
        </>
      )}

      {/* Attacker / default */}
      {!isGK && !isDef && !isMid && (
        <>
          <div>
            <SectionTitle icon={Target}>Attacking</SectionTitle>
            <div className="space-y-0.5">
              <StatBar label="Goals" value={goals} max={40} highlight />
              <StatBar label="Assists" value={assists} max={25} highlight />
              <StatBar label="Shots Total" value={shotsTotal} max={200} />
              <PctBar  label="Shot Accuracy" value={shotAcc} />
            </div>
          </div>
          <div>
            <SectionTitle icon={Zap}>Ball Carrying</SectionTitle>
            <div className="space-y-0.5">
              <StatBar label="Key Passes" value={keyPasses} max={80} />
              <PctBar  label="Dribble Success %" value={dribSuccPct} />
              <PctBar  label="Duel Win %" value={duelWin} />
            </div>
          </div>
        </>
      )}

      {/* Per-90 highlights (outfield only) */}
      {!isGK && minutes && minutes > 90 && (goals !== null || assists !== null) && (
        <div>
          <SectionTitle icon={Activity}>Per 90 Minutes</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {goals !== null && (
              <div className="rounded-xl border border-bg-border bg-bg-card p-3 text-center">
                <div className="text-lg font-extrabold text-white">{per90(goals, minutes)}</div>
                <div className="text-[10px] text-slate-500">Goals/90</div>
              </div>
            )}
            {assists !== null && (
              <div className="rounded-xl border border-bg-border bg-bg-card p-3 text-center">
                <div className="text-lg font-extrabold text-white">{per90(assists, minutes)}</div>
                <div className="text-[10px] text-slate-500">Assists/90</div>
              </div>
            )}
            {keyPasses !== null && (
              <div className="rounded-xl border border-bg-border bg-bg-card p-3 text-center">
                <div className="text-lg font-extrabold text-white">{per90(keyPasses, minutes)}</div>
                <div className="text-[10px] text-slate-500">Key Passes/90</div>
              </div>
            )}
            {shotsTotal !== null && (
              <div className="rounded-xl border border-bg-border bg-bg-card p-3 text-center">
                <div className="text-lg font-extrabold text-white">{per90(shotsTotal, minutes)}</div>
                <div className="text-[10px] text-slate-500">Shots/90</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Discipline — always shown */}
      <div>
        <SectionTitle icon={Shield}>Discipline</SectionTitle>
        <div className="space-y-0.5">
          <StatBar label="Yellow Cards" value={sumStat(stats, "cards", "yellow")} max={15} />
          <StatBar label="Red Cards" value={sumStat(stats, "cards", "red")} max={5} />
        </div>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function AthletePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData]           = useState<PlayerData | null>(null);
  const [activeSeason, setActiveSeason] = useState<number>(CURRENT_SEASON);
  const [loading, setLoading]     = useState(true);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [notFound, setNotFound]   = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  // Initial load — let API decide season
  useEffect(() => {
    fetch(`/api/football/player?id=${params.id}`)
      .then(async (r) => {
        if (r.status === 429) { setRateLimited(true); return null; }
        return r.ok ? r.json() : null;
      })
      .then((json) => {
        if (!json) { if (!rateLimited) setNotFound(true); return; }
        if (json.error) { setNotFound(true); return; }
        setData(json.player);
        if (json.season) setActiveSeason(json.season);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Season-switch load
  function loadSeason(s: number) {
    if (s === activeSeason || seasonLoading) return;
    setActiveSeason(s);
    setSeasonLoading(true);
    fetch(`/api/football/player?id=${params.id}&season=${s}`)
      .then(async (r) => {
        if (r.status === 429) return null;
        return r.ok ? r.json() : null;
      })
      .then((json) => {
        if (json?.player) setData(json.player);
      })
      .catch(() => {})
      .finally(() => setSeasonLoading(false));
  }

  const primaryStats = data?.statistics?.[0] ?? null;
  const teamName     = primaryStats?.team?.name ?? "";
  const position     = primaryStats?.games.position ?? "";
  const isGK         = position === "Goalkeeper";

  // Aggregate across all competitions for the selected season
  const stats = data?.statistics ?? [];
  const totalMins = stats.reduce((n, s) => n + (s.games.minutes ?? 0), 0) || null;
  const totalApps = stats.reduce((n, s) => n + (s.games.appearences ?? 0), 0) || null;
  const rating    = avgRating(stats);

  const goals   = sumStat(stats, "goals", "total");
  const assists  = sumStat(stats, "goals", "assists");
  const saves    = sumStat(stats, "goals", "saves");

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          <button
            onClick={() => router.back()}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {teamName || "Back"}
          </button>

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-5">
              <div className="flex gap-6">
                <Skeleton className="h-36 w-36 rounded-2xl" />
                <div className="flex-1 space-y-3 pt-2">
                  <Skeleton className="h-8 w-56" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-44" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          )}

          {/* Error states */}
          {!loading && rateLimited && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-bg-border bg-bg-card py-20 text-center shadow-sm">
              <User className="mb-3 h-12 w-12 text-slate-700" />
              <p className="font-semibold text-slate-200">Too many requests</p>
              <p className="mt-1 text-sm text-slate-500">The data API is busy — please wait a moment and refresh.</p>
              <button onClick={() => window.location.reload()} className="mt-4 text-sm font-semibold text-accent-green hover:underline">Refresh</button>
            </div>
          )}
          {!loading && notFound && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-bg-border bg-bg-card py-20 text-center shadow-sm">
              <User className="mb-3 h-12 w-12 text-slate-700" />
              <p className="font-semibold text-slate-200">Player not found</p>
              <p className="mt-1 text-sm text-slate-500">This player could not be found in the database.</p>
              <Link href="/" className="mt-4 text-sm font-semibold text-accent-green hover:underline">← Back to predictions</Link>
            </div>
          )}

          {!loading && data && (
            <div className="space-y-6">

              {/* ── Hero ──────────────────────────────────────────────── */}
              <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                <div className="h-1.5 w-full bg-emerald-200" />
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-start gap-6">

                    {/* Photo */}
                    <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-2xl bg-bg-border shadow-sm">
                      {data.player.photo ? (
                        <Image src={data.player.photo} alt={data.player.name} fill className="object-cover" sizes="144px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <User className="h-16 w-16 text-slate-600" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {/* Badges */}
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {position && (
                          <span className="rounded-md bg-accent-green/10 px-2.5 py-1 text-xs font-bold text-accent-green">
                            {position}
                          </span>
                        )}
                        {primaryStats && (
                          <Link href={`/teams/${encodeURIComponent(teamName)}`} className="flex items-center gap-1.5 rounded-md border border-bg-border px-2.5 py-1 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
                            <TeamLogo logo={primaryStats.team.logo} name={teamName} size={14} className="rounded" />
                            {teamName}
                          </Link>
                        )}
                        {primaryStats?.league && (
                          <Link href={`/leagues/${primaryStats.league.id}`} className="flex items-center gap-1.5 rounded-md border border-bg-border px-2.5 py-1 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
                            {primaryStats.league.logo && (
                              <div className="relative h-3.5 w-3.5 shrink-0">
                                <Image src={primaryStats.league.logo} alt="" fill className="object-contain" sizes="14px" />
                              </div>
                            )}
                            {primaryStats.league.name}
                          </Link>
                        )}
                        {data.player.injured && (
                          <span className="rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-400">Injured</span>
                        )}
                      </div>

                      <h1 className="text-3xl font-extrabold text-white sm:text-4xl">{data.player.name}</h1>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span>{data.player.nationality}</span>
                        <span>·</span>
                        <span>Age {data.player.age}</span>
                        {data.player.height && <><span>·</span><span>{data.player.height}</span></>}
                        {data.player.weight && <><span>·</span><span>{data.player.weight}</span></>}
                      </div>

                      {rating && (
                        <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-accent-green/30 bg-accent-green/5 px-4 py-2">
                          <span className="text-2xl font-extrabold text-accent-green">{rating}</span>
                          <div>
                            <div className="text-xs font-semibold text-white">Avg Rating</div>
                            <div className="text-[10px] text-slate-500">{seasonLabel(activeSeason)}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Season selector */}
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-slate-500">Season</span>
                      <div className="flex rounded-lg border border-bg-border bg-bg-base overflow-hidden">
                        {SEASONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => loadSeason(s)}
                            disabled={seasonLoading}
                            className={`px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                              activeSeason === s
                                ? "bg-accent-green text-white"
                                : "text-slate-400 hover:text-white hover:bg-bg-border"
                            }`}
                          >
                            {seasonLabel(s)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Key metrics ──────────────────────────────────────── */}
              <div className={`grid gap-3 ${seasonLoading ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  <BigStat label="Appearances" value={totalApps} />
                  <BigStat
                    label="Minutes"
                    value={totalMins ? `${totalMins.toLocaleString()}'` : null}
                  />
                  {isGK ? (
                    <>
                      <BigStat label="Saves" value={saves} />
                      <BigStat label="Conceded" value={sumStat(stats, "goals", "conceded")} />
                    </>
                  ) : (
                    <>
                      <BigStat label="Goals" value={goals} sub={totalMins ? `${per90(goals, totalMins)}/90` : undefined} />
                      <BigStat label="Assists" value={assists} sub={totalMins ? `${per90(assists, totalMins)}/90` : undefined} />
                    </>
                  )}
                  <BigStat label="Yellow Cards" value={sumStat(stats, "cards", "yellow")} />
                  <BigStat label="Red Cards" value={sumStat(stats, "cards", "red")} />
                </div>
              </div>

              {/* ── Main content: stat bars + competition table ───────── */}
              <div className={`grid gap-6 lg:grid-cols-5 ${seasonLoading ? "opacity-50 pointer-events-none" : ""}`}>

                {/* Stat bars — 3/5 width on desktop */}
                <div className="lg:col-span-3 rounded-2xl border border-bg-border bg-bg-card p-5 shadow-sm">
                  <PositionStats stats={stats} position={position} minutes={totalMins} />
                </div>

                {/* Competition breakdown — 2/5 width on desktop */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Per-competition table */}
                  <div className="rounded-2xl border border-bg-border bg-bg-card shadow-sm overflow-hidden">
                    <div className="border-b border-bg-border px-5 py-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">By Competition</p>
                    </div>
                    {stats.length === 0 ? (
                      <div className="flex items-center justify-center py-10">
                        <p className="text-sm text-slate-500">No stats for {seasonLabel(activeSeason)}</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-bg-border">
                        {stats.map((s, i) => (
                          <Link
                            key={i}
                            href={`/leagues/${s.league.id}`}
                            className="flex items-center gap-3 px-5 py-3.5 hover:bg-bg-border transition-colors"
                          >
                            {s.league.logo ? (
                              <div className="relative h-6 w-6 shrink-0">
                                <Image src={s.league.logo} alt="" fill className="object-contain" sizes="24px" />
                              </div>
                            ) : (
                              <div className="h-6 w-6 shrink-0 rounded bg-bg-border" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-white">{s.league.name}</p>
                              <p className="text-[10px] text-slate-500">{s.games.appearences ?? 0} apps</p>
                            </div>
                            <div className="shrink-0 text-right">
                              {isGK ? (
                                <p className="text-xs font-bold text-white">{s.goals.saves ?? 0} saves</p>
                              ) : (
                                <p className="text-xs font-bold text-white">
                                  {s.goals.total ?? 0}G {s.goals.assists ?? 0}A
                                </p>
                              )}
                              {s.games.rating && (
                                <p className="text-[10px] text-accent-green">{parseFloat(s.games.rating).toFixed(1)} ★</p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quick links */}
                  {primaryStats && (
                    <div className="rounded-2xl border border-bg-border bg-bg-card shadow-sm overflow-hidden">
                      <div className="border-b border-bg-border px-5 py-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Quick Links</p>
                      </div>
                      <div className="divide-y divide-bg-border">
                        <Link
                          href={`/teams/${encodeURIComponent(teamName)}`}
                          className="flex items-center gap-3 px-5 py-3.5 hover:bg-bg-border transition-colors group"
                        >
                          <TeamLogo logo={primaryStats.team.logo} name={teamName} size={28} className="rounded-lg shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white group-hover:text-accent-green">{teamName}</p>
                            <p className="text-[10px] text-slate-500">View team page →</p>
                          </div>
                        </Link>
                        {primaryStats.league && (
                          <Link
                            href={`/leagues/${primaryStats.league.id}`}
                            className="flex items-center gap-3 px-5 py-3.5 hover:bg-bg-border transition-colors group"
                          >
                            <div className="relative h-7 w-7 shrink-0">
                              {primaryStats.league.logo ? (
                                <Image src={primaryStats.league.logo} alt="" fill className="object-contain" sizes="28px" />
                              ) : (
                                <div className="h-7 w-7 rounded bg-bg-border" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-white group-hover:text-accent-green">{primaryStats.league.name}</p>
                              <p className="text-[10px] text-slate-500">View league page →</p>
                            </div>
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
