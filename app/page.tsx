"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { Activity, TrendingUp, Zap, BarChart2 } from "lucide-react";
import type { OddsEvent } from "@/data/sampleOdds";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SignalCard from "@/components/SignalCard";
import AnalyticsTicker from "@/components/AnalyticsTicker";
import BetRankingsTable from "@/components/BetRankingsTable";

// ── helpers ───────────────────────────────────────────────────────────────────

function getTopPick(event: OddsEvent) {
  return event.markets
    .flatMap((m) => m.options.filter((o) => o.pick))
    .sort((a, b) => b.probability - a.probability)[0] ?? null;
}

function getEdge(event: OddsEvent): number | null {
  const topPick = getTopPick(event);
  if (!topPick) return null;
  const market = event.markets.find((m) => m.options.some((o) => o === topPick));
  if (!market?.bestOdds) return null;
  return Math.round((topPick.probability - (1 / market.bestOdds) * 100) * 10) / 10;
}

// ── sub-components ────────────────────────────────────────────────────────────

function KpiTile({
  icon: Icon, label, value, sub, highlight,
}: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${
      highlight ? "border-accent-green/20 bg-accent-green/5" : "border-bg-border bg-bg-card"
    }`}>
      <div className="mb-2 flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${highlight ? "text-accent-green" : "text-slate-500"}`} />
        <span className="text-[11px] text-slate-500">{label}</span>
      </div>
      <div className={`text-2xl font-extrabold ${highlight ? "text-accent-green" : "text-white"}`}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[10px] text-slate-600">{sub}</div>}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-bg-border bg-bg-card p-5">
      <div className="mb-4 flex gap-2">
        <div className="h-4 w-16 rounded bg-bg-border" />
        <div className="h-4 w-24 rounded bg-bg-border" />
      </div>
      <div className="h-2 w-full rounded-full bg-bg-border" />
    </div>
  );
}

// ── main content ──────────────────────────────────────────────────────────────

function DashboardContent() {
  const [events, setEvents]   = useState<OddsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [isLive, setIsLive]   = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/events?sport=football")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => {
        setEvents(d.events ?? []);
        setIsLive(d.source === "live");
      })
      .catch(() => setError("Could not load events"))
      .finally(() => setLoading(false));
  }, []);

  const strongSignals = useMemo(
    () => events.filter((e) => (getTopPick(e)?.probability ?? 0) >= 65),
    [events]
  );
  const valueBets = useMemo(
    () => events.filter((e) => (getEdge(e) ?? 0) > 3),
    [events]
  );
  const topConfidence = useMemo(
    () => Math.max(0, ...events.map((e) => getTopPick(e)?.probability ?? 0)),
    [events]
  );

  const topSignalEvents = useMemo(
    () =>
      [...events]
        .filter((e) => (getTopPick(e)?.probability ?? 0) >= 58)
        .sort((a, b) => (getTopPick(b)?.probability ?? 0) - (getTopPick(a)?.probability ?? 0))
        .slice(0, 3),
    [events]
  );

  const valueBetEvents = useMemo(() => {
    const signalIds = new Set(topSignalEvents.map((e) => e.id));
    return [...events]
      .filter((e) => !signalIds.has(e.id) && (getEdge(e) ?? 0) > 3)
      .sort((a, b) => (getEdge(b) ?? 0) - (getEdge(a) ?? 0))
      .slice(0, 3);
  }, [events, topSignalEvents]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {!loading && events.length > 0 && <AnalyticsTicker events={events} />}

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          {/* Heading */}
          <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
                ⚽ Football Intelligence
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Analyst-grade signals across every upcoming fixture
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {loading ? (
                <span className="text-slate-600">Loading…</span>
              ) : error ? (
                <span className="text-red-400">{error}</span>
              ) : (
                <span className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold ${
                  isLive ? "bg-accent-green/10 text-accent-green" : "bg-bg-border text-slate-500"
                }`}>
                  <span className="relative flex h-1.5 w-1.5">
                    {isLive && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-75" />
                    )}
                    <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${isLive ? "bg-accent-green" : "bg-slate-600"}`} />
                  </span>
                  {isLive ? "Live data" : "Sample data"}
                </span>
              )}
            </div>
          </div>

          {/* KPI row */}
          {!loading && events.length > 0 && (
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiTile icon={BarChart2}  label="Fixtures analysed" value={events.length}           sub="across all leagues" />
              <KpiTile icon={Zap}        label="Strong signals"    value={strongSignals.length}    sub="≥65% confidence" highlight={strongSignals.length > 0} />
              <KpiTile icon={TrendingUp} label="Value bets"        value={valueBets.length}        sub=">3% edge vs market" />
              <KpiTile icon={Activity}   label="Top confidence"    value={topConfidence > 0 ? `${topConfidence}%` : "—"} sub="highest single pick" />
            </div>
          )}

          {/* Loading skeletons */}
          {loading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-bg-border bg-bg-card p-4">
                    <div className="mb-2 h-3 w-16 rounded bg-bg-border" />
                    <div className="h-7 w-12 rounded bg-bg-border" />
                  </div>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} />)}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && events.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-bg-border bg-bg-card py-16 text-center">
              <span className="text-3xl">📊</span>
              <p className="mt-3 text-sm text-slate-500">No football fixtures found.</p>
            </div>
          )}

          {/* Top Signals */}
          {!loading && topSignalEvents.length > 0 && (
            <section className="mb-8">
              <div className="mb-4 flex items-center gap-3">
                <Zap className="h-4 w-4 text-accent-green" />
                <span className="text-xs font-bold uppercase tracking-widest text-accent-green">
                  Top Signals
                </span>
                <div className="flex-1 border-t border-bg-border" />
                <span className="text-xs text-slate-600">
                  {topSignalEvents.length} high-confidence {topSignalEvents.length === 1 ? "pick" : "picks"}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {topSignalEvents.map((e) => <SignalCard key={e.id} event={e} />)}
              </div>
            </section>
          )}

          {/* Value Bets */}
          {!loading && valueBetEvents.length > 0 && (
            <section className="mb-8">
              <div className="mb-4 flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  Value Bets
                </span>
                <div className="flex-1 border-t border-bg-border" />
                <span className="text-xs text-slate-600">Model probability &gt; market implied</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {valueBetEvents.map((e) => <SignalCard key={e.id} event={e} />)}
              </div>
            </section>
          )}

          {/* Ranked Picks by League */}
          {!loading && events.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-3">
                <BarChart2 className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Ranked Picks by League
                </span>
                <div className="flex-1 border-t border-bg-border" />
                <span className="text-xs text-slate-600">Most favourable first</span>
              </div>
              <BetRankingsTable events={events} groupBy="league" singleSport />
            </section>
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
      <DashboardContent />
    </Suspense>
  );
}
