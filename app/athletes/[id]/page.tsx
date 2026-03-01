"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, ChevronLeft, Trophy, TrendingUp, BarChart3, Calendar, List } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PredictionCard from "@/components/PredictionCard";
import { findAthlete, findTeamPlayer } from "@/data/sampleAthletes";
import { SAMPLE_TEAMS } from "@/data/sampleTeams";
import { SAMPLE_ODDS } from "@/data/sampleOdds";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = "overview" | "fixtures" | "results";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview",  label: "Overview",  icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { id: "fixtures",  label: "Fixtures",  icon: <Calendar className="h-3.5 w-3.5" /> },
  { id: "results",   label: "Results",   icon: <List className="h-3.5 w-3.5" /> },
];

// ─── Shared styles ────────────────────────────────────────────────────────────

const SPORT_STYLES: Record<string, { label: string; color: string; bg: string; sportHref: string }> = {
  football:          { label: "Football",   color: "text-emerald-700", bg: "bg-emerald-50", sportHref: "/?sport=football" },
  basketball:        { label: "Basketball", color: "text-orange-700",  bg: "bg-orange-50",  sportHref: "/?sport=basketball" },
  tennis:            { label: "Tennis",     color: "text-amber-700",   bg: "bg-amber-50",   sportHref: "/?sport=tennis" },
  american_football: { label: "NFL",        color: "text-blue-700",    bg: "bg-blue-50",    sportHref: "/?sport=american_football" },
  cricket:           { label: "Cricket",    color: "text-pink-700",    bg: "bg-pink-50",    sportHref: "/?sport=cricket" },
};

const RESULT_STYLES = {
  W: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  D: { badge: "bg-gray-100 text-gray-600 border-gray-200" },
  L: { badge: "bg-red-50 text-red-700 border-red-200" },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</span>
      {count !== undefined && (
        <span className="rounded-full bg-bg-border px-2 py-0.5 text-[10px] font-bold text-gray-400">{count}</span>
      )}
      <div className="flex-1 border-t border-bg-border" />
    </div>
  );
}

