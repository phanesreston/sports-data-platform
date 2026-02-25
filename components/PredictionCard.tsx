import Link from "next/link";
import { Clock, ChevronRight } from "lucide-react";
import type { OddsEvent } from "@/data/sampleOdds";

const SPORT_STYLES: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  football: { label: "Football", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  basketball: { label: "Basketball", color: "text-orange-400", bg: "bg-orange-400/10" },
  tennis: { label: "Tennis", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  american_football: { label: "NFL", color: "text-blue-400", bg: "bg-blue-400/10" },
  cricket: { label: "Cricket", color: "text-pink-400", bg: "bg-pink-400/10" },
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

interface PredictionCardProps {
  event: OddsEvent;
  asLink?: boolean;
}

export default function PredictionCard({
  event,
  asLink = true,
}: PredictionCardProps) {
  const style = SPORT_STYLES[event.sport] ?? SPORT_STYLES.football;
  const timeUntil = formatKickoff(event.commenceTime);

  const topPick = event.markets
    .flatMap((m) => m.options.filter((o) => o.pick))
    .sort((a, b) => b.probability - a.probability)[0];

  const card = (
    <article
      className={`group flex flex-col gap-3.5 rounded-2xl border border-bg-border bg-bg-card p-4 transition-colors hover:border-slate-700${
        asLink ? " cursor-pointer" : ""
      }`}
    >
      {/* Sport + league + time */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-bold ${style.bg} ${style.color}`}
          >
            {style.label}
          </span>
          <span className="text-xs text-slate-600">{event.league}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock className="h-3 w-3" />
          <span>{timeUntil}</span>
        </div>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-3">
        <span className="flex-1 text-sm font-bold leading-snug text-white">
          {event.homeTeam}
        </span>
        <span className="shrink-0 rounded-lg bg-bg-border px-2.5 py-1 text-xs font-semibold text-slate-500">
          VS
        </span>
        <span className="flex-1 text-right text-sm font-bold leading-snug text-white">
          {event.awayTeam}
        </span>
      </div>

      {/* Top pick strip */}
      {topPick && (
        <div className="flex items-center justify-between rounded-xl bg-bg-surface px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-xs text-slate-500">Top pick</span>
            <span className="truncate text-xs font-semibold text-white">
              {topPick.label}
            </span>
            <span className="shrink-0 rounded bg-accent-green/10 px-1.5 py-0.5 text-[10px] font-bold text-accent-green ring-1 ring-accent-green/20">
              {topPick.probability}%
            </span>
          </div>
          <ChevronRight className="ml-2 h-4 w-4 shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5" />
        </div>
      )}
    </article>
  );

  if (asLink) {
    return (
      <Link href={`/predictions/${event.id}`} className="block">
        {card}
      </Link>
    );
  }
  return card;
}
