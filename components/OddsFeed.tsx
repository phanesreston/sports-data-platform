"use client";

import { useState, useMemo } from "react";
import { SAMPLE_ODDS } from "@/data/sampleOdds";
import type { Sport } from "@/data/sampleOdds";
import SportFilter from "./SportFilter";
import PredictionCard from "./PredictionCard";

export default function OddsFeed() {
  const [selectedSport, setSelectedSport] = useState<Sport | "all">("all");

  const counts = useMemo(() => {
    const c: Partial<Record<Sport | "all", number>> = {
      all: SAMPLE_ODDS.length,
    };
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
    <section
      id="predictions"
      className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8"
    >
      {/* Section header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white">
            Predictions &amp; Analysis
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Stats-powered analysis across multiple match outcomes
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => (
            <PredictionCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}
