"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Clock, TrendingUp, TrendingDown, Minus,
  Zap, Target, BarChart2, Shield,
} from "lucide-react";
import type { OddsEvent, Sport } from "@/data/sampleOdds";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TeamLogo from "@/components/TeamLogo";

interface Props { params: { id: string } }

// ── sport config ──────────────────────────────────────────────────────────────

const SPORT_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  football:          { label: "Football",     color: "text-emerald-400", bg: "bg-emerald-500/10" },
  basketball:        { label: "Basketball",   color: "text-orange-400",  bg: "bg-orange-500/10"  },
  tennis:            { label: "Tennis",       color: "text-amber-400",   bg: "bg-amber-500/10"   },
  american_football: { label: "NFL",          color: "text-blue-400",    bg: "bg-blue-500/10"    },
  cricket:           { label: "Cricket",      color: "text-pink-400",    bg: "bg-pink-500/10"    },
  nba:               { label: "NBA",          color: "text-orange-400",  bg: "bg-orange-500/10"  },
  afl:               { label: "AFL",          color: "text-yellow-400",  bg: "bg-yellow-500/10"  },
  baseball:          { label: "Baseball",     color: "text-sky-400",     bg: "bg-sky-500/10"     },
  formula1:          { label: "Formula 1",    color: "text-red-400",     bg: "bg-red-500/10"     },
  handball:          { label: "Handball",     color: "text-violet-400",  bg: "bg-violet-500/10"  },
  hockey:            { label: "Hockey",       color: "text-cyan-400",    bg: "bg-cyan-500/10"    },
  mma:               { label: "MMA",          color: "text-rose-400",    bg: "bg-rose-500/10"    },
  rugby:             { label: "Rugby",        color: "text-lime-400",    bg: "bg-lime-500/10"    },
  volleyball:        { label: "Volleyball",   color: "text-indigo-400",  bg: "bg-indigo-500/10"  },
  horse_racing:      { label: "Horse Racing", color: "text-teal-400",    bg: "bg-teal-500/10"    },
};

const STAT_LABEL: Record<Sport, { for: string; against: string }> = {
  football:          { for: "avg scored",  against: "avg conceded" },
  basketball:        { for: "pts scored",  against: "pts allowed"  },
  tennis:            { for: "sets won",    against: "sets lost"    },
  american_football: { for: "pts scored",  against: "pts allowed"  },
  cricket:           { for: "run rate",    against: "econ rate"    },
  nba:               { for: "pts scored",  against: "pts allowed"  },
  afl:               { for: "goals",       against: "goals against"},
  baseball:          { for: "runs scored", against: "runs allowed" },
  formula1:          { for: "fastest lap", against: "lap diff"     },
  handball:          { for: "goals",       against: "goals against"},
  hockey:            { for: "goals",       against: "goals against"},
  mma:               { for: "strikes",     against: "taken"        },
  rugby:             { for: "pts scored",  against: "pts allowed"  },
  volleyball:        { for: "sets won",    against: "sets lost"    },
  horse_racing:      { for: "wins",        against: "places"       },
};

// ── helpers ───────────────────────────────────────────────────────────────────

function getTopPick(event: OddsEvent) {
  return event.markets
    .flatMap((m) => m.options.filter((o) => o.pick))
    .sort((a, b) => b.probability - a.probability)[0] ?? null;
}

function getSignal(prob: number) {
  if (prob >= 70) return {
    label: "Strong Signal", short: "STRONG",
    color: "text-accent-green", bg: "bg-accent-green/10", border: "border-accent-green/30",
    barColor: "bg-accent-green", stripColor: "bg-accent-green",
  };
  if (prob >= 58) return {
    label: "Good Pick", short: "SIGNAL",
    color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30",
    barColor: "bg-blue-400", stripColor: "bg-blue-500",
  };
  return {
    label: "Watch", short: "WATCH",
    color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30",
    barColor: "bg-amber-400", stripColor: "bg-amber-500",
  };
}

