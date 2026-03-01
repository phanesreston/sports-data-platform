"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, ChevronLeft, MapPin, Calendar, Users, BarChart3, List } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PredictionCard from "@/components/PredictionCard";
import { SAMPLE_TEAMS, type TeamPlayer } from "@/data/sampleTeams";
import { SAMPLE_ODDS } from "@/data/sampleOdds";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = "overview" | "squad" | "fixtures" | "results";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview",  label: "Overview",  icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { id: "squad",     label: "Squad",     icon: <Users className="h-3.5 w-3.5" /> },
  { id: "fixtures",  label: "Fixtures",  icon: <Calendar className="h-3.5 w-3.5" /> },
  { id: "results",   label: "Results",   icon: <List className="h-3.5 w-3.5" /> },
];

// ─── Sport styles ─────────────────────────────────────────────────────────────

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

function ResultBadge({ result }: { result: "W" | "D" | "L" }) {
  return (
    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold border ${RESULT_STYLES[result].badge}`}>
      {result}
    </span>
  );
}

function InitialsAvatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const bgClass = color.replace("text-", "bg-").replace(/(\d{3})$/, "$1/10");
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${bgClass} border border-current/20`}>
      <span className={`text-xs font-bold ${color}`}>{initials}</span>
    </div>
  );
}

function PlayerCard({ player, sportColor }: { player: TeamPlayer; sportColor: string }) {
  return (
    <Link
      href={`/athletes/${player.id}`}
      className="group flex items-center gap-3 rounded-xl border border-bg-border bg-bg-card p-3 shadow-sm transition-colors hover:border-gray-300"
    >
      <InitialsAvatar name={player.name} color={sportColor} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-gray-800 transition-colors group-hover:text-accent-green">
            {player.name}
          </span>
          <span className="shrink-0 rounded bg-bg-border px-1.5 py-0.5 text-[10px] font-bold text-gray-400">
            #{player.number}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
          <span>{player.positionFull}</span>
          <span>·</span>
          <span>{player.nationality}</span>
          <span>·</span>
          <span>Age {player.age}</span>
        </div>
      </div>
      <div className="hidden shrink-0 items-center gap-3 sm:flex">
        {player.keyStats.slice(0, 2).map((stat) => (
          <div key={stat.label} className="text-right">
            <div className="text-sm font-bold text-gray-800">{stat.value}</div>
            <div className="text-[10px] text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>
    </Link>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TeamPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const team = SAMPLE_TEAMS.find((t) => t.id === params.id);

  if (!team) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">Team not found</p>
            <Link href="/" className="mt-4 inline-block text-sm text-accent-green hover:underline">
              ← Back to predictions
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const style = SPORT_STYLES[team.sport] ?? SPORT_STYLES.football;
  const upcomingFixtures = SAMPLE_ODDS.filter(
    (e) => e.homeTeam === team.name || e.awayTeam === team.name
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          {/* Back nav */}
          <Link
            href={style.sportHref}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
            {style.label}
          </Link>

          {/* Hero */}
          <div className="mb-6 overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
            <div className={`h-1.5 w-full ${style.bg.replace("/50", "").replace("50", "200")}`} />
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${style.bg} ${style.color}`}>
                      {style.label}
                    </span>
                    <span className="text-sm text-gray-400">{team.league}</span>
                  </div>
                  <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">{team.name}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {team.venue}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Est. {team.founded}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {team.manager}
                    </span>
                  </div>
                </div>
                {/* Form */}
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs uppercase tracking-widest text-gray-400">Form</span>
                  <div className="flex gap-1.5">
                    {team.form.map((r, i) => (
                      <span
                        key={i}
                        className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold border ${RESULT_STYLES[r].badge}`}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab navigation */}
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
                  {tab.id === "fixtures" && upcomingFixtures.length > 0 && (
                    <span className="ml-1 rounded-full bg-bg-border px-1.5 py-0.5 text-[10px] font-bold text-gray-400">
                      {upcomingFixtures.length}
                    </span>
                  )}
                  {tab.id === "results" && team.pastResults.length > 0 && (
                    <span className="ml-1 rounded-full bg-bg-border px-1.5 py-0.5 text-[10px] font-bold text-gray-400">
                      {team.pastResults.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Overview tab ───────────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div>
                <SectionHeader label="Season Stats" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {team.seasonStats.map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-bg-border bg-bg-card px-4 py-4 text-center shadow-sm">
                      <div className="text-xl font-extrabold text-gray-900">{stat.value}</div>
                      <div className="mt-0.5 text-xs text-gray-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick squad preview */}
              <div>
                <SectionHeader label="Key Players" />
                <div className="grid gap-2 sm:grid-cols-2">
                  {team.squad.flatMap((g) => g.players).slice(0, 4).map((player) => (
                    <PlayerCard key={player.id} player={player} sportColor={style.color} />
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab("squad")}
                  className="mt-3 text-xs font-semibold text-accent-green hover:underline"
                >
                  View full squad →
                </button>
              </div>

              {/* Upcoming preview */}
              {upcomingFixtures.length > 0 && (
                <div>
                  <SectionHeader label="Next Fixture" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <PredictionCard event={upcomingFixtures[0]} />
                  </div>
                  {upcomingFixtures.length > 1 && (
                    <button
                      onClick={() => setActiveTab("fixtures")}
                      className="mt-3 text-xs font-semibold text-accent-green hover:underline"
                    >
                      View all {upcomingFixtures.length} fixtures →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Squad tab ──────────────────────────────────────────────────── */}
          {activeTab === "squad" && (
            <div className="space-y-6">
              {team.squad.map((group) => (
                <div key={group.label}>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
                    {group.label}
                    <span className="ml-2 font-normal text-gray-300 normal-case tracking-normal">
                      ({group.players.length})
                    </span>
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {group.players.map((player) => (
                      <PlayerCard key={player.id} player={player} sportColor={style.color} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Fixtures tab ───────────────────────────────────────────────── */}
          {activeTab === "fixtures" && (
            <div>
              {upcomingFixtures.length > 0 ? (
                <>
                  <SectionHeader label="Upcoming Fixtures" count={upcomingFixtures.length} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    {upcomingFixtures.map((event) => (
                      <PredictionCard key={event.id} event={event} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-bg-border bg-bg-card py-16 text-center shadow-sm">
                  <Calendar className="mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-sm font-semibold text-gray-400">No upcoming fixtures</p>
                  <p className="mt-1 text-xs text-gray-300">Check back closer to the next matchday</p>
                </div>
              )}
            </div>
          )}

          {/* ── Results tab ────────────────────────────────────────────────── */}
          {activeTab === "results" && (
            <div>
              <SectionHeader label="Recent Results" count={team.pastResults.length} />
              <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                {team.pastResults.map((result, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between gap-3 px-5 py-3.5 ${
                      i !== 0 ? "border-t border-bg-border" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ResultBadge result={result.result} />
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
