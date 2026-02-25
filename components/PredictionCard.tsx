import { Clock } from "lucide-react";
import type { OddsEvent, Market, MarketOption, Sport } from "@/data/sampleOdds";

const SPORT_STYLES: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  football: {
    label: "Football",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  basketball: {
    label: "Basketball",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  tennis: {
    label: "Tennis",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  american_football: {
    label: "NFL",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  cricket: {
    label: "Cricket",
    color: "text-pink-400",
    bg: "bg-pink-400/10",
  },
};

const STAT_LABEL: Record<Sport, { for: string; against: string }> = {
  football: { for: "scored", against: "conceded" },
  basketball: { for: "pts scored", against: "pts allowed" },
  tennis: { for: "sets won", against: "sets lost" },
  american_football: { for: "pts scored", against: "pts allowed" },
  cricket: { for: "run rate", against: "econ rate" },
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

function FormPills({ form }: { form: ("W" | "D" | "L")[] }) {
  return (
    <div className="flex gap-0.5">
      {form.map((result, i) => (
        <span
          key={i}
          className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold
            ${result === "W"
              ? "bg-emerald-500/20 text-emerald-400"
              : result === "D"
              ? "bg-slate-600/30 text-slate-400"
              : "bg-red-500/20 text-red-400"
            }`}
        >
          {result}
        </span>
      ))}
    </div>
  );
}

function ProbBar({ option }: { option: MarketOption }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-32 truncate text-xs ${
          option.pick ? "font-semibold text-white" : "text-slate-400"
        }`}
      >
        {option.label}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-border">
        <div
          className={`h-full rounded-full ${
            option.pick ? "bg-accent-green" : "bg-slate-600"
          }`}
          style={{ width: `${option.probability}%` }}
        />
      </div>
      <span
        className={`w-9 text-right text-xs font-bold ${
          option.pick ? "text-accent-green" : "text-slate-500"
        }`}
      >
        {option.probability}%
      </span>
      {option.pick ? (
        <span className="rounded bg-accent-green/10 px-1 py-0.5 text-[10px] font-bold text-accent-green ring-1 ring-accent-green/20">
          PICK
        </span>
      ) : (
        <span className="w-[38px]" />
      )}
    </div>
  );
}

function MarketSection({ market }: { market: Market }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-white">{market.name}</span>
        <span className="text-[11px] text-slate-600">
          Best: {market.bestOdds.toFixed(2)} @ {market.bestBookmaker}
        </span>
      </div>
      <div className="space-y-1.5">
        {market.options.map((opt, i) => (
          <ProbBar key={i} option={opt} />
        ))}
      </div>
    </div>
  );
}

interface PredictionCardProps {
  event: OddsEvent;
}

export default function PredictionCard({ event }: PredictionCardProps) {
  const style = SPORT_STYLES[event.sport] ?? SPORT_STYLES.football;
  const timeUntil = formatKickoff(event.commenceTime);
  const statLabel = STAT_LABEL[event.sport];
  const totalH2H =
    event.h2h.homeWins + event.h2h.draws + event.h2h.awayWins;

  return (
    <article className="flex flex-col rounded-2xl border border-bg-border bg-bg-card p-5 transition-all hover:border-slate-700">
      {/* Top row: sport badge + time */}
      <div className="mb-3 flex items-center justify-between">
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
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="flex-1 text-base font-bold text-white">
          {event.homeTeam}
        </span>
        <span className="shrink-0 rounded-lg bg-bg-border px-2.5 py-1 text-xs font-semibold text-slate-400">
          VS
        </span>
        <span className="flex-1 text-right text-base font-bold text-white">
          {event.awayTeam}
        </span>
      </div>

      {/* Stats box */}
      <div className="mb-4 rounded-xl border border-bg-border bg-bg-surface p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Team Form (last 5)
          </span>
          <span className="text-[11px] text-slate-600">
            {statLabel.for} / {statLabel.against}
          </span>
        </div>

        <div className="space-y-2">
          {/* Home team */}
          <div className="flex items-center gap-2">
            <span className="w-24 truncate text-xs text-slate-300">
              {event.homeTeam}
            </span>
            <FormPills form={event.homeStats.form} />
            <span className="ml-auto whitespace-nowrap text-xs">
              <span className="font-semibold text-emerald-400/80">
                {event.homeStats.avgScored.toFixed(1)}
              </span>
              <span className="text-slate-600"> / </span>
              <span className="font-semibold text-red-400/80">
                {event.homeStats.avgConceded.toFixed(1)}
              </span>
            </span>
          </div>

          {/* Away team */}
          <div className="flex items-center gap-2">
            <span className="w-24 truncate text-xs text-slate-300">
              {event.awayTeam}
            </span>
            <FormPills form={event.awayStats.form} />
            <span className="ml-auto whitespace-nowrap text-xs">
              <span className="font-semibold text-emerald-400/80">
                {event.awayStats.avgScored.toFixed(1)}
              </span>
              <span className="text-slate-600"> / </span>
              <span className="font-semibold text-red-400/80">
                {event.awayStats.avgConceded.toFixed(1)}
              </span>
            </span>
          </div>
        </div>

        {/* H2H */}
        <div className="mt-2 flex items-center gap-1.5 border-t border-bg-border pt-2 text-xs">
          <span className="text-slate-500">H2H ({totalH2H}):</span>
          <span className="font-semibold text-emerald-400">
            {event.h2h.homeWins}W
          </span>
          {event.h2h.draws > 0 && (
            <>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">{event.h2h.draws}D</span>
            </>
          )}
          <span className="text-slate-600">·</span>
          <span className="font-semibold text-red-400">
            {event.h2h.awayWins}L
          </span>
          <span className="ml-1 text-slate-600">for {event.homeTeam}</span>
        </div>
      </div>

      {/* Markets */}
      <div>
        <span className="mb-3 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Statistical Predictions
        </span>
        <div className="divide-y divide-bg-border">
          {event.markets.map((market, i) => (
            <div key={i} className="py-3 first:pt-0 last:pb-0">
              <MarketSection market={market} />
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
