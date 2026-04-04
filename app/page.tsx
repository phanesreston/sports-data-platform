"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { OddsEvent, Sport } from "@/data/sampleOdds";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PredictionCard from "@/components/PredictionCard";
import FeaturedCarousel from "@/components/FeaturedCarousel";

const SPORT_META: Record<Sport | "all", { name: string; emoji: string; description: string }> = {
  all: {
    name: "All Sports",
    emoji: "🏆",
    description: "Stats-powered predictions across all upcoming events",
  },
  football: {
    name: "Football",
    emoji: "⚽",
    description: "Premier League, La Liga, Champions League and more",
  },
  nba: {
    name: "NBA",
    emoji: "🏀",
    description: "Moneyline, spread, and totals for every NBA game",
  },
  american_football: {
    name: "NFL & NCAA",
    emoji: "🏈",
    description: "Moneyline, spread, and totals for NFL and college football",
  },
  formula1: {
    name: "Formula 1",
    emoji: "🏎️",
    description: "Race winner, podium, and fastest lap markets for every Grand Prix",
  },
  basketball: {
    name: "Basketball",
    emoji: "🎯",
    description: "EuroLeague, FIBA, and international basketball predictions",
  },
  cricket: {
    name: "Cricket",
    emoji: "🏏",
    description: "IPL, Test, and T20 match analysis",
  },
  rugby: {
    name: "Rugby",
    emoji: "🏉",
    description: "Rugby World Cup, Six Nations, and Premiership predictions",
  },
  baseball: {
    name: "Baseball",
    emoji: "⚾",
    description: "MLB moneyline, run line, and totals for every game",
  },
  afl: {
    name: "AFL",
    emoji: "🦘",
    description: "AFL Premiership match winner, line, and totals markets",
  },
  tennis: {
    name: "Tennis",
    emoji: "🎾",
    description: "ATP & WTA match predictions and set markets",
  },
  hockey: {
    name: "Hockey",
    emoji: "🏒",
    description: "NHL moneyline, puck line, and over/under predictions",
  },
  mma: {
    name: "MMA",
    emoji: "🥊",
    description: "UFC fight winner, method of victory, and round betting",
  },
  volleyball: {
    name: "Volleyball",
    emoji: "🏐",
    description: "FIVB Nations League and World Championship match predictions",
  },
  handball: {
    name: "Handball",
    emoji: "🤾",
    description: "EHF Champions League and Bundesliga match predictions",
  },
  horse_racing: {
    name: "Horse Racing",
    emoji: "🐎",
    description: "Cheltenham, Royal Ascot, and top race meeting predictions",
  },
};

function PredictionCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-bg-border bg-bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-4 w-20 rounded bg-gray-200" />
        <div className="h-4 w-16 rounded bg-gray-200" />
      </div>
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="h-5 w-28 rounded bg-gray-200" />
        <div className="h-5 w-8 rounded bg-gray-200" />
        <div className="h-5 w-28 rounded bg-gray-200" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-gray-100" />
        <div className="h-3 w-3/4 rounded bg-gray-100" />
      </div>
    </div>
  );
}

function PredictionsContent() {
  const searchParams = useSearchParams();
  const selectedSport = (searchParams.get("sport") as Sport | null) ?? "all";

  const [events, setEvents] = useState<OddsEvent[]>([]);
  const [source, setSource] = useState<"live" | "sample" | "sample_fallback" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const sportParam = selectedSport === "all" ? "all" : selectedSport;
    fetch(`/api/events?sport=${sportParam}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ events: OddsEvent[]; source: string }>;
      })
      .then((data) => {
        setEvents(data.events ?? []);
        setSource(data.source as typeof source);
      })
      .catch((err) => {
        console.error("Failed to load events:", err);
        setError("Failed to load events. Showing sample data.");
      })
      .finally(() => setLoading(false));
  }, [selectedSport]);

  const featured = useMemo(() => {
    const marked = events.filter((e) => e.featured);
    return marked.length > 0 ? marked : events.slice(0, Math.min(2, events.length));
  }, [events]);

  const upcoming = useMemo(() => {
    const featuredIds = new Set(featured.map((e) => e.id));
    return events.filter((e) => !featuredIds.has(e.id));
  }, [events, featured]);

  const meta = SPORT_META[selectedSport] ?? SPORT_META.all;

  const isLive = source === "live";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          {/* Page heading */}
          <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
                {meta.emoji} {meta.name}
              </h1>
              <p className="mt-1 text-sm text-gray-400">{meta.description}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {loading ? (
                <span className="text-gray-300">Loading events…</span>
              ) : error ? (
                <span className="text-red-400">{error}</span>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${isLive ? "bg-accent-green" : "bg-amber-400"}`} />
                    <span className={`relative inline-flex h-2 w-2 rounded-full ${isLive ? "bg-accent-green" : "bg-amber-400"}`} />
                  </span>
                  {isLive ? "Live data" : "Sample data — add API keys to enable live data"}
                </>
              )}
            </div>
          </div>

          {/* Loading skeletons */}
          {loading && (
            <>
              <section className="mb-10">
                <div className="mb-3 h-4 w-24 animate-pulse rounded bg-gray-200" />
                <div className="grid gap-5 sm:grid-cols-2">
                  <PredictionCardSkeleton />
                  <PredictionCardSkeleton />
                </div>
              </section>
              <section>
                <div className="mb-3 h-4 w-20 animate-pulse rounded bg-gray-200" />
                <div className="grid gap-5 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <PredictionCardSkeleton key={i} />
                  ))}
                </div>
              </section>
            </>
          )}

          {/* No events */}
          {!loading && events.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-bg-border bg-bg-card py-16 text-center shadow-sm">
              <span className="text-4xl">🔍</span>
              <p className="mt-3 text-sm text-gray-400">
                No events found for this sport.
              </p>
            </div>
          )}

          {/* Events */}
          {!loading && events.length > 0 && (
            <>
              {featured.length > 0 && (
                <section className="mb-10">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-accent-green">
                      Featured
                    </span>
                    <div className="flex-1 border-t border-bg-border" />
                    <span className="text-xs text-gray-400">
                      {featured.length} event{featured.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <FeaturedCarousel events={featured} />
                </section>
              )}

              {upcoming.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                      Upcoming
                    </span>
                    <div className="flex-1 border-t border-bg-border" />
                    <span className="text-xs text-gray-400">
                      {upcoming.length} event{upcoming.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {upcoming.map((event) => (
                      <PredictionCard key={event.id} event={event} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-bg-base">
          <div className="h-[97px] border-b border-bg-border bg-bg-base/90" />
          <main className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-bg-border border-t-accent-green" />
          </main>
        </div>
      }
    >
      <PredictionsContent />
    </Suspense>
  );
}
