import { Clock } from "lucide-react";
import type { OddsEvent } from "@/data/sampleOdds";
import { getBestOdds } from "@/data/sampleOdds";

const SPORT_STYLES: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  football: {
    label: "Football",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  basketball: {
    label: "Basketball",
    color: "text-orange-700",
    bg: "bg-orange-50",
  },
  tennis: {
    label: "Tennis",
    color: "text-amber-700",
    bg: "bg-amber-50",
  },
  american_football: {
    label: "NFL",
    color: "text-blue-700",
    bg: "bg-blue-50",
  },
  cricket: {
    label: "Cricket",
    color: "text-pink-700",
    bg: "bg-pink-50",
  },
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

interface OddsButtonProps {
  label: string;
  odds: number;
  bookmaker: string;
}

function OddsButton({ label, odds, bookmaker }: OddsButtonProps) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <span className="mb-1 text-xs font-medium text-gray-400">{label}</span>
      <button className="odds-btn group w-full rounded-xl border border-bg-border bg-bg-base px-3 py-2.5 text-center transition-all hover:border-accent-green/40 hover:bg-accent-green/5">
        <span className="block text-base font-bold text-gray-800 group-hover:text-accent-green">
          {odds.toFixed(2)}
        </span>
        <span className="block truncate text-xs text-gray-400 group-hover:text-gray-500">
          {bookmaker}
        </span>
      </button>
    </div>
  );
}

interface OddsCardProps {
  event: OddsEvent;
}

export default function OddsCard({ event }: OddsCardProps) {
  const best = getBestOdds(event.bookmakers);
  const style = SPORT_STYLES[event.sport] ?? SPORT_STYLES.football;
  const timeUntil = formatKickoff(event.commenceTime);

  return (
    <article className="flex flex-col rounded-2xl border border-bg-border bg-bg-card p-5 shadow-sm transition-all hover:border-gray-300 hover:shadow-md">
      {/* Top row: sport badge + time */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-bold ${style.bg} ${style.color}`}
          >
            {style.label}
          </span>
          <span className="text-xs text-gray-400">{event.league}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="h-3 w-3" />
          <span>{timeUntil}</span>
        </div>
      </div>

      {/* Teams */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="flex-1 text-base font-bold text-gray-800">
          {event.homeTeam}
        </span>
        <span className="shrink-0 rounded-lg bg-bg-border px-2.5 py-1 text-xs font-semibold text-gray-500">
          VS
        </span>
        <span className="flex-1 text-right text-base font-bold text-gray-800">
          {event.awayTeam}
        </span>
      </div>

      {/* Odds buttons */}
      <div className="flex gap-2">
        <OddsButton
          label="Home"
          odds={best.home.odds}
          bookmaker={best.home.bookmaker}
        />
        {best.draw && (
          <OddsButton
            label="Draw"
            odds={best.draw.odds}
            bookmaker={best.draw.bookmaker}
          />
        )}
        <OddsButton
          label="Away"
          odds={best.away.odds}
          bookmaker={best.away.bookmaker}
        />
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-bg-border pt-3">
        <span className="text-xs text-gray-400">
          Best odds from {event.bookmakers.length} bookmakers
        </span>
        <button className="text-xs font-semibold text-accent-green transition-opacity hover:opacity-75">
          Full odds →
        </button>
      </div>
    </article>
  );
}
