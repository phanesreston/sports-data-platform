"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Activity, TrendingUp, Zap, BarChart2 } from "lucide-react";
import type { OddsEvent, Sport } from "@/data/sampleOdds";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SignalCard from "@/components/SignalCard";
import AnalyticsTicker from "@/components/AnalyticsTicker";
import BetRankingsTable from "@/components/BetRankingsTable";

// ── helpers ──────────────────────────────────────────────────────────────────

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

function getUniqueSports(events: OddsEvent[]): Sport[] {
  return [...new Set(events.map((e) => e.sport))] as Sport[];
}

// ── sub-components ────────────────────────────────────────────────────────────

const SPORT_LABELS: Partial<Record<Sport, string>> = {
  football: "Football",
  nba: "NBA",
  american_football: "NFL",
  formula1: "F1",
  basketball: "Basketball",
  cricket: "Cricket",
  rugby: "Rugby",
  baseball: "Baseball",
  tennis: "Tennis",
  hockey: "Hockey",
  mma: "MMA",
};

function SportTab({ sport, active, onClick, count }: {
  sport: Sport | "all"; active: boolean; onClick: () => void; count?: number;
}) {
  const label = sport === "all" ? "All" : (SPORT_LABELS[sport as Sport] ?? sport);
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "bg-accent-green/10 text-accent-green"
          : "text-slate-500 hover:text-slate-200"
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
          active ? "bg-accent-green/20 text-accent-green" : "bg-bg-border text-slate-600"
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

function KpiTile({
  icon: Icon, label, value, sub, highlight,
}: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${
      highlight
        ? "border-accent-green/20 bg-accent-green/5"
        : "border-bg-border bg-bg-card"
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
      <div className="mb-3 flex items-center gap-4">
        <div className="h-5 w-24 rounded bg-bg-border" />
        <div className="h-5 w-8 rounded bg-bg-border" />
        <div className="h-5 w-24 rounded bg-bg-border" />
      </div>
      <div className="h-2 w-full rounded-full bg-bg-border" />
    </div>
  );
}

// ── main content ──────────────────────────────────────────────────────────────

function DashboardContent() {
  const searchParams = useSearchParams();
  const [activeSport, setActiveSport] = useState<Sport | "all">("all");

  const [events, setEvents]   = useState<OddsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [isLive, setIsLive]   = useState(false);

  // Sync activeSport with ?sport= query param on first load
  useEffect(() => {
    const sp = searchParams.get("sport") as Sport | null;
    if (sp) setActiveSport(sp);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/events?sport=all")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => {
        setEvents(d.events ?? []);
        setIsLive(d.source === "live");
      })
      .catch(() => setError("Could not load events"))
      .finally(() => setLoading(false));
  }, []);

  const sports = useMemo(() => getUniqueSports(events), [events]);

  const filtered = useMemo(
    () => (activeSport === "all" ? events : events.filter((e) => e.sport === activeSport)),
    [events, activeSport]
  );

  // KPI computations
  const strongSignals = useMemo(
    () => filtered.filter((e) => (getTopPick(e)?.probability ?? 0) >= 65),
    [filtered]
  );
  const valueBets = useMemo(
    () => filtered.filter((e) => (getEdge(e) ?? 0) > 3),
    [filtered]
  );
  const topConfidence = useMemo(
    () => Math.max(0, ...filtered.map((e) => getTopPick(e)?.probability ?? 0)),
    [filtered]
  );

  // Top signals: events with highest confidence pick, max 3
  const topSignalEvents = useMemo(
    () =>
      [...filtered]
        .filter((e) => (getTopPick(e)?.probability ?? 0) >= 58)
        .sort((a, b) => (getTopPick(b)?.probability ?? 0) - (getTopPick(a)?.probability ?? 0))
        .slice(0, 3),
    [filtered]
  );

  // Value bets section: best edge events, up to 3, not already in topSignalEvents
  const valueBetEvents = useMemo(() => {
    const signalIds = new Set(topSignalEvents.map((e) => e.id));
    return [...filtered]
      .filter((e) => !signalIds.has(e.id) && (getEdge(e) ?? 0) > 3)
      .sort((a, b) => (getEdge(b) ?? 0) - (getEdge(a) ?? 0))
      .slice(0, 3);
  }, [filtered, topSignalEvents]);

  const sportCounts = useMemo(() => {
    const map: Partial<Record<Sport | "all", number>> = { all: events.length };
    for (const e of events) map[e.sport] = (map[e.sport] ?? 0) + 1;
    return map;
  }, [events]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Ticker */}
      {!loading && filtered.length > 0 && <AnalyticsTicker events={filtered} />}

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          {/* Page heading */}
          <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
                Sports Intelligence
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
                  <span className={`relative flex h-1.5 w-1.5`}>
                    {isLive && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-75" />}
                    <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${isLive ? "bg-accent-green" : "bg-slate-600"}`} />
                  </span>
                  {isLive ? "Live data" : "Sample data"}
                </span>
              )}
            </div>
          </div>

          {/* KPI row */}
          {!loading && filtered.length > 0 && (
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiTile icon={BarChart2}   label="Events analysed"  value={filtered.length}  sub={`across ${sports.length} sport${sports.length !== 1 ? "s" : ""}`} />
              <KpiTile icon={Zap}         label="Strong signals"   value={strongSignals.length} sub="≥65% confidence" highlight={strongSignals.length > 0} />
              <KpiTile icon={TrendingUp}  label="Value bets"       value={valueBets.length} sub=">3% edge vs market" />
              <KpiTile icon={Activity}    label="Top confidence"   value={topConfidence > 0 ? `${topConfidence}%` : "—"} sub="highest single pick" />
            </div>
          )}

          {/* Sport filter tabs */}
          {!loading && sports.length > 1 && (
            <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-bg-border bg-bg-card p-1.5">
              <SportTab
                sport="all"
                active={activeSport === "all"}
                onClick={() => setActiveSport("all")}
                count={sportCounts.all}
              />
              {sports.map((sp) => (
                <SportTab
                  key={sp}
                  sport={sp}
                  active={activeSport === sp}
                  onClick={() => setActiveSport(sp)}
                  count={sportCounts[sp]}
                />
              ))}
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
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-bg-border bg-bg-card py-16 text-center">
              <span className="text-3xl">📊</span>
              <p className="mt-3 text-sm text-slate-500">No events found for this sport.</p>
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
                <span className="text-xs text-slate-600">{topSignalEvents.length} high-confidence {topSignalEvents.length === 1 ? "pick" : "picks"}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {topSignalEvents.map((e) => (
                  <SignalCard key={e.id} event={e} />
                ))}
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
                {valueBetEvents.map((e) => (
                  <SignalCard key={e.id} event={e} />
                ))}
              </div>
            </section>
          )}

          {/* Ranked Bets Table */}
          {!loading && filtered.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-3">
                <BarChart2 className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Ranked Picks
                </span>
                <div className="flex-1 border-t border-bg-border" />
                <span className="text-xs text-slate-600">Most favourable first</span>
              </div>
              <BetRankingsTable events={filtered} singleSport={activeSport !== "all"} />
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
