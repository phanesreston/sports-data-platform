"use client";

import { useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SAMPLE_ODDS } from "@/data/sampleOdds";
import type { Sport } from "@/data/sampleOdds";
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
  basketball: {
    name: "Basketball",
    emoji: "🏀",
    description: "NBA game predictions and spread analysis",
  },
  tennis: {
    name: "Tennis",
    emoji: "🎾",
    description: "ATP & WTA match predictions and set markets",
  },
  american_football: {
    name: "NFL",
    emoji: "🏈",
    description: "Moneyline, spread, and totals for every NFL game",
  },
  cricket: {
    name: "Cricket",
    emoji: "🏏",
    description: "IPL, Test, and T20 match analysis",
  },
};

function PredictionsContent() {
  const searchParams = useSearchParams();
  const selectedSport = (searchParams.get("sport") as Sport | null) ?? "all";

  const filtered = useMemo(() => {
    if (selectedSport === "all") return SAMPLE_ODDS;
    return SAMPLE_ODDS.filter((e) => e.sport === selectedSport);
  }, [selectedSport]);

  const featured = useMemo(() => {
    const marked = filtered.filter((e) => e.featured);
    return marked.length > 0 ? marked : filtered.slice(0, Math.min(2, filtered.length));
  }, [filtered]);

  const upcoming = useMemo(() => {
    const featuredIds = new Set(featured.map((e) => e.id));
    return filtered.filter((e) => !featuredIds.has(e.id));
  }, [filtered, featured]);

  const meta = SPORT_META[selectedSport] ?? SPORT_META.all;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Page heading */}
          <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
                {meta.emoji} {meta.name}
              </h1>
              <p className="mt-1 text-sm text-slate-400">{meta.description}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-green" />
              </span>
              Sample data — live integration coming soon
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-bg-border bg-bg-card py-16 text-center">
              <span className="text-4xl">🔍</span>
              <p className="mt-3 text-sm text-slate-500">
                No events found for this sport.
              </p>
            </div>
          ) : (
            <>
              {/* Featured carousel */}
              {featured.length > 0 && (
                <section className="mb-10">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-accent-green">
                      Featured
                    </span>
                    <div className="flex-1 border-t border-bg-border" />
                    <span className="text-xs text-slate-600">
                      {featured.length} event{featured.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <FeaturedCarousel events={featured} />
                </section>
              )}

              {/* Upcoming grid */}
              {upcoming.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      Upcoming
                    </span>
                    <div className="flex-1 border-t border-bg-border" />
                    <span className="text-xs text-slate-600">
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