function FormBadge({ result }: { result: "W" | "L" | "D" }) {
  return (
    <span className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold border ${RESULT_STYLES[result].badge}`}>
      {result}
    </span>
  );
}

function TabNav({
  activeTab,
  setActiveTab,
  fixtureCount,
  resultCount,
}: {
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
  fixtureCount: number;
  resultCount: number;
}) {
  return (
    <div className="mb-8 border-b border-bg-border">
      <div className="scrollbar-none -mb-px flex gap-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? "border-accent-green text-accent-green"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === "fixtures" && fixtureCount > 0 && (
              <span className="ml-1 rounded-full bg-bg-border px-1.5 py-0.5 text-[10px] font-bold text-gray-400">
                {fixtureCount}
              </span>
            )}
            {tab.id === "results" && resultCount > 0 && (
              <span className="ml-1 rounded-full bg-bg-border px-1.5 py-0.5 text-[10px] font-bold text-gray-400">
                {resultCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AthletePage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const { id } = params;
  const individual = findAthlete(id);
  const teamPlayer = !individual ? findTeamPlayer(id) : null;

  if (!individual && !teamPlayer) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">Athlete not found</p>
            <Link href="/" className="mt-4 inline-block text-sm text-accent-green hover:underline">
              ← Back to predictions
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Individual athlete (tennis etc.) ──────────────────────────────────────
  if (individual) {
    const style = SPORT_STYLES[individual.sport] ?? SPORT_STYLES.tennis;
    const upcomingMatches = SAMPLE_ODDS.filter(
      (e) => e.homeTeam === individual.name || e.awayTeam === individual.name
    );

    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

            <Link href={style.sportHref} className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-700">
              <ChevronLeft className="h-4 w-4" />
              {style.label}
            </Link>

            {/* Hero */}
            <div className="mb-6 overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
              <div className={`h-1.5 w-full ${style.bg.replace("50", "200")}`} />
              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${style.bg} ${style.color}`}>
                        {style.label}
                      </span>
                      <span className="text-sm text-gray-400">{individual.league}</span>
                      {individual.ranking <= 10 && (
                        <span className="flex items-center gap-1 rounded-full bg-accent-green/10 px-2.5 py-0.5 text-xs font-bold text-accent-green">
                          <Trophy className="h-3 w-3" /> Ranked #{individual.ranking}
                        </span>
                      )}
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">{individual.fullName}</h1>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-400">
                      <span>{individual.flag} {individual.nationality}</span>
                      <span>·</span>
                      <span>Age {individual.age}</span>
                    </div>
                    {individual.bio && (
                      <p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-500">{individual.bio}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs uppercase tracking-widest text-gray-400">Form</span>
                    <div className="flex gap-1.5">
                      {individual.form.map((r, i) => <FormBadge key={i} result={r} />)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <TabNav
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              fixtureCount={upcomingMatches.length}
              resultCount={individual.pastResults.length}
            />

            {/* Overview */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                <div>
                  <SectionHeader label="Career Stats" />
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {individual.keyStats.map((stat) => (
                      <div key={stat.label} className="rounded-xl border border-bg-border bg-bg-card px-4 py-4 text-center shadow-sm">
                        <div className="text-xl font-extrabold text-gray-900">{stat.value}</div>
                        <div className="mt-0.5 text-xs text-gray-400">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {upcomingMatches.length > 0 && (
                  <div>
                    <SectionHeader label="Next Match" />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <PredictionCard event={upcomingMatches[0]} />
                    </div>
                    {upcomingMatches.length > 1 && (
                      <button onClick={() => setActiveTab("fixtures")} className="mt-3 text-xs font-semibold text-accent-green hover:underline">
                        View all {upcomingMatches.length} fixtures →
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Fixtures */}
            {activeTab === "fixtures" && (
              <div>
                {upcomingMatches.length > 0 ? (
                  <>
                    <SectionHeader label="Upcoming Matches" count={upcomingMatches.length} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      {upcomingMatches.map((e) => <PredictionCard key={e.id} event={e} />)}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-bg-border bg-bg-card py-16 text-center shadow-sm">
                    <Calendar className="mb-3 h-10 w-10 text-gray-300" />
                    <p className="text-sm font-semibold text-gray-400">No upcoming matches</p>
                  </div>
                )}
              </div>
            )}

            {/* Results */}
            {activeTab === "results" && (
              <div>
                <SectionHeader label="Recent Results" count={individual.pastResults.length} />
                <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                  {individual.pastResults.map((result, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between gap-3 px-5 py-3.5 ${i !== 0 ? "border-t border-bg-border" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <FormBadge result={result.result} />
                        <div>
                          <span className="text-sm font-semibold text-gray-800">vs {result.opponent}</span>
                          <div className="text-[11px] text-gray-400">{result.competition}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-gray-800">{result.score}</span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          {new Date(result.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Team player ────────────────────────────────────────────────────────────
  const player = teamPlayer!;
  const style = SPORT_STYLES[player.sport] ?? SPORT_STYLES.football;
  const parentTeam = SAMPLE_TEAMS.find((t) => t.id === player.teamId)!;
  const upcomingFixtures = SAMPLE_ODDS.filter(
    (e) => e.homeTeam === player.teamName || e.awayTeam === player.teamName
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          <Link
            href={`/teams/${player.teamId}`}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
            {player.teamName}
          </Link>

          {/* Hero */}
          <div className="mb-6 overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
            <div className={`h-1.5 w-full ${style.bg.replace("50", "200")}`} />
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${style.bg} ${style.color}`}>
                      {style.label}
                    </span>
                    <Link
                      href={`/teams/${player.teamId}`}
                      className="rounded-md border border-bg-border bg-bg-border px-2.5 py-1 text-xs font-semibold text-gray-500 transition-colors hover:text-gray-800"
                    >
                      {player.teamName}
                    </Link>
                    <span className="rounded-md bg-bg-border px-2 py-1 text-xs font-bold text-gray-400">
                      #{player.number}
                    </span>
                  </div>
                  <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">{player.name}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {player.positionFull}
                    </span>
                    <span>·</span>
                    <span>{player.nationality}</span>
                    <span>·</span>
                    <span>Age {player.age}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs uppercase tracking-widest text-gray-400">Team Form</span>
                  <div className="flex gap-1.5">
                    {parentTeam.form.map((r, i) => <FormBadge key={i} result={r} />)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <TabNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            fixtureCount={upcomingFixtures.length}
            resultCount={parentTeam.pastResults.length}
          />

          {/* Overview */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div>
                <SectionHeader label={`${new Date().getFullYear()} Stats`} />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {player.keyStats.map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-bg-border bg-bg-card px-4 py-4 text-center shadow-sm">
                      <div className="text-xl font-extrabold text-gray-900">{stat.value}</div>
                      <div className="mt-0.5 text-xs text-gray-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              {upcomingFixtures.length > 0 && (
                <div>
                  <SectionHeader label="Next Fixture" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <PredictionCard event={upcomingFixtures[0]} />
                  </div>
                  {upcomingFixtures.length > 1 && (
                    <button onClick={() => setActiveTab("fixtures")} className="mt-3 text-xs font-semibold text-accent-green hover:underline">
                      View all {upcomingFixtures.length} fixtures →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Fixtures */}
          {activeTab === "fixtures" && (
            <div>
              {upcomingFixtures.length > 0 ? (
                <>
                  <SectionHeader label="Upcoming Fixtures" count={upcomingFixtures.length} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    {upcomingFixtures.map((e) => <PredictionCard key={e.id} event={e} />)}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-bg-border bg-bg-card py-16 text-center shadow-sm">
                  <Calendar className="mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-sm font-semibold text-gray-400">No upcoming fixtures</p>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {activeTab === "results" && (
            <div>
              <SectionHeader label="Team Recent Results" count={parentTeam.pastResults.length} />
              <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                {parentTeam.pastResults.map((result, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between gap-3 px-5 py-3.5 ${i !== 0 ? "border-t border-bg-border" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <FormBadge result={result.result} />
                      <div>
                        <span className="text-sm font-semibold text-gray-800">
                          {result.home ? "vs" : "@"} {result.opponent}
                        </span>
                        <div className="text-[11px] text-gray-400">{result.competition}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-gray-800">{result.score}</span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {new Date(result.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
