"use client";

import { useState, useMemo } from "react";
import { SAMPLE_ODDS } from "@/data/sampleOdds";
import type { Sport } from "@/data/sampleOdds";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SportFilter from "@/components/SportFilter";
import PredictionCard from "@/components/PredictionCard";

export default function PredictionsPage() {
  const [selectedSport, setSelectedSport] = useState<Sport | "all">("all");

  const counts = useMemo(() => {
    const c: Partial<Record<Sport | "all", number>> = { all: SAMPLE_ODDS.length };
    for (const event of SAMPLE_ODDS) {
      c[event.sport] = (c[event.sport] ?? 0) + 1;
    }
    return c;
  }, []);

  const filtered = useMemo(() => {
    if (selectedSport === "all") return SAMPLE_ODDS;
    return SAMPLE_ODDS.filter((e) => e.sport === selectedSport);
  }, [selectedSport]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {/* Page header */}
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-white">
                Predictions &amp; Markets
              </h1>
              <p className="mt-2 text-slate-400">
                Stats-powered predictions across multiple betting markets
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-green" />
              </span>
              Sample data — live integration coming soon
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <SportFilter
              selected={selectedSport}
              onChange={setSelectedSport}
              counts={counts}
            />
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-bg-border bg-bg-card py-16 text-center">
              <span className="text-4xl">🔍</span>
              <p className="mt-3 text-sm text-slate-500">
                No events found for this sport.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {filtered.map((event) => (
                <PredictionCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
