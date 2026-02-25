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

function FormDots({ form }: { form: ("W" | "D" | "L")[] }) {
  return (
    <div className="flex gap-1">
      {form.map((r, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${
            r === "W"
              ? "bg-emerald-500/60"
              : r === "D"
              ? "bg-slate-600"
              : "bg-red-500/60"
          }`}
        />
      ))}
    </div>
  );
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
      className={`group flex flex-col rounded-2xl border border-bg-border bg-bg-card p-4 transition-colors hover:border-slate-700${
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

      {/* Teams + form dots */}
      <div className="mt-3.5 space-y-2">
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

        {/* Form dots row */}
        <div className="flex items-center justify-between">
          <FormDots form={event.homeStats.form} />
          <span className="text-[10px] text-slate-700">last 5</span>
          <FormDots form={event.awayStats.form} />
        </div>
      </div>

      {/* Pick section */}
      {topPick && (
        <div className="mt-4 border-t border-bg-border pt-4">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="block text-[11px] text-slate-600">Top pick</span>
              <span className="block truncate text-sm font-semibold text-white">
                {topPick.label}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="text-sm font-bold text-accent-green">
                {topPick.probability}%
              </span>
              <ChevronRight className="h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>

          {/* Probability bar */}
          <div className="h-1 overflow-hidden rounded-full bg-bg-border">
            <div
              className="h-full rounded-full bg-accent-green/70"
              style={{ width: `${topPick.probability}%` }}
            />
          </div>
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
