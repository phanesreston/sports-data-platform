"use client";

import Link from "next/link";
import { Clock, ChevronLeft, Trophy, TrendingUp } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PredictionCard from "@/components/PredictionCard";
import { findAthlete, findTeamPlayer } from "@/data/sampleAthletes";
import { SAMPLE_TEAMS } from "@/data/sampleTeams";
import { SAMPLE_ODDS } from "@/data/sampleOdds";

const SPORT_STYLES: Record<string, { label: string; color: string; bg: string; sportHref: string }> = {
  football:          { label: "Football",   color: "text-emerald-400", bg: "bg-emerald-400/10", sportHref: "/?sport=football" },
  basketball:        { label: "Basketball", color: "text-orange-400",  bg: "bg-orange-400/10",  sportHref: "/?sport=basketball" },
  tennis:            { label: "Tennis",     color: "text-yellow-400",  bg: "bg-yellow-400/10",  sportHref: "/?sport=tennis" },
  american_football: { label: "NFL",        color: "text-blue-400",    bg: "bg-blue-400/10",    sportHref: "/?sport=american_football" },
  cricket:           { label: "Cricket",    color: "text-pink-400",    bg: "bg-pink-400/10",    sportHref: "/?sport=cricket" },
};

const RESULT_STYLES = {
  W: { badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  D: { badge: "bg-slate-700/50 text-slate-400 border-slate-600/20" },
  L: { badge: "bg-red-500/15 text-red-400 border-red-500/20" },
};

function FormBadge({ result }: { result: "W" | "L" | "D" }) {
  return (
    <span className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold border ${RESULT_STYLES[result].badge}`}>
      {result}
    </span>
  );
}

function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</span>
      {count !== undefined && (
        <span className="rounded-full bg-bg-border px-2 py-0.5 text-[10px] font-bold text-slate-600">{count}</span>
      )}
      <div className="flex-1 border-t border-bg-border" />
    </div>
  );
}

export default function AthletePage({ params }: { params: { id: string } }) {
  const { id } = params;

  // Try individual athlete first, then team player
  const individual = findAthlete(id);
  const teamPlayer = !individual ? findTeamPlayer(id) : null;

  if (!individual && !teamPlayer) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">Athlete not found</p>
            <Link href="/" className="mt-4 inline-block text-sm text-accent-green hover:underline">
              ← Back to predictions
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Individual athlete (tennis etc.) ─────────────────────────────────────
  if (individual) {
    const style = SPORT_STYLES[individual.sport] ?? SPORT_STYLES.tennis;
    const upcomingMatches = SAMPLE_ODDS.filter(
      (e) => e.homeTeam === individual.name || e.awayTeam === individual.name
    );

    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <Link href={style.sportHref} className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-300">
              <ChevronLeft className="h-4 w-4" />
              {style.label}
            </Link>

            {/* Hero */}
            <div className="mb-6 overflow-hidden rounded-2xl border border-bg-border bg-bg-card">
              <div className={`h-1.5 w-full ${style.bg.replace("/10", "")}`} />
              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${style.bg} ${style.color}`}>
                        {style.label}
                      </span>
                      <span className="text-sm text-slate-500">{individual.league}</span>
                      {individual.ranking <= 10 && (
                        <span className="flex items-center gap-1 rounded-full bg-accent-green/10 px-2.5 py-0.5 text-xs font-bold text-accent-green">
                          <Trophy className="h-3 w-3" /> Ranked #{individual.ranking}
                        </span>
                      )}
                    </div>
                    <h1 className="text-3xl font-extrabold text-white sm:text-4xl">{individual.fullName}</h1>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                      <span>{individual.flag} {individual.nationality}</span>
                      <span>·</span>
                      <span>Age {individual.age}</span>
                    </div>
                    {individual.bio && (
                      <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-400">{individual.bio}</p>
                    )}
                  </div>
                  {/* Form */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-slate-600 uppercase tracking-widest">Form</span>
                    <div className="flex gap-1.5">
                      {individual.form.map((r, i) => <FormBadge key={i} result={r} />)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key stats */}
            <div className="mb-8">
              <SectionHeader label="Career Stats" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {individual.keyStats.map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-bg-border bg-bg-card px-4 py-3 text-center">
                    <div className="text-xl font-extrabold text-white">{stat.value}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming */}
            {upcomingMatches.length > 0 && (
              <div className="mb-8">
                <SectionHeader label="Upcoming Matches" count={upcomingMatches.length} />
                <div className="grid gap-4 sm:grid-cols-2">
                  {upcomingMatches.map((e) => <PredictionCard key={e.id} event={e} />)}
                </div>
              </div>
            )}

            {/* Past results */}
            <div>
              <SectionHeader label="Recent Results" count={individual.pastResults.length} />
              <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card">
                {individual.pastResults.map((result, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between gap-3 px-5 py-3.5 ${i !== 0 ? "border-t border-bg-border" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <FormBadge result={result.result} />
                      <div>
                        <span className="text-sm font-semibold text-white">
                          vs {result.opponent}
                        </span>
                        <div className="text-[11px] text-slate-600">{result.competition}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-white">{result.score}</span>
                      <span className="flex items-center gap-1 text-xs text-slate-600">
                        <Clock className="h-3 w-3" />
                        {new Date(result.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Team player ───────────────────────────────────────────────────────────
  const player = teamPlayer!;
  const style = SPORT_STYLES[player.sport] ?? SPORT_STYLES.football;

  // Get the parent team for form + results
  const parentTeam = SAMPLE_TEAMS.find((t) => t.id === player.teamId)!;

  const upcomingFixtures = SAMPLE_ODDS.filter(
    (e) => e.homeTeam === player.teamName || e.awayTeam === player.teamName
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Back to team */}
          <Link
            href={`/teams/${player.teamId}`}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-300"
          >
            <ChevronLeft className="h-4 w-4" />
            {player.teamName}
          </Link>

          {/* Hero */}
          <div className="mb-6 overflow-hidden rounded-2xl border border-bg-border bg-bg-card">
            <div className={`h-1.5 w-full ${style.bg.replace("/10", "")}`} />
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${style.bg} ${style.color}`}>
                      {style.label}
                    </span>
                    <Link
                      href={`/teams/${player.teamId}`}
                      className="rounded-md border border-bg-border bg-bg-border px-2.5 py-1 text-xs font-semibold text-slate-400 transition-colors hover:text-white"
                    >
                      {player.teamName}
                    </Link>
                    <span className="rounded-md bg-bg-border px-2 py-1 text-xs font-bold text-slate-500">
                      #{player.number}
                    </span>
                  </div>
                  <h1 className="text-3xl font-extrabold text-white sm:text-4xl">{player.name}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
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
                {/* Team form */}
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-slate-600 uppercase tracking-widest">Team Form</span>
                  <div className="flex gap-1.5">
                    {parentTeam.form.map((r, i) => <FormBadge key={i} result={r} />)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Player stats */}
          <div className="mb-8">
            <SectionHeader label={`${new Date().getFullYear()} Stats`} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {player.keyStats.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-bg-border bg-bg-card px-4 py-3 text-center">
                  <div className="text-xl font-extrabold text-white">{stat.value}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming fixtures */}
          {upcomingFixtures.length > 0 && (
            <div className="mb-8">
              <SectionHeader label="Upcoming Fixtures" count={upcomingFixtures.length} />
              <div className="grid gap-4 sm:grid-cols-2">
                {upcomingFixtures.map((e) => <PredictionCard key={e.id} event={e} />)}
              </div>
            </div>
          )}

          {/* Team recent results */}
          <div>
            <SectionHeader label="Team Recent Results" count={parentTeam.pastResults.length} />
            <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card">
              {parentTeam.pastResults.map((result, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between gap-3 px-5 py-3.5 ${i !== 0 ? "border-t border-bg-border" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <FormBadge result={result.result} />
                    <div>
                      <span className="text-sm font-semibold text-white">
                        {result.home ? "vs" : "@"} {result.opponent}
                      </span>
                      <div className="text-[11px] text-slate-600">{result.competition}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-white">{result.score}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-600">
                      <Clock className="h-3 w-3" />
                      {new Date(result.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