function getEdge(event: OddsEvent, topPick: ReturnType<typeof getTopPick>): number | null {
  if (!topPick) return null;
  const market = event.markets.find((m) => m.options.some((o) => o === topPick));
  if (!market?.bestOdds) return null;
  return Math.round((topPick.probability - (1 / market.bestOdds) * 100) * 10) / 10;
}

function getMatchProbs(event: OddsEvent) {
  const m = event.markets.find((m) =>
    m.name.toLowerCase().includes("result") || m.name.toLowerCase().includes("winner")
  );
  if (!m) return null;
  const opts = m.options;
  if (opts.length === 3) return { home: opts[0], draw: opts[1], away: opts[2] };
  if (opts.length === 2) return { home: opts[0], draw: null,     away: opts[1] };
  return null;
}

function getFormScore(form: ("W" | "D" | "L")[]) {
  if (!form.length) return null;
  const pts = form.reduce((n, r) => n + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
  const max = form.length * 3;
  return { pts, max, pct: Math.round((pts / max) * 100) };
}

function getBestOdds(bks: OddsEvent["bookmakers"]) {
  return {
    home: Math.max(0, ...bks.map((b) => b.home)),
    away: Math.max(0, ...bks.map((b) => b.away)),
    draw: Math.max(0, ...bks.filter((b) => b.draw != null).map((b) => b.draw!)),
  };
}

function fuzzyMatch(a: string, b: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const an = norm(a), bn = norm(b);
  return an === bn || an.includes(bn) || bn.includes(an);
}

function formatKickoff(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return "In progress";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h < 1) return `in ${m}m`;
  if (h < 24) return `in ${h}h ${m}m`;
  return `in ${Math.floor(h / 24)}d ${h % 24}h`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── sub-components ────────────────────────────────────────────────────────────

function FormPill({ result }: { result: "W" | "D" | "L" }) {
  const cls =
    result === "W" ? "bg-emerald-500/15 text-emerald-400"
    : result === "D" ? "bg-bg-border text-slate-400"
    : "bg-red-500/15 text-red-400";
  return (
    <span className={`inline-flex h-6 w-6 items-center justify-center rounded text-[11px] font-bold ${cls}`}>
      {result}
    </span>
  );
}

function FormRow({ name, logo, stats, label }: {
  name: string; logo?: string;
  stats: OddsEvent["homeStats"];
  label: { for: string; against: string };
}) {
  const score = getFormScore(stats.form);
  const scoreColor = !score ? "text-slate-500"
    : score.pct >= 70 ? "text-emerald-400"
    : score.pct >= 40 ? "text-amber-400"
    : "text-red-400";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-bg-border bg-bg-base p-4">
      <div className="flex items-center gap-2">
        <TeamLogo logo={logo} name={name} size={24} className="rounded" />
        <span className="font-semibold text-white truncate">{name}</span>
        {score && (
          <span className={`ml-auto text-xs font-bold ${scoreColor}`}>
            {score.pts}/{score.max}pts
          </span>
        )}
      </div>
      <div className="flex gap-1">
        {stats.form.length > 0
          ? stats.form.map((r, i) => <FormPill key={i} result={r} />)
          : <span className="text-xs text-slate-600">No form data</span>
        }
      </div>
      <div className="flex gap-4 text-xs">
        <span>
          <span className="text-slate-500">{label.for}: </span>
          <span className="font-semibold text-emerald-400">{stats.avgScored.toFixed(2)}</span>
        </span>
        <span>
          <span className="text-slate-500">{label.against}: </span>
          <span className="font-semibold text-red-400">{stats.avgConceded.toFixed(2)}</span>
        </span>
      </div>
    </div>
  );
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-bg-border ${className}`} />;
}

function SectionLabel({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-slate-500" />
      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{children}</span>
      <div className="flex-1 border-t border-bg-border" />
    </div>
  );
}

// ── H2H types ─────────────────────────────────────────────────────────────────

interface H2HMatch {
  date: string;
  homeTeam: string;
  homeLogo: string;
  homeScore: number | null;
  awayTeam: string;
  awayLogo: string;
  awayScore: number | null;
  winner: "home" | "away" | "draw" | null;
  league: string;
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function PredictionDetailPage({ params }: Props) {
  const router = useRouter();
  const [event, setEvent]       = useState<OddsEvent | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch("/api/events?sport=football")
      .then((r) => r.json())
      .then((data: { events: OddsEvent[] }) => {
        const found = data.events?.find((e) => e.id === params.id);
        if (found) setEvent(found);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          <button
            onClick={() => router.back()}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-52" />
              <Skeleton className="h-36" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
              <Skeleton className="h-40" />
            </div>
          )}

          {!loading && notFound && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-bg-border bg-bg-card py-20 text-center">
              <span className="text-4xl">🔍</span>
              <p className="mt-3 text-sm font-semibold text-slate-200">Event not found</p>
              <p className="mt-1 text-xs text-slate-500">
                This fixture may have started or is no longer available.
              </p>
              <Link
                href="/"
                className="mt-5 rounded-lg bg-accent-green px-4 py-2 text-sm font-semibold text-white hover:bg-accent-green-dim"
              >
                View all predictions
              </Link>
            </div>
          )}

          {!loading && event && <EventDetail event={event} />}

        </div>
      </main>
      <Footer />
    </div>
  );
}

// ── EventDetail ───────────────────────────────────────────────────────────────

function EventDetail({ event }: { event: OddsEvent }) {
  const style     = SPORT_STYLES[event.sport] ?? SPORT_STYLES.football;
  const statLabel = STAT_LABEL[event.sport]   ?? { for: "scored", against: "conceded" };

  const topPick   = getTopPick(event);
  const signal    = topPick ? getSignal(topPick.probability) : null;
  const edge      = topPick ? getEdge(event, topPick) : null;
  const probs     = getMatchProbs(event);
  const best      = getBestOdds(event.bookmakers);
  const totalH2H  = event.h2h.homeWins + event.h2h.draws + event.h2h.awayWins;
  const hasDrawOdds = event.bookmakers.some((b) => b.draw != null);

  const [h2hMatches, setH2hMatches] = useState<H2HMatch[]>([]);
  const [h2hLoading, setH2hLoading] = useState(false);

  useEffect(() => {
    if (event.sport !== "football" || !event.homeTeamId || !event.awayTeamId) return;
    setH2hLoading(true);
    fetch(`/api/football/h2h?home=${event.homeTeamId}&away=${event.awayTeamId}&last=5`)
      .then((r) => r.json())
      .then((d: { matches: H2HMatch[] }) => setH2hMatches(d.matches ?? []))
      .catch(() => {})
      .finally(() => setH2hLoading(false));
  }, [event.homeTeamId, event.awayTeamId, event.sport]);

  const homeScore = getFormScore(event.homeStats.form);
  const awayScore = getFormScore(event.awayStats.form);

  // Best-odds bookmaker for the top pick (for the verdict card)
  const topMarket = topPick
    ? event.markets.find((m) => m.options.some((o) => o === topPick))
    : null;

  return (
    <div className="space-y-5">

      {/* ── Match Hero ──────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
        {signal && <div className={`h-1.5 w-full ${signal.stripColor}`} />}
        <div className="p-6">
          {/* League + time row */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${style.bg} ${style.color}`}>
                {style.label}
              </span>
              {event.leagueId ? (
                <Link
                  href={`/leagues/${event.leagueId}`}
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {event.leagueLogo && (
                    <div className="relative h-4 w-4 shrink-0">
                      <Image src={event.leagueLogo} alt="" fill className="object-contain" sizes="16px" />
                    </div>
                  )}
                  {event.league}
                </Link>
              ) : (
                <span className="text-sm text-slate-400">{event.league}</span>
              )}
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-300">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                {formatKickoff(event.commenceTime)}
              </div>
              <span className="text-xs text-slate-600">{formatDateTime(event.commenceTime)}</span>
            </div>
          </div>

          {/* Teams */}
          <div className="flex items-center gap-4">
            <TeamHero
              name={event.homeTeam}
              logo={event.homeLogo}
              sport={event.sport}
              side="home"
            />
            <div className="shrink-0 rounded-xl bg-bg-border px-4 py-2.5 text-sm font-bold text-slate-500">
              VS
            </div>
            <TeamHero
              name={event.awayTeam}
              logo={event.awayLogo}
              sport={event.sport}
              side="away"
            />
          </div>
        </div>
      </div>

      {/* ── Analyst Verdict ─────────────────────────────────────────────────── */}
      {topPick && signal && (
        <div className={`rounded-2xl border p-5 shadow-sm ${signal.border} ${signal.bg}`}>
          <SectionLabel icon={Target}>Analyst Verdict</SectionLabel>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            {/* Main pick */}
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider ${signal.color} ${signal.bg} ${signal.border}`}>
                  <Zap className="h-3 w-3" />
                  {signal.short}
                </span>
                {edge !== null && edge > 0 && (
                  <span className="rounded-md bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-400">
                    +{edge}% value
                  </span>
                )}
              </div>
              <div className="mb-1 text-sm text-slate-400">Our pick</div>
              <div className="text-2xl font-extrabold text-white">{topPick.label}</div>
              <div className={`text-4xl font-extrabold ${signal.color}`}>
                {topPick.probability}%
              </div>
              <div className="mt-0.5 text-xs text-slate-500">model confidence</div>
            </div>

            {/* Supporting stats */}
            <div className="flex flex-col gap-2.5 sm:w-56">
              {/* Best odds */}
              {topMarket && topMarket.bestOdds > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-bg-border bg-bg-card px-3 py-2.5">
                  <span className="text-xs text-slate-500">Best odds</span>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-white">{topMarket.bestOdds.toFixed(2)}</span>
                    <div className="text-[10px] text-slate-600">@ {topMarket.bestBookmaker}</div>
                  </div>
                </div>
              )}

              {/* Form comparison */}
              {homeScore && awayScore && (
                <div className="flex items-center justify-between rounded-lg border border-bg-border bg-bg-card px-3 py-2.5">
                  <span className="text-xs text-slate-500">Form (last 5)</span>
                  <div className="text-right text-xs font-bold">
                    <span className={homeScore.pct >= awayScore.pct ? "text-accent-green" : "text-slate-400"}>
                      {homeScore.pts}
                    </span>
                    <span className="text-slate-600"> – </span>
                    <span className={awayScore.pct >= homeScore.pct ? "text-accent-green" : "text-slate-400"}>
                      {awayScore.pts}
                    </span>
                    <span className="ml-1 font-normal text-slate-600">pts</span>
                  </div>
                </div>
              )}

              {/* H2H summary (live) */}
              {h2hMatches.length > 0 && (() => {
                const hw = h2hMatches.filter((m) => {
                  const isHome = fuzzyMatch(m.homeTeam, event.homeTeam);
                  return isHome ? m.winner === "home" : m.winner === "away";
                }).length;
                const draws = h2hMatches.filter((m) => m.winner === "draw").length;
                const aw = h2hMatches.length - hw - draws;
                return (
                  <div className="flex items-center justify-between rounded-lg border border-bg-border bg-bg-card px-3 py-2.5">
                    <span className="text-xs text-slate-500">H2H (last {h2hMatches.length})</span>
                    <span className="text-xs font-bold text-white">
                      <span className="text-emerald-400">{hw}W</span>
                      {draws > 0 && <span className="text-slate-500"> {draws}D </span>}
                      <span className="text-red-400"> {aw}L</span>
                    </span>
                  </div>
                );
              })()}
              {h2hMatches.length === 0 && totalH2H > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-bg-border bg-bg-card px-3 py-2.5">
                  <span className="text-xs text-slate-500">H2H (last {totalH2H})</span>
                  <span className="text-xs font-bold text-white">
                    <span className="text-emerald-400">{event.h2h.homeWins}W</span>
                    {event.h2h.draws > 0 && <span className="text-slate-500"> {event.h2h.draws}D </span>}
                    <span className="text-red-400"> {event.h2h.awayWins}L</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Match Probabilities ──────────────────────────────────────────────── */}
      {probs && (
        <div className="rounded-2xl border border-bg-border bg-bg-card p-5 shadow-sm">
          <SectionLabel icon={BarChart2}>Match Probabilities</SectionLabel>

          {/* Segmented probability bar */}
          <div className="mb-3 flex h-3 overflow-hidden rounded-full">
            <div
              className={`h-full transition-all ${probs.home.pick ? "bg-accent-green" : "bg-slate-600"}`}
              style={{ width: `${probs.home.probability}%` }}
            />
            {probs.draw && (
              <div
                className={`h-full transition-all ${probs.draw.pick ? "bg-accent-green" : "bg-slate-700"}`}
                style={{ width: `${probs.draw.probability}%` }}
              />
            )}
            <div
              className={`h-full flex-1 transition-all ${probs.away.pick ? "bg-accent-green" : "bg-slate-500"}`}
            />
          </div>

          {/* Labels */}
          <div className="flex justify-between text-sm">
            <div className="flex flex-col items-start gap-0.5">
              <span className={`font-extrabold ${probs.home.pick ? "text-accent-green" : "text-white"}`}>
                {probs.home.probability}%
              </span>
              <span className="text-xs text-slate-500 truncate max-w-[100px]">{event.homeTeam}</span>
            </div>
            {probs.draw && (
              <div className="flex flex-col items-center gap-0.5">
                <span className={`font-extrabold ${probs.draw.pick ? "text-accent-green" : "text-slate-400"}`}>
                  {probs.draw.probability}%
                </span>
                <span className="text-xs text-slate-500">Draw</span>
              </div>
            )}
            <div className="flex flex-col items-end gap-0.5">
              <span className={`font-extrabold ${probs.away.pick ? "text-accent-green" : "text-white"}`}>
                {probs.away.probability}%
              </span>
              <span className="text-xs text-slate-500 truncate max-w-[100px] text-right">{event.awayTeam}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Form + H2H ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-bg-border bg-bg-card p-5 shadow-sm">
        <SectionLabel icon={TrendingUp}>Form & Head to Head</SectionLabel>

        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <FormRow
            name={event.homeTeam}
            logo={event.homeLogo}
            stats={event.homeStats}
            label={statLabel}
          />
          <FormRow
            name={event.awayTeam}
            logo={event.awayLogo}
            stats={event.awayStats}
            label={statLabel}
          />
        </div>

        {/* H2H — live match results */}
        <div className="rounded-xl border border-bg-border bg-bg-base p-4">
          <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-400">Recent meetings</span>
            {h2hMatches.length > 0 && (() => {
              const hw = h2hMatches.filter((m) => {
                const referenceIsHome = fuzzyMatch(m.homeTeam, event.homeTeam);
                return referenceIsHome ? m.winner === "home" : m.winner === "away";
              }).length;
              const draws = h2hMatches.filter((m) => m.winner === "draw").length;
              const aw = h2hMatches.length - hw - draws;
              return (
                <span className="flex items-center gap-2 text-[11px]">
                  <span className="font-bold text-emerald-400">{hw}W</span>
                  {draws > 0 && <span className="text-slate-500">{draws}D</span>}
                  <span className="font-bold text-red-400">{aw}W</span>
                </span>
              );
            })()}
          </div>

          {h2hLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 animate-pulse rounded-lg bg-bg-border" />
              ))}
            </div>
          )}

          {!h2hLoading && h2hMatches.length === 0 && (
            <p className="text-xs text-slate-600">
              {event.homeTeamId && event.awayTeamId
                ? "No recent H2H matches found."
                : "Team IDs not available for H2H lookup."}
            </p>
          )}

          {!h2hLoading && h2hMatches.length > 0 && (
            <div className="space-y-1.5">
              {h2hMatches.map((m, i) => {
                const referenceIsHome = fuzzyMatch(m.homeTeam, event.homeTeam);
                const referenceWon =
                  (referenceIsHome && m.winner === "home") ||
                  (!referenceIsHome && m.winner === "away");
                const isDraw = m.winner === "draw";
                const rowBg = referenceWon
                  ? "bg-emerald-500/5 border-emerald-500/15"
                  : isDraw
                  ? "bg-bg-border border-transparent"
                  : "bg-red-500/5 border-red-500/15";
                const scoreColor = referenceWon
                  ? "text-emerald-400"
                  : isDraw
                  ? "text-slate-400"
                  : "text-red-400";
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${rowBg}`}
                  >
                    <span className="w-16 shrink-0 text-slate-600">
                      {new Date(m.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
                    </span>
                    <span className="flex flex-1 items-center gap-1.5 truncate">
                      <TeamLogo logo={m.homeLogo} name={m.homeTeam} size={14} className="rounded shrink-0" />
                      <span className="truncate text-slate-300">{m.homeTeam}</span>
                    </span>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 font-extrabold tabular-nums ${scoreColor}`}>
                      {m.homeScore ?? "–"} – {m.awayScore ?? "–"}
                    </span>
                    <span className="flex flex-1 items-center justify-end gap-1.5 truncate">
                      <span className="truncate text-slate-300">{m.awayTeam}</span>
                      <TeamLogo logo={m.awayLogo} name={m.awayTeam} size={14} className="rounded shrink-0" />
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── All Markets ──────────────────────────────────────────────────────── */}
      {event.markets.length > 0 && (
        <div className="rounded-2xl border border-bg-border bg-bg-card p-5 shadow-sm">
          <SectionLabel icon={BarChart2}>Prediction Breakdown</SectionLabel>

          <div className="divide-y divide-bg-border">
            {event.markets.map((market, i) => (
              <div key={i} className="py-4 first:pt-0 last:pb-0">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{market.name}</span>
                  {market.bestOdds > 0 && (
                    <span className="text-xs text-slate-500">
                      Best: <span className="font-semibold text-white">{market.bestOdds.toFixed(2)}</span>
                      <span className="ml-1 text-slate-600">@ {market.bestBookmaker}</span>
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {market.options.map((opt, j) => {
                    const barColor = opt.pick
                      ? (signal?.barColor ?? "bg-accent-green")
                      : "bg-slate-700";
                    return (
                      <div key={j} className="flex items-center gap-3">
                        <span className={`w-32 shrink-0 truncate text-sm ${opt.pick ? "font-semibold text-white" : "text-slate-500"}`}>
                          {opt.label}
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-border">
                          <div
                            className={`h-full rounded-full transition-all ${barColor}`}
                            style={{ width: `${opt.probability}%` }}
                          />
                        </div>
                        <span className={`w-9 shrink-0 text-right text-sm font-bold tabular-nums ${opt.pick ? signal?.color ?? "text-accent-green" : "text-slate-500"}`}>
                          {opt.probability}%
                        </span>
                        {opt.pick ? (
                          <span className="w-10 shrink-0 rounded bg-accent-green/10 px-1.5 py-0.5 text-center text-[10px] font-bold text-accent-green ring-1 ring-accent-green/20">
                            PICK
                          </span>
                        ) : (
                          <span className="w-10 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Odds Comparison ──────────────────────────────────────────────────── */}
      {event.bookmakers.length > 0 && (
        <div className="rounded-2xl border border-bg-border bg-bg-card p-5 shadow-sm">
          <SectionLabel icon={Shield}>Odds Comparison</SectionLabel>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bg-border">
                  <th className="pb-3 pr-4 text-left text-xs font-semibold text-slate-500">Bookmaker</th>
                  <th className="pb-3 pr-4 text-right text-xs font-semibold text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <TeamLogo logo={event.homeLogo} name={event.homeTeam} size={14} className="rounded" />
                      {event.homeTeam}
                    </span>
                  </th>
                  {hasDrawOdds && (
                    <th className="pb-3 pr-4 text-right text-xs font-semibold text-slate-500">Draw</th>
                  )}
                  <th className="pb-3 text-right text-xs font-semibold text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      {event.awayTeam}
                      <TeamLogo logo={event.awayLogo} name={event.awayTeam} size={14} className="rounded" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border">
                {event.bookmakers.map((bk) => (
                  <tr key={bk.name} className="hover:bg-bg-surface transition-colors">
                    <td className="py-3 pr-4 text-slate-400">{bk.name}</td>
                    <td className={`py-3 pr-4 text-right font-bold tabular-nums ${bk.home === best.home && best.home > 0 ? "text-accent-green" : "text-white"}`}>
                      {bk.home.toFixed(2)}
                    </td>
                    {hasDrawOdds && (
                      <td className={`py-3 pr-4 text-right font-bold tabular-nums ${bk.draw != null && bk.draw === best.draw && best.draw > 0 ? "text-accent-green" : "text-slate-400"}`}>
                        {bk.draw != null ? bk.draw.toFixed(2) : "—"}
                      </td>
                    )}
                    <td className={`py-3 text-right font-bold tabular-nums ${bk.away === best.away && best.away > 0 ? "text-accent-green" : "text-white"}`}>
                      {bk.away.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Best odds summary row */}
              <tfoot>
                <tr className="border-t-2 border-bg-border">
                  <td className="pt-3 text-xs font-semibold text-slate-500">Best available</td>
                  <td className="pt-3 pr-4 text-right text-sm font-extrabold tabular-nums text-accent-green">
                    {best.home > 0 ? best.home.toFixed(2) : "—"}
                  </td>
                  {hasDrawOdds && (
                    <td className="pt-3 pr-4 text-right text-sm font-extrabold tabular-nums text-accent-green">
                      {best.draw > 0 ? best.draw.toFixed(2) : "—"}
                    </td>
                  )}
                  <td className="pt-3 text-right text-sm font-extrabold tabular-nums text-accent-green">
                    {best.away > 0 ? best.away.toFixed(2) : "—"}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Team deep-dives (football) ──────────────────────────────────────── */}
      {event.sport === "football" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { name: event.homeTeam, logo: event.homeLogo },
            { name: event.awayTeam, logo: event.awayLogo },
          ].map(({ name, logo }) => (
            <Link
              key={name}
              href={`/teams/${encodeURIComponent(name)}`}
              className="flex items-center gap-3 rounded-xl border border-bg-border bg-bg-card px-4 py-3.5 text-sm font-semibold text-slate-400 shadow-sm transition-all hover:border-accent-green/30 hover:text-accent-green"
            >
              {logo && (
                <div className="relative h-6 w-6 shrink-0">
                  <Image src={logo} alt="" fill className="object-contain" sizes="24px" />
                </div>
              )}
              <span className="flex-1">{name}</span>
              <span className="text-xs text-slate-600">View full stats →</span>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}

// ── TeamHero (large logo + name in the match card) ────────────────────────────

function TeamHero({ name, logo, sport, side }: {
  name: string; logo?: string; sport: string; side: "home" | "away";
}) {
  const content = (
    <>
      <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-bg-border bg-bg-base p-2 shadow-sm">
        {logo ? (
          <Image src={logo} alt={name} fill className="object-contain p-1" sizes="96px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-black text-slate-700">
            {name.slice(0, 1)}
          </div>
        )}
      </div>
      <span className={`mt-3 text-center text-sm font-extrabold leading-tight text-white sm:text-base ${side === "home" ? "sm:text-left" : "sm:text-right"}`}>
        {name}
      </span>
    </>
  );

  if (sport === "football") {
    return (
      <Link
        href={`/teams/${encodeURIComponent(name)}`}
        className="group flex flex-1 flex-col items-center gap-0 rounded-xl p-3 transition-colors hover:bg-bg-border"
      >
        {content}
        <span className="mt-1 text-[11px] text-slate-600 opacity-0 transition-opacity group-hover:opacity-100">
          View team →
        </span>
      </Link>
    );
  }

  return <div className="flex flex-1 flex-col items-center rounded-xl p-3">{content}</div>;
}
