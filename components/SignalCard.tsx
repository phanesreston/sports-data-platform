"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, Minus, Zap, ArrowRight } from "lucide-react";
import type { OddsEvent } from "@/data/sampleOdds";
import TeamLogo from "@/components/TeamLogo";

function getTopPick(event: OddsEvent) {
  return event.markets
    .flatMap((m) => m.options.filter((o) => o.pick))
    .sort((a, b) => b.probability - a.probability)[0] ?? null;
}

function getSignal(prob: number) {
  if (prob >= 70) return { label: "Strong Signal", short: "STRONG", color: "text-accent-green", bg: "bg-accent-green/10", border: "border-accent-green/30" };
  if (prob >= 58) return { label: "Good Pick",    short: "SIGNAL",  color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/30" };
  return               { label: "Watch",          short: "WATCH",   color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/30" };
}

function getEdge(event: OddsEvent, topPick: ReturnType<typeof getTopPick>): number | null {
  if (!topPick) return null;
  const market = event.markets.find((m) => m.options.some((o) => o === topPick));
  if (!market?.bestOdds) return null;
  const implied = (1 / market.bestOdds) * 100;
  return Math.round((topPick.probability - implied) * 10) / 10;
}

function getMatchProbabilities(event: OddsEvent) {
  const matchMarket = event.markets.find((m) =>
    m.name.toLowerCase().includes("result") || m.name.toLowerCase().includes("winner")
  );
  if (!matchMarket) return null;
  const opts = matchMarket.options;
  if (opts.length === 3) {
    return { home: opts[0].probability, draw: opts[1].probability, away: opts[2].probability };
  }
  if (opts.length === 2) {
    return { home: opts[0].probability, draw: null, away: opts[1].probability };
  }
  return null;
}

function FormIcon({ result }: { result: "W" | "D" | "L" }) {
  if (result === "W") return <TrendingUp className="h-3 w-3 text-emerald-400" />;
  if (result === "L") return <TrendingDown className="h-3 w-3 text-red-400" />;
  return <Minus className="h-3 w-3 text-slate-600" />;
}

function FormScore({ form }: { form: ("W" | "D" | "L")[] }) {
  const pts = form.reduce((n, r) => n + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
  const max = form.length * 3;
  const pct = Math.round((pts / max) * 100);
  const color = pct >= 70 ? "text-emerald-400" : pct >= 40 ? "text-amber-400" : "text-red-400";
  return (
    <span className={`text-xs font-bold ${color}`}>{pts}/{max}pts</span>
  );
}

export default function SignalCard({ event }: { event: OddsEvent }) {
  const router = useRouter();
  const topPick = getTopPick(event);
  if (!topPick) return null;

  const signal = getSignal(topPick.probability);
  const edge = getEdge(event, topPick);
  const probs = getMatchProbabilities(event);
  const isFootball = event.sport === "football";

  const homeTeamEl = isFootball ? (
    <Link
      href={`/teams/${encodeURIComponent(event.homeTeam)}`}
      onClick={(e) => e.stopPropagation()}
      className="group/team flex flex-col items-center gap-2 text-center"
    >
      <TeamLogo logo={event.homeLogo} name={event.homeTeam} size={52} className="rounded-xl" />
      <span className="text-sm font-bold text-white group-hover/team:text-accent-green">{event.homeTeam}</span>
      <div className="flex items-center gap-0.5">
        {event.homeStats.form.map((r, i) => <FormIcon key={i} result={r} />)}
      </div>
      <FormScore form={event.homeStats.form} />
    </Link>
  ) : (
    <div className="flex flex-col items-center gap-2 text-center">
      <TeamLogo logo={event.homeLogo} name={event.homeTeam} size={52} className="rounded-xl" />
      <span className="text-sm font-bold text-white">{event.homeTeam}</span>
      <div className="flex items-center gap-0.5">
        {event.homeStats.form.map((r, i) => <FormIcon key={i} result={r} />)}
      </div>
      <FormScore form={event.homeStats.form} />
    </div>
  );

  const awayTeamEl = isFootball ? (
    <Link
      href={`/teams/${encodeURIComponent(event.awayTeam)}`}
      onClick={(e) => e.stopPropagation()}
      className="group/team flex flex-col items-center gap-2 text-center"
    >
      <TeamLogo logo={event.awayLogo} name={event.awayTeam} size={52} className="rounded-xl" />
      <span className="text-sm font-bold text-white group-hover/team:text-accent-green">{event.awayTeam}</span>
      <div className="flex items-center gap-0.5">
        {event.awayStats.form.map((r, i) => <FormIcon key={i} result={r} />)}
      </div>
      <FormScore form={event.awayStats.form} />
    </Link>
  ) : (
    <div className="flex flex-col items-center gap-2 text-center">
      <TeamLogo logo={event.awayLogo} name={event.awayTeam} size={52} className="rounded-xl" />
      <span className="text-sm font-bold text-white">{event.awayTeam}</span>
      <div className="flex items-center gap-0.5">
        {event.awayStats.form.map((r, i) => <FormIcon key={i} result={r} />)}
      </div>
      <FormScore form={event.awayStats.form} />
    </div>
  );

  return (
    <article
      onClick={() => router.push(`/predictions/${event.id}`)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm transition-all hover:border-accent-green/30 hover:shadow-accent-green/5 hover:shadow-lg"
    >
      {/* Signal accent bar */}
      <div className={`h-1 w-full ${topPick.probability >= 70 ? "bg-accent-green" : topPick.probability >= 58 ? "bg-blue-500" : "bg-amber-500"}`} />

      <div className="p-5">
        {/* Header row */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider ${signal.color} ${signal.bg} ${signal.border}`}>
              <Zap className="h-3 w-3" />
              {signal.short}
            </span>
            {event.leagueId ? (
              <Link
                href={`/leagues/${event.leagueId}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300"
              >
                {event.leagueLogo && (
                  <div className="relative h-3.5 w-3.5">
                    <Image src={event.leagueLogo} alt="" fill className="object-contain" sizes="14px" />
                  </div>
                )}
                {event.league}
              </Link>
            ) : (
              <span className="text-xs text-slate-500">{event.league}</span>
            )}
          </div>
          {edge !== null && edge > 0 && (
            <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-400">
              +{edge}% edge
            </span>
          )}
        </div>

        {/* Teams */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex-1">{homeTeamEl}</div>
          <div className="flex shrink-0 flex-col items-center gap-1">
            <span className="rounded-lg bg-bg-border px-3 py-1.5 text-xs font-bold text-slate-500">VS</span>
            <span className="text-[10px] text-slate-600">last 5</span>
          </div>
          <div className="flex-1">{awayTeamEl}</div>
        </div>

        {/* Probability bar */}
        {probs && (
          <div className="mb-4">
            <div className="mb-1 flex overflow-hidden rounded-full">
              <div
                className="h-2 bg-accent-green transition-all"
                style={{ width: `${probs.home}%` }}
              />
              {probs.draw !== null && (
                <div
                  className="h-2 bg-slate-600"
                  style={{ width: `${probs.draw}%` }}
                />
              )}
              <div
                className="h-2 bg-slate-500"
                style={{ width: `${probs.away ?? 100 - probs.home}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>{probs.home}% H</span>
              {probs.draw !== null && <span>{probs.draw}% D</span>}
              <span>{probs.away ?? 100 - probs.home}% A</span>
            </div>
          </div>
        )}

        {/* Bottom: top pick + best odds + view */}
        <div className="flex items-center justify-between border-t border-bg-border pt-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 shrink-0 text-accent-green" />
            <span className="text-xs text-slate-500">Top pick:</span>
            <span className="text-xs font-semibold text-white">{topPick.label}</span>
            <span className={`text-xs font-extrabold ${signal.color}`}>{topPick.probability}%</span>
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 transition-colors group-hover:text-accent-green">
            Analysis <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </article>
  );
}
