"use client";

import type { OddsEvent } from "@/data/sampleOdds";

function getTopPick(event: OddsEvent) {
  return event.markets
    .flatMap((m) => m.options.filter((o) => o.pick))
    .sort((a, b) => b.probability - a.probability)[0] ?? null;
}

function TickerItem({ event }: { event: OddsEvent }) {
  const topPick = getTopPick(event);
  const isStrong = topPick && topPick.probability >= 65;

  return (
    <span className="inline-flex items-center gap-2 border-r border-bg-border px-5 py-2 text-xs">
      <span className="font-semibold text-slate-300">{event.homeTeam}</span>
      <span className="text-slate-600">vs</span>
      <span className="font-semibold text-slate-300">{event.awayTeam}</span>
      {topPick && (
        <span
          className={`rounded px-1.5 py-0.5 font-bold ${
            isStrong
              ? "bg-accent-green/10 text-accent-green"
              : "bg-slate-700/60 text-slate-400"
          }`}
        >
          {topPick.label} {topPick.probability}%
        </span>
      )}
    </span>
  );
}

export default function AnalyticsTicker({ events }: { events: OddsEvent[] }) {
  if (!events.length) return null;

  const items = [...events, ...events];

  return (
    <div className="overflow-hidden border-b border-bg-border bg-bg-surface">
      <div className="flex animate-marquee whitespace-nowrap">
        {items.map((e, i) => (
          <TickerItem key={`${e.id}-${i}`} event={e} />
        ))}
      </div>
    </div>
  );
}
