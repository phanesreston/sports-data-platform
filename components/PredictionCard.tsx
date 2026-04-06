"use client";

import Image from "next/image";  // still used for league logo
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import type { OddsEvent } from "@/data/sampleOdds";
import { getLeagueHref } from "@/data/sampleLeagues";
import TeamLogo from "@/components/TeamLogo";

const SPORT_STYLES: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  football:          { label: "Football",   color: "text-emerald-700", bg: "bg-emerald-50" },
  basketball:        { label: "Basketball", color: "text-orange-700",  bg: "bg-orange-50" },
  tennis:            { label: "Tennis",     color: "text-amber-700",   bg: "bg-amber-50" },
  american_football: { label: "NFL",        color: "text-blue-700",    bg: "bg-blue-50" },
  cricket:           { label: "Cricket",    color: "text-pink-700",    bg: "bg-pink-50" },
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
            r === "W" ? "bg-emerald-500" : r === "D" ? "bg-gray-300" : "bg-red-400"
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
  const base = `text-sm font-bold leading-snug text-gray-800 ${align === "right" ? "text-right" : ""}`;
  const row = `flex items-center gap-1.5 ${align === "right" ? "flex-row-reverse" : ""}`;
  // Prefer ID-based URL to avoid name-matching issues on the team page
  const href = teamId ? `/teams/${teamId}` : `/teams/${encodeURIComponent(name)}`;

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

  return (
    <article
      onClick={() => router.push(`/predictions/${event.id}`)}
      className="group flex cursor-pointer flex-col rounded-2xl border border-bg-border bg-bg-card p-4 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
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
                className="flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-600"
              >
                {event.leagueLogo && (
                  <div className="relative h-3.5 w-3.5">
                    <Image src={event.leagueLogo} alt="" fill className="object-contain" sizes="14px" />
                  </div>
                )}
                {event.league}
              </Link>
            ) : (
              <span className="text-xs text-gray-400">{event.league}</span>
            );
          })()}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
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
          <span className="shrink-0 rounded-lg bg-bg-border px-2.5 py-1 text-xs font-semibold text-gray-500">
            VS
          </span>
          <div className="flex-1">
            <TeamName name={event.awayTeam} logo={event.awayLogo} teamId={event.awayTeamId} sport={event.sport} align="right" />
          </div>
        </div>

        {/* Form dots row */}
        <div className="flex items-center justify-between">
          <FormDots form={event.homeStats.form} />
          <span className="text-[10px] text-gray-300">last 5</span>
          <FormDots form={event.awayStats.form} />
        </div>
      </div>
    </article>
  );
}
