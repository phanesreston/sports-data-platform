"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Target } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Tab = "fixtures" | "standings" | "teams" | "players";

const CURRENT_SEASON = (() => {
  const now = new Date();
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
})();
const SEASONS = [CURRENT_SEASON, CURRENT_SEASON - 1, CURRENT_SEASON - 2];

function seasonLabel(s: number) {
  return `${s}/${String(s + 1).slice(2)}`;
}

function formatRound(round: string): string {
  const m = round.match(/Regular Season - (\d+)/);
  if (m) return `GW ${m[1]}`;
  return round;
}

interface LeagueMeta {
  id: number; name: string; country: string; flag: string; logo: string; season: number;
}
interface Standing {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number; goalsDiff: number; form: string; description: string | null;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
}
interface TopScorer {
  player: { id: number; name: string; photo: string; nationality: string; age: number };
  statistics: {
    team: { id: number; name: string; logo: string };
    league: { id: number; name: string };
    games: { appearences: number | null };
    goals: { total: number | null; assists: number | null };
  }[];
}
interface Fixture {
  fixture: { id: number; date: string; status: { short: string } };
  league: { round: string };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
}
interface TeamEntry {
  team: { id: number; name: string; logo: string; founded: number | null; country: string };
  venue: { name: string; city: string; capacity: number | null };
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-bg-border ${className}`} />;
}

const ZONE_COLORS: Record<string, string> = {
  "champions league": "border-l-4 border-l-blue-500",
  "europa league":    "border-l-4 border-l-orange-400",
  "conference":       "border-l-4 border-l-teal-400",
  "relegation":       "border-l-4 border-l-red-400",
  "promotion":        "border-l-4 border-l-emerald-500",
};
function zoneClass(d: string | null) {
  if (!d) return "";
  const l = d.toLowerCase();
  for (const [k, c] of Object.entries(ZONE_COLORS)) if (l.includes(k)) return c;
  return "";
}
function FormDots({ form }: { form: string }) {
  return (
    <div className="flex gap-0.5">
      {form.slice(-5).split("").map((c, i) => (
        <span key={i} className={`h-2 w-2 rounded-full ${c === "W" ? "bg-emerald-500" : c === "D" ? "bg-slate-600" : "bg-red-400"}`} />
      ))}
    </div>
  );
}

function FixtureRow({ f, showScore }: { f: Fixture; showScore: boolean }) {
  const date = new Date(f.fixture.date);
  const isLive = !["NS", "TBD", "FT", "AET", "PEN", "PST", "CANC", "SUSP"].includes(f.fixture.status.short);
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-bg-border transition-colors">
      <div className="w-28 shrink-0 text-xs text-slate-500">
        <p>{date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
        <p className="text-[10px]">{f.league.round}</p>
      </div>
      <Link href={`/teams/${encodeURIComponent(f.teams.home.name)}`} className="flex flex-1 items-center justify-end gap-2 group">
        <span className={`truncate text-sm font-semibold text-right group-hover:text-accent-green ${f.teams.home.winner ? "text-white" : showScore ? "text-slate-400" : "text-slate-300"}`}>
          {f.teams.home.name}
        </span>
        <div className="relative h-6 w-6 shrink-0">
          <Image src={f.teams.home.logo} alt="" fill className="object-contain" sizes="24px" />
        </div>
      </Link>
      <div className="w-16 shrink-0 text-center">
        {isLive ? (
          <span className="rounded-md bg-red-500/10 px-2 py-1 text-xs font-bold text-red-400 ring-1 ring-red-500/20">
            LIVE
          </span>
        ) : showScore && f.goals.home !== null ? (
          <span className="rounded-md bg-bg-border px-2.5 py-1 text-sm font-extrabold text-white tabular-nums">
            {f.goals.home} – {f.goals.away}
          </span>
        ) : (
          <span className="text-xs font-medium text-slate-500">
            {date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
      <Link href={`/teams/${encodeURIComponent(f.teams.away.name)}`} className="flex flex-1 items-center gap-2 group">
        <div className="relative h-6 w-6 shrink-0">
          <Image src={f.teams.away.logo} alt="" fill className="object-contain" sizes="24px" />
        </div>
        <span className={`truncate text-sm font-semibold group-hover:text-accent-green ${f.teams.away.winner ? "text-white" : showScore ? "text-slate-400" : "text-slate-300"}`}>
          {f.teams.away.name}
        </span>
      </Link>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

export default function LeaguePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [league, setLeague]     = useState<LeagueMeta | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("fixtures");

  // Season state
  const [selectedSeason, setSelectedSeason] = useState(CURRENT_SEASON);

  // Rounds state
  const [rounds, setRounds]           = useState<string[]>([]);
  const [selectedRound, setSelectedRound] = useState<string | null>(null);
  const [roundsLoading, setRoundsLoading] = useState(false);
  const roundsLoadedFor = useRef<string>(""); // "leagueId:season"

  // Fixtures state (per-round)
  const [roundFixtures, setRoundFixtures] = useState<{ upcoming: Fixture[]; recent: Fixture[]; live: Fixture[]; all: Fixture[] } | null>(null);
  const [fixturesLoading, setFixturesLoading] = useState(false);

  // Other tab data
  const [standings, setStandings]       = useState<Standing[] | null>(null);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [topScorers, setTopScorers]     = useState<TopScorer[] | null>(null);
  const [topAssists, setTopAssists]     = useState<TopScorer[] | null>(null);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [teams, setTeams]               = useState<TeamEntry[] | null>(null);
  const [teamsLoading, setTeamsLoading] = useState(false);

  // League meta
  useEffect(() => {
    fetch(`/api/football/leagues?id=${params.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d?.league) { setNotFound(true); return; }
        setLeague(d.league);
      })
      .catch(() => setNotFound(true));
  }, [params.id]);

  // Load rounds when fixtures tab is active and season/league changes
  useEffect(() => {
    if (activeTab !== "fixtures") return;
    const key = `${params.id}:${selectedSeason}`;
    if (roundsLoadedFor.current === key) return;
    roundsLoadedFor.current = key;

    setRoundsLoading(true);
    setRounds([]);
    setSelectedRound(null);
    setRoundFixtures(null);

    fetch(`/api/football/rounds?league=${params.id}&season=${selectedSeason}`)
      .then((r) => r.ok ? r.json() : { rounds: [], current: null })
      .then(({ rounds: r, current }: { rounds: string[]; current: string | null }) => {
        setRounds(r);
        setSelectedRound(current ?? r[r.length - 1] ?? null);
      })
      .catch(() => {})
      .finally(() => setRoundsLoading(false));
  }, [params.id, selectedSeason, activeTab]);

  // Load fixtures when round changes
  useEffect(() => {
    if (!selectedRound) return;
    setFixturesLoading(true);
    setRoundFixtures(null);
    fetch(
      `/api/football/league-fixtures?league=${params.id}&season=${selectedSeason}&round=${encodeURIComponent(selectedRound)}`
    )
      .then((r) => r.ok ? r.json() : { upcoming: [], recent: [], live: [], all: [] })
      .then((d) => setRoundFixtures({
        upcoming: d.upcoming ?? [],
        recent:   d.recent ?? [],
        live:     d.live ?? [],
        all:      d.all ?? [],
      }))
      .catch(() => {})
      .finally(() => setFixturesLoading(false));
  }, [params.id, selectedSeason, selectedRound]);

  // When season selector changes, reset round data and force re-load
  function handleSeasonChange(s: number) {
    setSelectedSeason(s);
    roundsLoadedFor.current = ""; // force reload
    setRounds([]);
    setSelectedRound(null);
    setRoundFixtures(null);
  }

  // Lazy: standings
  useEffect(() => {
    if (activeTab !== "standings" || standings !== null) return;
    setStandingsLoading(true);
    fetch(`/api/football/standings?league=${params.id}&season=${selectedSeason}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setStandings(d?.standings ?? []))
      .finally(() => setStandingsLoading(false));
  }, [activeTab, params.id, selectedSeason, standings]);

  // Lazy: teams
  useEffect(() => {
    if (activeTab !== "teams" || teams !== null) return;
    setTeamsLoading(true);
    fetch(`/api/football/league-teams?league=${params.id}`)
      .then((r) => r.ok ? r.json() : { teams: [] })
      .then((d) => setTeams(d.teams ?? []))
      .finally(() => setTeamsLoading(false));
  }, [activeTab, params.id, teams]);

  // Lazy: players
  useEffect(() => {
    if (activeTab !== "players" || topScorers !== null) return;
    setPlayersLoading(true);
    fetch(`/api/football/topscorers?league=${params.id}&season=${selectedSeason}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setTopScorers(d?.topScorers ?? []); setTopAssists(d?.topAssists ?? []); })
      .finally(() => setPlayersLoading(false));
  }, [activeTab, params.id, selectedSeason, topScorers]);

  const TABS: { key: Tab; label: string }[] = [
    { key: "fixtures",  label: "Fixtures"    },
    { key: "standings", label: "Standings"   },
    { key: "teams",     label: "Team List"   },
    { key: "players",   label: "Top Players" },
  ];

  const roundIdx    = rounds.indexOf(selectedRound ?? "");
  const canPrev     = roundIdx > 0;
  const canNext     = roundIdx < rounds.length - 1;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          <button onClick={() => router.back()} className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-200">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          {!league && !notFound && (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-10 w-72 rounded-xl" />
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
          )}

          {notFound && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-bg-border bg-bg-card py-20 text-center shadow-sm">
              <Target className="mb-3 h-12 w-12 text-slate-700" />
              <p className="font-semibold text-slate-200">League not found</p>
              <Link href="/football" className="mt-4 text-sm font-semibold text-accent-green hover:underline">← Back to Football</Link>
            </div>
          )}

          {league && (
            <>
              {/* Hero */}
              <div className="mb-6 overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                <div className="h-1.5 w-full bg-emerald-200" />
                <div className="flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8">
                  <div className="flex items-center gap-5">
                    <div className="relative h-16 w-16 shrink-0">
                      {league.logo ? (
                        <Image src={league.logo} alt={league.name} fill className="object-contain" sizes="64px" />
                      ) : (
                        <span className="text-4xl">{league.flag}</span>
                      )}
                    </div>
                    <div>
                      <h1 className="text-2xl font-extrabold text-white sm:text-3xl">{league.name}</h1>
                      <p className="mt-1 text-sm text-slate-500">
                        {league.flag} {league.country} · {seasonLabel(selectedSeason)} Season
                      </p>
                    </div>
                  </div>

                  {/* Season selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Season</span>
                    <div className="flex rounded-lg border border-bg-border bg-bg-base overflow-hidden">
                      {SEASONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSeasonChange(s)}
                          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                            selectedSeason === s
                              ? "bg-accent-green text-white"
                              : "text-slate-400 hover:text-white hover:bg-bg-border"
                          }`}
                        >
                          {seasonLabel(s)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="mb-6 border-b border-bg-border">
                <div className="-mb-px flex gap-1 overflow-x-auto">
                  {TABS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`flex shrink-0 items-center border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                        activeTab === key
                          ? "border-accent-green text-accent-green"
                          : "border-transparent text-slate-500 hover:text-slate-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Fixtures ── */}
              {activeTab === "fixtures" && (
                <div className="space-y-4">
                  {/* Round navigation */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedRound(rounds[roundIdx - 1])}
                      disabled={!canPrev || roundsLoading}
                      className="flex items-center gap-1 rounded-lg border border-bg-border bg-bg-card px-3 py-2 text-sm font-semibold text-slate-400 transition-colors hover:border-slate-500 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" /> Prev
                    </button>

                    <div className="flex-1">
                      {rounds.length > 0 ? (
                        <select
                          value={selectedRound ?? ""}
                          onChange={(e) => setSelectedRound(e.target.value)}
                          className="w-full rounded-lg border border-bg-border bg-bg-card px-3 py-2 text-center text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-accent-green"
                        >
                          {rounds.map((r) => (
                            <option key={r} value={r}>{formatRound(r)}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex h-9 items-center justify-center rounded-lg border border-bg-border bg-bg-card">
                          <span className="text-sm text-slate-500">
                            {roundsLoading ? "Loading rounds…" : "No rounds available"}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedRound(rounds[roundIdx + 1])}
                      disabled={!canNext || roundsLoading}
                      className="flex items-center gap-1 rounded-lg border border-bg-border bg-bg-card px-3 py-2 text-sm font-semibold text-slate-400 transition-colors hover:border-slate-500 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Fixture list */}
                  <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                    {fixturesLoading || roundsLoading ? (
                      <div className="space-y-1 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
                    ) : !roundFixtures || roundFixtures.all.length === 0 ? (
                      <EmptyState message={selectedRound ? `No fixtures found for ${formatRound(selectedRound)}` : "Select a round to view fixtures"} />
                    ) : (
                      <>
                        {/* Live */}
                        {roundFixtures.live.length > 0 && (
                          <>
                            <div className="flex items-center gap-2 border-b border-bg-border px-5 py-3">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                              <p className="text-xs font-bold uppercase tracking-widest text-red-400">Live</p>
                            </div>
                            <div className="divide-y divide-bg-border">
                              {roundFixtures.live.map((f) => <FixtureRow key={f.fixture.id} f={f} showScore={true} />)}
                            </div>
                          </>
                        )}

                        {/* Results */}
                        {roundFixtures.recent.length > 0 && (
                          <>
                            <div className={`border-b border-bg-border px-5 py-3 ${roundFixtures.live.length ? "border-t" : ""}`}>
                              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Results</p>
                            </div>
                            <div className="divide-y divide-bg-border">
                              {[...roundFixtures.recent].reverse().map((f) => <FixtureRow key={f.fixture.id} f={f} showScore={true} />)}
                            </div>
                          </>
                        )}

                        {/* Upcoming */}
                        {roundFixtures.upcoming.length > 0 && (
                          <>
                            <div className={`border-b border-bg-border px-5 py-3 ${roundFixtures.recent.length || roundFixtures.live.length ? "border-t" : ""}`}>
                              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Upcoming</p>
                            </div>
                            <div className="divide-y divide-bg-border">
                              {roundFixtures.upcoming.map((f) => <FixtureRow key={f.fixture.id} f={f} showScore={false} />)}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── Standings ── */}
              {activeTab === "standings" && (
                <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                  {standingsLoading ? (
                    <div className="space-y-1 p-4">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                  ) : !standings?.length ? (
                    <EmptyState message="Standings not available" />
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-bg-border text-left text-xs text-slate-500">
                              <th className="w-8 px-4 py-3 font-medium">#</th>
                              <th className="px-4 py-3 font-medium">Team</th>
                              <th className="px-3 py-3 text-center font-medium">P</th>
                              <th className="px-3 py-3 text-center font-medium">W</th>
                              <th className="px-3 py-3 text-center font-medium">D</th>
                              <th className="px-3 py-3 text-center font-medium">L</th>
                              <th className="px-3 py-3 text-center font-medium">GF</th>
                              <th className="px-3 py-3 text-center font-medium">GA</th>
                              <th className="px-3 py-3 text-center font-medium">GD</th>
                              <th className="px-3 py-3 text-center font-bold font-medium">Pts</th>
                              <th className="px-4 py-3 font-medium">Form</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-bg-border">
                            {standings.map((row) => (
                              <tr key={row.team.id} className={`transition-colors hover:bg-bg-border ${zoneClass(row.description)}`}>
                                <td className="px-4 py-3 text-center text-xs font-semibold text-slate-500">{row.rank}</td>
                                <td className="px-4 py-3">
                                  <Link href={`/teams/${encodeURIComponent(row.team.name)}`} className="group flex items-center gap-2.5">
                                    <div className="relative h-6 w-6 shrink-0">
                                      <Image src={row.team.logo} alt={row.team.name} fill className="object-contain" sizes="24px" />
                                    </div>
                                    <span className="font-semibold text-white group-hover:text-accent-green">{row.team.name}</span>
                                  </Link>
                                </td>
                                <td className="px-3 py-3 text-center text-slate-400">{row.all.played}</td>
                                <td className="px-3 py-3 text-center text-slate-400">{row.all.win}</td>
                                <td className="px-3 py-3 text-center text-slate-400">{row.all.draw}</td>
                                <td className="px-3 py-3 text-center text-slate-400">{row.all.lose}</td>
                                <td className="px-3 py-3 text-center text-slate-400">{row.all.goals.for}</td>
                                <td className="px-3 py-3 text-center text-slate-400">{row.all.goals.against}</td>
                                <td className={`px-3 py-3 text-center font-medium ${row.goalsDiff > 0 ? "text-emerald-600" : row.goalsDiff < 0 ? "text-red-500" : "text-slate-500"}`}>
                                  {row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff}
                                </td>
                                <td className="px-3 py-3 text-center font-extrabold text-white">{row.points}</td>
                                <td className="px-4 py-3"><FormDots form={row.form} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex flex-wrap gap-4 border-t border-bg-border px-4 py-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5"><span className="h-3 w-1 rounded-full bg-blue-500" />Champions League</span>
                        <span className="flex items-center gap-1.5"><span className="h-3 w-1 rounded-full bg-orange-400" />Europa League</span>
                        <span className="flex items-center gap-1.5"><span className="h-3 w-1 rounded-full bg-red-400" />Relegation</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── Team List ── */}
              {activeTab === "teams" && (
                <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                  {teamsLoading ? (
                    <div className="space-y-1 p-4">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
                  ) : !teams?.length ? (
                    <EmptyState message="No teams available" />
                  ) : (
                    <div className="divide-y divide-bg-border">
                      {teams.map((t) => (
                        <Link
                          key={t.team.id}
                          href={`/teams/${encodeURIComponent(t.team.name)}`}
                          className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-bg-border"
                        >
                          <div className="relative h-10 w-10 shrink-0">
                            <Image src={t.team.logo} alt={t.team.name} fill className="object-contain" sizes="40px" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-white group-hover:text-accent-green">{t.team.name}</p>
                            <p className="text-xs text-slate-500">
                              {t.venue.city && `${t.venue.city} · `}{t.venue.name}
                              {t.team.founded && ` · Est. ${t.team.founded}`}
                            </p>
                          </div>
                          {t.venue.capacity && (
                            <p className="shrink-0 text-xs text-slate-500">{t.venue.capacity.toLocaleString()} cap.</p>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Top Players ── */}
              {activeTab === "players" && (
                <div className="space-y-6">
                  {[
                    { label: "Top Scorers", list: topScorers, key: "total" as const,   unit: "goals"   },
                    { label: "Top Assists", list: topAssists, key: "assists" as const, unit: "assists" },
                  ].map(({ label, list, key, unit }) => (
                    <div key={label} className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                      <div className="border-b border-bg-border px-5 py-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p>
                      </div>
                      {playersLoading ? (
                        <div className="space-y-1 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
                      ) : !list?.length ? (
                        <EmptyState message="No data available" />
                      ) : (
                        <div className="divide-y divide-bg-border">
                          {list.map((item, i) => {
                            const stat = item.statistics[0];
                            const value = key === "total" ? stat?.goals.total : stat?.goals.assists;
                            return (
                              <div key={item.player.id} className="flex items-center gap-4 px-5 py-3.5">
                                <span className="w-6 shrink-0 text-center text-sm font-bold text-slate-600">{i + 1}</span>
                                <Link href={`/athletes/${item.player.id}`} className="group flex flex-1 items-center gap-3">
                                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-bg-border">
                                    <Image src={item.player.photo} alt={item.player.name} fill className="object-cover" sizes="40px" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold text-white group-hover:text-accent-green">{item.player.name}</p>
                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                      {stat?.team && (
                                        <>
                                          <div className="relative h-3.5 w-3.5">
                                            <Image src={stat.team.logo} alt="" fill className="object-contain" sizes="14px" />
                                          </div>
                                          <span>{stat.team.name}</span>
                                        </>
                                      )}
                                      {stat?.games.appearences != null && <><span>·</span><span>{stat.games.appearences} apps</span></>}
                                    </div>
                                  </div>
                                </Link>
                                <div className="shrink-0 text-right">
                                  <span className="text-xl font-extrabold text-white">{value ?? "—"}</span>
                                  <p className="text-[10px] text-slate-500">{unit}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
