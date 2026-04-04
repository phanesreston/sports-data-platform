"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import type { OddsEvent, Sport } from "@/data/sampleOdds";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Props {
  params: { id: string };
}

const SPORT_STYLES: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  football:          { label: "Football",    color: "text-emerald-700", bg: "bg-emerald-50" },
  basketball:        { label: "Basketball",  color: "text-orange-700",  bg: "bg-orange-50"  },
  tennis:            { label: "Tennis",      color: "text-amber-700",   bg: "bg-amber-50"   },
  american_football: { label: "NFL",         color: "text-blue-700",    bg: "bg-blue-50"    },
  cricket:           { label: "Cricket",     color: "text-pink-700",    bg: "bg-pink-50"    },
  nba:               { label: "NBA",         color: "text-orange-700",  bg: "bg-orange-50"  },
  afl:               { label: "AFL",         color: "text-yellow-700",  bg: "bg-yellow-50"  },
  baseball:          { label: "Baseball",    color: "text-sky-700",     bg: "bg-sky-50"     },
  formula1:          { label: "Formula 1",   color: "text-red-700",     bg: "bg-red-50"     },
  handball:          { label: "Handball",    color: "text-violet-700",  bg: "bg-violet-50"  },
  hockey:            { label: "Hockey",      color: "text-cyan-700",    bg: "bg-cyan-50"    },
  mma:               { label: "MMA",         color: "text-rose-700",    bg: "bg-rose-50"    },
  rugby:             { label: "Rugby",       color: "text-lime-700",    bg: "bg-lime-50"    },
  volleyball:        { label: "Volleyball",  color: "text-indigo-700",  bg: "bg-indigo-50"  },
  horse_racing:      { label: "Horse Racing",color: "text-teal-700",    bg: "bg-teal-50"    },
};

