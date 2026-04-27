"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, TrendingUp } from "lucide-react";
import type { OddsEvent } from "@/data/sampleOdds";
import { getLeagueHref } from "@/data/sampleLeagues";
import TeamLogo from "@/components/TeamLogo";

function getTopPick(event: OddsEvent) {
  return event.markets
    .flatMap((m) => m.options.filter((o) => o.pick))
    .sort((a, b) => b.probability - a.probability)[0] ?? null;
}

function getMatchProbabilities(event: OddsEvent) {
  const m = event.markets.find((m) =>
    m.name.toLowerCase().includes("result") || m.name.toLowerCase().includes("winner")
  );
  if (!m) return null;
  const o = m.options;
  if (o.length === 3) return { home: o[0].probability, draw: o[1].probability, away: o[2].probability };
  if (o.length === 2) return { home: o[0].probability, draw: null, away: o[1].probability };
  return null;
}

const SPORT_STYLES: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  football:          { label: "Football",   color: "text-emerald-400", bg: "bg-emerald-500/10" },
  basketball:        { label: "Basketball", color: "text-orange-400",  bg: "bg-orange-500/10" },
  tennis:            { label: "Tennis",     color: "text-amber-400",   bg: "bg-amber-500/10" },
  american_football: { label: "NFL",        color: "text-blue-400",    bg: "bg-blue-500/10" },
  cricket:           { label: "Cricket",    color: "text-pink-400",    bg: "bg-pink-500/10" },
};

function formatKickoff(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffM = Math.floor((diffMs % 3600000) / 60000);
  if (diffH < 1) return `in ${diffM}m`;
  if (diffH < 24) return `in ${diffH}h ${diffM}m`;
  const days = Math.floor(diffH / 24);
  return `in ${days}d ${diffH % 24}h`;
}

function FormDots({ form }: { form: ("W" | "D" | "L")[] }) {
  return (
    <div className="flex gap-1">
      {form.map((r, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${
            r === "W" ? "bg-emerald-500" : r === "D" ? "bg-slate-600" : "bg-red-400"
          }`}
        />
      ))}
    </div>
  );
}

function TeamName({
  name, logo, teamId, sport, align = "left",
}: {
  name: string; logo?: string; teamId?: number; sport: string; align?: "left" | "right";
}) {
  const base = `text-sm font-bold leading-snug text-white ${align === "right" ? "text-right" : ""}`;
  const row = `flex items-center gap-1.5 ${align === "right" ? "flex-row-reverse" : ""}`;
  const href = `/teams/${encodeURIComponent(name)}`;

  const inner = (
    <>
      <TeamLogo logo={logo} name={name} size={20} className="rounded" />
      <span className={base}>{name}</span>
    </>
  );

  if (sport === "football") {
    return (
      <Link
        href={href}
        onClick={(e) => e.stopPropagation()}
        className={`${row} transition-colors hover:text-accent-green`}
      >
        {inner}
      </Link>
    );
  }
  return <div className={row}>{inner}</div>;
}

interface PredictionCardProps {
  event: OddsEvent;
}

export default function PredictionCard({ event }: PredictionCardProps) {
  const router = useRouter();
  const style = SPORT_STYLES[event.sport] ?? SPORT_STYLES.football;
  const timeUntil = formatKickoff(event.commenceTime);
  const topPick = getTopPick(event);
  const probs = getMatchProbabilities(event);
  const signalColor = topPick
    ? topPick.probability >= 70 ? "text-accent-green"
    : topPick.probability >= 58 ? "text-blue-400"
    : "text-amber-400"
    : "text-slate-500";

  return (
    <article
      onClick={() => router.push(`/predictions/${event.id}`)}
      className="group flex cursor-pointer flex-col rounded-2xl border border-bg-border bg-bg-card p-4 shadow-sm transition-all hover:border-bg-border hover:shadow-md"
    >
      {/* Sport + league + time */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${style.bg} ${style.color}`}>
            {style.label}
          </span>
          {(() => {
            const href = event.leagueId
              ? `/leagues/${event.leagueId}`
              : getLeagueHref(event.league);
            return href ? (
              <Link
                href={href}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-slate-400"
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
            );
          })()}
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock className="h-3 w-3" />
          <span>{timeUntil}</span>
        </div>
      </div>

      {/* Teams + form dots */}
      <div className="mt-3.5 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <TeamName name={event.homeTeam} logo={event.homeLogo} teamId={event.homeTeamId} sport={event.sport} align="left" />
          </div>
          <span className="shrink-0 rounded-lg bg-bg-border px-2.5 py-1 text-xs font-semibold text-slate-400">
            VS
          </span>
          <div className="flex-1">
            <TeamName name={event.awayTeam} logo={event.awayLogo} teamId={event.awayTeamId} sport={event.sport} align="right" />
          </div>
        </div>

        {/* Form dots row */}
        <div className="flex items-center justify-between">
          <FormDots form={event.homeStats.form} />
          <span className="text-[10px] text-slate-600">last 5</span>
          <FormDots form={event.awayStats.form} />
        </div>
      </div>

      {/* Analytics footer */}
      {(probs || topPick) && (
        <div className="mt-3 border-t border-bg-border pt-3 space-y-2">
          {probs && (
            <div>
              <div className="flex overflow-hidden rounded-full">
                <div className="h-1.5 bg-accent-green" style={{ width: `${probs.home}%` }} />
                {probs.draw !== null && (
                  <div className="h-1.5 bg-slate-600" style={{ width: `${probs.draw}%` }} />
                )}
                <div className="h-1.5 bg-slate-500" style={{ width: `${probs.away ?? 100 - probs.home}%` }} />
              </div>
              <div className="mt-0.5 flex justify-between text-[9px] text-slate-600">
                <span>{probs.home}%H</span>
                {probs.draw !== null && <span>{probs.draw}%D</span>}
                <span>{probs.away ?? 100 - probs.home}%A</span>
              </div>
            </div>
          )}
          {topPick && (
            <div className="flex items-center gap-1.5">
              <TrendingUp className={`h-3 w-3 shrink-0 ${signalColor}`} />
              <span className="text-[10px] text-slate-500">{topPick.label}</span>
              <span className={`text-[10px] font-bold ${signalColor}`}>{topPick.probability}%</span>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
