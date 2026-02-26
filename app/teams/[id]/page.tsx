"use client";

import Link from "next/link";
import { Clock, ChevronLeft, MapPin, Calendar, Users } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PredictionCard from "@/components/PredictionCard";
import { SAMPLE_TEAMS, type TeamPlayer } from "@/data/sampleTeams";
import { SAMPLE_ODDS } from "@/data/sampleOdds";

const SPORT_STYLES: Record<string, { label: string; color: string; bg: string; sportHref: string }> = {
  football:          { label: "Football",   color: "text-emerald-400", bg: "bg-emerald-400/10", sportHref: "/?sport=football" },
  basketball:        { label: "Basketball", color: "text-orange-400",  bg: "bg-orange-400/10",  sportHref: "/?sport=basketball" },
  tennis:            { label: "Tennis",     color: "text-yellow-400",  bg: "bg-yellow-400/10",  sportHref: "/?sport=tennis" },
  american_football: { label: "NFL",        color: "text-blue-400",    bg: "bg-blue-400/10",    sportHref: "/?sport=american_football" },
  cricket:           { label: "Cricket",    color: "text-pink-400",    bg: "bg-pink-400/10",    sportHref: "/?sport=cricket" },
};

const RESULT_STYLES = {
  W: { dot: "bg-emerald-500/70", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  D: { dot: "bg-slate-600",      badge: "bg-slate-700/50 text-slate-400 border-slate-600/20" },
  L: { dot: "bg-red-500/70",     badge: "bg-red-500/15 text-red-400 border-red-500/20" },
};

function InitialsAvatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${color.replace("text-", "bg-").replace("400", "400/15")} border border-current/20`}>
      <span className={`text-xs font-bold ${color}`}>{initials}</span>
    </div>
  );
}

function PlayerCard({ player, sportColor }: { player: TeamPlayer; sportColor: string }) {
  return (
    <Link
      href={`/athletes/${player.id}`}
      className="group flex items-center gap-3 rounded-xl border border-bg-border bg-bg-card p-3 transition-colors hover:border-slate-700"
    >
      <InitialsAvatar name={player.name} color={sportColor} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-white group-hover:text-accent-green transition-colors truncate">
            {player.name}
          </span>
          <span className="shrink-0 rounded bg-bg-border px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
            #{player.number}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
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
            <div className="text-sm font-bold text-white">{stat.value}</div>
            <div className="text-[10px] text-slate-600">{stat.label}</div>
          </div>
        ))}
      </div>
    </Link>
  );
}

export default function TeamPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const team = SAMPLE_TEAMS.find((t) => t.id === id);

  if (!team) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">Team not found</p>
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
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Back nav */}
          <Link
            href={style.sportHref}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-300"
          >
            <ChevronLeft className="h-4 w-4" />
            {style.label}
          </Link>

          {/* Hero card */}
          <div className="mb-6 overflow-hidden rounded-2xl border border-bg-border bg-bg-card">
            <div className={`h-1.5 w-full ${style.bg.replace("/10", "")}`} />
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${style.bg} ${style.color}`}>
                      {style.label}
                    </span>
                    <span className="text-sm text-slate-500">{team.league}</span>
                  </div>
                  <h1 className="text-3xl font-extrabold text-white sm:text-4xl">{team.name}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
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
                  <span className="text-xs text-slate-600 uppercase tracking-widest">Form</span>
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

          {/* Season stats grid */}
          <div className="mb-8">
            <SectionHeader label="Season Stats" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {team.seasonStats.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-bg-border bg-bg-card px-4 py-3 text-center">
                  <div className="text-xl font-extrabold text-white">{stat.value}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Squad */}
          <div className="mb-8">
            <SectionHeader label="Current Squad" />
            <div className="space-y-5">
              {team.squad.map((group) => (
                <div key={group.label}>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-600">
                    {group.label}
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {group.players.map((player) => (
                      <PlayerCard key={player.id} player={player} sportColor={style.color} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming fixtures */}
          {upcomingFixtures.length > 0 && (
            <div className="mb-8">
              <SectionHeader label="Upcoming Fixtures" count={upcomingFixtures.length} />
              <div className="grid gap-4 sm:grid-cols-2">
                {upcomingFixtures.map((event) => (
                  <PredictionCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}

          {/* Past results */}
          <div>
            <SectionHeader label="Recent Results" count={team.pastResults.length} />
            <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card">
              {team.pastResults.map((result, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between gap-3 px-5 py-3.5 ${
                    i !== 0 ? "border-t border-bg-border" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold border ${RESULT_STYLES[result.result].badge}`}
                    >
                      {result.result}
                    </span>
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

function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</span>
      {count !== undefined && (
        <span className="rounded-full bg-bg-border px-2 py-0.5 text-[10px] font-bold text-slate-600">
          {count}
        </span>
      )}
      <div className="flex-1 border-t border-bg-border" />
    </div>
  );
}