const STAT_LABEL: Record<Sport, { for: string; against: string }> = {
  football:          { for: "scored",      against: "conceded"     },
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

function formatKickoff(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffM = Math.floor((diffMs % 3600000) / 60000);
  if (diffH < 1) return `in ${diffM}m`;
  if (diffH < 24) return `in ${diffH}h ${diffM}m`;
  return `in ${Math.floor(diffH / 24)}d ${diffH % 24}h`;
}

function FormPills({ form }: { form: ("W" | "D" | "L")[] }) {
  return (
    <div className="flex gap-0.5">
      {form.map((r, i) => (
        <span
          key={i}
          className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
            r === "W"
              ? "bg-emerald-100 text-emerald-700"
              : r === "D"
              ? "bg-gray-100 text-gray-500"
              : "bg-red-100 text-red-700"
          }`}
        >
          {r}
        </span>
      ))}
    </div>
  );
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

export default function PredictionDetailPage({ params }: Props) {
  const [event, setEvent] = useState<OddsEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch("/api/events?sport=all")
      .then((r) => r.json())
      .then((data: { events: OddsEvent[] }) => {
        const found = data.events?.find((e) => e.id === params.id);
        if (found) {
          setEvent(found);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Predictions
          </Link>

          {/* Loading state */}
          {loading && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-bg-border bg-bg-card p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Skeleton className="h-7 w-36" />
                  <Skeleton className="h-7 w-10" />
                  <Skeleton className="h-7 w-36" />
                </div>
              </div>
              <div className="rounded-2xl border border-bg-border bg-bg-card p-5 shadow-sm">
                <Skeleton className="mb-4 h-4 w-32" />
                <div className="space-y-3">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                </div>
              </div>
            </div>
          )}

          {/* Not found state */}
          {!loading && notFound && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-bg-border bg-bg-card py-16 text-center shadow-sm">
              <span className="text-4xl">🔍</span>
              <p className="mt-3 text-sm font-semibold text-gray-700">Event not found</p>
              <p className="mt-1 text-xs text-gray-400">
                This event may have started or is no longer available.
              </p>
              <Link
                href="/"
                className="mt-5 rounded-lg bg-accent-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-green-dim"
              >
                View all predictions
              </Link>
            </div>
          )}

          {/* Event detail */}
          {!loading && event && <EventDetail event={event} />}

        </div>
      </main>
      <Footer />
    </div>
  );
}

function EventDetail({ event }: { event: OddsEvent }) {
  const style = SPORT_STYLES[event.sport] ?? SPORT_STYLES.football;
  const statLabel = STAT_LABEL[event.sport] ?? { for: "scored", against: "conceded" };
  const totalH2H = event.h2h.homeWins + event.h2h.draws + event.h2h.awayWins;
  const hasDrawOdds = event.bookmakers.some((b) => b.draw != null);

  return (
    <>
      {/* Match header */}
      <div className="mb-6 rounded-2xl border border-bg-border bg-bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${style.bg} ${style.color}`}>
              {style.label}
            </span>
            <span className="text-xs text-gray-400">{event.league}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            <span>{formatKickoff(event.commenceTime)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex-1 text-xl font-extrabold leading-tight text-gray-900">
            {event.homeTeam}
          </span>
          <span className="shrink-0 rounded-xl bg-bg-border px-3 py-1.5 text-sm font-bold text-gray-500">
            VS
          </span>
          <span className="flex-1 text-right text-xl font-extrabold leading-tight text-gray-900">
            {event.awayTeam}
          </span>
        </div>
      </div>

      {/* Team form + H2H */}
      <div className="mb-6 rounded-2xl border border-bg-border bg-bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            Team Form (last 5)
          </h2>
          <span className="text-xs text-gray-400">
            {statLabel.for} / {statLabel.against}
          </span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-sm text-gray-700">{event.homeTeam}</span>
            <FormPills form={event.homeStats.form} />
            <span className="ml-auto whitespace-nowrap text-sm">
              <span className="font-semibold text-emerald-600">{event.homeStats.avgScored.toFixed(1)}</span>
              <span className="text-gray-300"> / </span>
              <span className="font-semibold text-red-600">{event.homeStats.avgConceded.toFixed(1)}</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-sm text-gray-700">{event.awayTeam}</span>
            <FormPills form={event.awayStats.form} />
            <span className="ml-auto whitespace-nowrap text-sm">
              <span className="font-semibold text-emerald-600">{event.awayStats.avgScored.toFixed(1)}</span>
              <span className="text-gray-300"> / </span>
              <span className="font-semibold text-red-600">{event.awayStats.avgConceded.toFixed(1)}</span>
            </span>
          </div>
        </div>
        {totalH2H > 0 && (
          <div className="mt-4 flex items-center gap-1.5 border-t border-bg-border pt-4 text-sm">
            <span className="text-gray-400">H2H ({totalH2H}):</span>
            <span className="font-semibold text-emerald-600">{event.h2h.homeWins}W</span>
            {event.h2h.draws > 0 && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-gray-500">{event.h2h.draws}D</span>
              </>
            )}
            <span className="text-gray-300">·</span>
            <span className="font-semibold text-red-600">{event.h2h.awayWins}L</span>
            <span className="ml-1 text-gray-400">for {event.homeTeam}</span>
          </div>
        )}
      </div>

      {/* Statistical predictions */}
      {event.markets.length > 0 && (
        <div className="mb-6 rounded-2xl border border-bg-border bg-bg-card p-5 shadow-sm">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-gray-400">
            Statistical Predictions
          </h2>
          <div className="divide-y divide-bg-border">
            {event.markets.map((market, i) => (
              <div key={i} className="py-4 first:pt-0 last:pb-0">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">{market.name}</span>
                  {market.bestOdds > 0 && (
                    <span className="text-xs text-gray-400">
                      Best odds: {market.bestOdds.toFixed(2)} @ {market.bestBookmaker}
                    </span>
                  )}
                </div>
                <div className="space-y-2.5">
                  {market.options.map((opt, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <span className={`w-36 shrink-0 truncate text-sm ${opt.pick ? "font-semibold text-gray-800" : "text-gray-400"}`}>
                        {opt.label}
                      </span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-border">
                        <div
                          className={`h-full rounded-full ${opt.pick ? "bg-accent-green" : "bg-gray-200"}`}
                          style={{ width: `${opt.probability}%` }}
                        />
                      </div>
                      <span className={`w-9 shrink-0 text-right text-sm font-bold ${opt.pick ? "text-accent-green" : "text-gray-400"}`}>
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
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Odds comparison */}
      {event.bookmakers.length > 0 && (
        <div className="rounded-2xl border border-bg-border bg-bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
            Odds Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bg-border text-left text-xs text-gray-400">
                  <th className="pb-3 pr-4 font-medium">Bookmaker</th>
                  <th className="pb-3 pr-4 text-right font-medium">{event.homeTeam}</th>
                  {hasDrawOdds && <th className="pb-3 pr-4 text-right font-medium">Draw</th>}
                  <th className="pb-3 text-right font-medium">{event.awayTeam}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border">
                {event.bookmakers.map((bk) => (
                  <tr key={bk.name}>
                    <td className="py-3 pr-4 text-gray-600">{bk.name}</td>
                    <td className="py-3 pr-4 text-right font-semibold text-gray-800">{bk.home.toFixed(2)}</td>
                    {hasDrawOdds && (
                      <td className="py-3 pr-4 text-right text-gray-500">
                        {bk.draw != null ? bk.draw.toFixed(2) : "—"}
                      </td>
                    )}
                    <td className="py-3 text-right font-semibold text-gray-800">{bk.away.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
