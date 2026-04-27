"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Activity, TrendingUp, Zap, BarChart2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SignalCard from "@/components/SignalCard";
import BetRankingsTable from "@/components/BetRankingsTable";
import AnalyticsTicker from "@/components/AnalyticsTicker";
import type { OddsEvent } from "@/data/sampleOdds";

interface LeagueInfo {
  id: number;
  name: string;
  country: string;
  flag: string;
  logo: string;
  season: number;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function getTopPick(event: OddsEvent) {
  return event.markets
    .flatMap((m) => m.options.filter((o) => o.pick))
    .sort((a, b) => b.probability - a.probability)[0] ?? null;
}

function getEdge(event: OddsEvent): number | null {
  const pick = getTopPick(event);
  if (!pick) return null;
  const market = event.markets.find((m) => m.options.some((o) => o === pick));
  if (!market?.bestOdds) return null;
  return Math.round((pick.probability - (1 / market.bestOdds) * 100) * 10) / 10;
}

// ── sub-components ────────────────────────────────────────────────────────────

function KpiTile({
  icon: Icon, label, value, sub, highlight,
}: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-accent-green/20 bg-accent-green/5" : "border-bg-border bg-bg-card"}`}>
      <div className="mb-2 flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${highlight ? "text-accent-green" : "text-slate-500"}`} />
        <span className="text-[11px] text-slate-500">{label}</span>
      </div>
      <div className={`text-2xl font-extrabold ${highlight ? "text-accent-green" : "text-white"}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-slate-600">{sub}</div>}
    </div>
  );
}

function LeagueCard({
  league, selected, onSelect,
}: {
  league: LeagueInfo; selected: boolean; onSelect: (id: number | null) => void;
}) {
  return (
    <button
      onClick={() => onSelect(selected ? null : league.id)}
      className={`group flex shrink-0 flex-col items-center gap-2 rounded-xl border px-4 py-3 shadow-sm transition-all ${
        selected
          ? "border-accent-green bg-accent-green/5 shadow-accent-green/10 shadow-md"
          : "border-bg-border bg-bg-card hover:border-accent-green/40 hover:shadow-md"
      }`}
    >
      <div className="relative h-10 w-10">
        {league.logo ? (
          <Image src={league.logo} alt={league.name} fill className="object-contain" sizes="40px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">{league.flag}</div>
        )}
      </div>
      <span className={`max-w-[80px] truncate text-center text-[11px] font-semibold transition-colors ${
        selected ? "text-accent-green" : "text-slate-400 group-hover:text-white"
      }`}>
        {league.name}
      </span>
      {selected && (
        <span className="h-1 w-4 rounded-full bg-accent-green" />
      )}
    </button>
  );
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-bg-border ${className}`} />;
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function FootballPage() {
  const [leagues, setLeagues]         = useState<LeagueInfo[]>([]);
  const [events, setEvents]           = useState<OddsEvent[]>([]);
  const [loading, setLoading]         = useState(true);
  const [isLive, setIsLive]           = useState(false);
  const [selectedLeagueId, setSelectedLeagueId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/football/leagues").then((r) => r.json()),
      fetch("/api/events?sport=football").then((r) => r.json()),
    ]).then(([leagueData, eventsData]) => {
      setLeagues(leagueData.leagues ?? []);
      setEvents(eventsData.events ?? []);
      setIsLive(eventsData.source === "live");
    }).finally(() => setLoading(false));
  }, []);

  const selectedLeague = useMemo(
    () => leagues.find((l) => l.id === selectedLeagueId) ?? null,
    [leagues, selectedLeagueId]
  );

  // Filter events to selected league (match by id or name fallback)
  const filteredEvents = useMemo(() => {
    if (!selectedLeague) return events;
    return events.filter(
      (e) => e.leagueId === selectedLeague.id || e.league === selectedLeague.name
    );
  }, [events, selectedLeague]);

  const strongSignals = useMemo(
    () => filteredEvents.filter((e) => (getTopPick(e)?.probability ?? 0) >= 65),
    [filteredEvents]
  );
  const valueBets = useMemo(
    () => filteredEvents.filter((e) => (getEdge(e) ?? 0) > 3),
    [filteredEvents]
  );
  const topConfidence = useMemo(
    () => Math.max(0, ...filteredEvents.map((e) => getTopPick(e)?.probability ?? 0)),
    [filteredEvents]
  );

  const topSignalEvents = useMemo(
    () =>
      [...filteredEvents]
        .filter((e) => (getTopPick(e)?.probability ?? 0) >= 58)
        .sort((a, b) => (getTopPick(b)?.probability ?? 0) - (getTopPick(a)?.probability ?? 0))
        .slice(0, 3),
    [filteredEvents]
  );

  const valueBetEvents = useMemo(() => {
    const signalIds = new Set(topSignalEvents.map((e) => e.id));
    return [...filteredEvents]
      .filter((e) => !signalIds.has(e.id) && (getEdge(e) ?? 0) > 3)
      .sort((a, b) => (getEdge(b) ?? 0) - (getEdge(a) ?? 0))
      .slice(0, 3);
  }, [filteredEvents, topSignalEvents]);

  const isFiltered = selectedLeague !== null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {!loading && filteredEvents.length > 0 && <AnalyticsTicker events={filteredEvents} />}

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          {/* Page heading */}
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white sm:text-3xl">⚽ Football</h1>
              <p className="mt-1 text-sm text-slate-500">
                Analytics and ranked picks across top European leagues
              </p>
            </div>
            {!loading && (
              <span className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
                isLive ? "bg-accent-green/10 text-accent-green" : "bg-bg-border text-slate-500"
              }`}>
                <span className="relative flex h-1.5 w-1.5">
                  {isLive && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-75" />}
                  <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${isLive ? "bg-accent-green" : "bg-slate-600"}`} />
                </span>
                {isLive ? "Live data" : "Sample data"}
              </span>
            )}
          </div>

          {/* League strip */}
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-3">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                {isFiltered ? "Filtered by league" : "Leagues"}
              </span>
              <div className="flex-1 border-t border-bg-border" />
              {isFiltered ? (
                <button
                  onClick={() => setSelectedLeagueId(null)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white"
                >
                  <X className="h-3 w-3" /> Clear filter
                </button>
              ) : (
                <Link href={`/leagues/${leagues[0]?.id ?? ""}`} className="text-[11px] font-semibold text-slate-600 hover:text-slate-400">
                  Click a league to filter ↓
                </Link>
              )}
            </div>
            {loading ? (
              <div className="flex gap-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-20" />)}
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {leagues.map((league) => (
                  <LeagueCard
                    key={league.id}
                    league={league}
                    selected={selectedLeagueId === league.id}
                    onSelect={setSelectedLeagueId}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Active filter banner */}
          {isFiltered && selectedLeague && (
            <div className="mb-6 flex items-center justify-between rounded-xl border border-accent-green/20 bg-accent-green/5 px-4 py-3">
              <div className="flex items-center gap-3">
                {selectedLeague.logo && (
                  <div className="relative h-6 w-6 shrink-0">
                    <Image src={selectedLeague.logo} alt="" fill className="object-contain" sizes="24px" />
                  </div>
                )}
                <div>
                  <span className="text-sm font-bold text-white">{selectedLeague.name}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    {filteredEvents.length} {filteredEvents.length === 1 ? "fixture" : "fixtures"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/leagues/${selectedLeague.id}`}
                  className="text-xs font-semibold text-accent-green hover:underline"
                >
                  Full league page →
                </Link>
                <button
                  onClick={() => setSelectedLeagueId(null)}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-bg-border text-slate-500 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* KPI row */}
          {!loading && filteredEvents.length > 0 && (
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiTile icon={BarChart2}  label="Fixtures analysed" value={filteredEvents.length}     sub={isFiltered ? selectedLeague!.name : "across all leagues"} />
              <KpiTile icon={Zap}        label="Strong signals"    value={strongSignals.length}      sub="≥65% confidence" highlight={strongSignals.length > 0} />
              <KpiTile icon={TrendingUp} label="Value bets"        value={valueBets.length}          sub=">3% edge vs market" />
              <KpiTile icon={Activity}   label="Top confidence"    value={topConfidence > 0 ? `${topConfidence}%` : "—"} sub="highest single pick" />
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-2xl border border-bg-border bg-bg-card p-5">
                    <div className="mb-4 h-4 w-20 rounded bg-bg-border" />
                    <div className="h-2 w-full rounded-full bg-bg-border" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state (filtered to a league with no events) */}
          {!loading && filteredEvents.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-bg-border bg-bg-card py-16 text-center">
              <span className="text-3xl">📊</span>
              <p className="mt-3 text-sm text-slate-500">
                {isFiltered
                  ? `No fixtures found for ${selectedLeague?.name}.`
                  : "No football fixtures found."}
              </p>
              {isFiltered && (
                <button
                  onClick={() => setSelectedLeagueId(null)}
                  className="mt-3 text-sm font-semibold text-accent-green hover:underline"
                >
                  Show all leagues
                </button>
              )}
            </div>
          )}

          {/* Top Signals */}
          {!loading && topSignalEvents.length > 0 && (
            <section className="mb-8">
              <div className="mb-4 flex items-center gap-3">
                <Zap className="h-4 w-4 text-accent-green" />
                <span className="text-xs font-bold uppercase tracking-widest text-accent-green">Top Signals</span>
                <div className="flex-1 border-t border-bg-border" />
                <span className="text-xs text-slate-600">{topSignalEvents.length} high-confidence {topSignalEvents.length === 1 ? "pick" : "picks"}</span>
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
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Value Bets</span>
                <div className="flex-1 border-t border-bg-border" />
                <span className="text-xs text-slate-600">Model probability &gt; market implied</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {valueBetEvents.map((e) => <SignalCard key={e.id} event={e} />)}
              </div>
            </section>
          )}

          {/* Ranked Picks */}
          {!loading && filteredEvents.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-3">
                <BarChart2 className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  {isFiltered ? "Ranked Picks" : "Ranked Picks by League"}
                </span>
                <div className="flex-1 border-t border-bg-border" />
                <span className="text-xs text-slate-600">Most favourable first</span>
              </div>
              <BetRankingsTable
                events={filteredEvents}
                groupBy={isFiltered ? "league" : "league"}
                singleSport
              />
            </section>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
