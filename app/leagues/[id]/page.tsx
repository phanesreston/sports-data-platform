"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Target } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Tab = "fixtures" | "standings" | "teams" | "players";

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
  return <div className={`animate-pulse rounded bg-gray-100 ${className}`} />;
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
        <span key={i} className={`h-2 w-2 rounded-full ${c === "W" ? "bg-emerald-500" : c === "D" ? "bg-gray-300" : "bg-red-400"}`} />
      ))}
    </div>
  );
}
function FixtureRow({ f, showScore }: { f: Fixture; showScore: boolean }) {
  const date = new Date(f.fixture.date);
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
      <div className="w-28 shrink-0 text-xs text-gray-400">
        <p>{date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
        <p className="text-[10px]">{f.league.round}</p>
      </div>
      <Link href={`/teams/${encodeURIComponent(f.teams.home.name)}`} className="flex flex-1 items-center justify-end gap-2 group">
        <span className={`truncate text-sm font-semibold text-right group-hover:text-accent-green ${f.teams.home.winner ? "text-gray-900" : "text-gray-500"}`}>
          {f.teams.home.name}
        </span>
        <div className="relative h-6 w-6 shrink-0">
          <Image src={f.teams.home.logo} alt="" fill className="object-contain" sizes="24px" />
        </div>
      </Link>
      <div className="w-16 shrink-0 text-center">
        {showScore && f.goals.home !== null ? (
          <span className="rounded-md bg-gray-100 px-2.5 py-1 text-sm font-extrabold text-gray-900">
            {f.goals.home} – {f.goals.away}
          </span>
        ) : (
          <span className="text-xs font-medium text-gray-400">
            {date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
      <Link href={`/teams/${encodeURIComponent(f.teams.away.name)}`} className="flex flex-1 items-center gap-2 group">
        <div className="relative h-6 w-6 shrink-0">
          <Image src={f.teams.away.logo} alt="" fill className="object-contain" sizes="24px" />
        </div>
        <span className={`truncate text-sm font-semibold group-hover:text-accent-green ${f.teams.away.winner ? "text-gray-900" : "text-gray-500"}`}>
          {f.teams.away.name}
        </span>
      </Link>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

export default function LeaguePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [league, setLeague]   = useState<LeagueMeta | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("fixtures");

  // Tab data states
  const [standings, setStandings] = useState<Standing[] | null>(null);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [topScorers, setTopScorers] = useState<TopScorer[] | null>(null);
  const [topAssists, setTopAssists]   = useState<TopScorer[] | null>(null);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [fixtures, setFixtures]   = useState<{ upcoming: Fixture[]; recent: Fixture[] } | null>(null);
  const [fixturesLoading, setFixturesLoading] = useState(false);
  const [teams, setTeams]         = useState<TeamEntry[] | null>(null);
  const [teamsLoading, setTeamsLoading] = useState(false);

  // Always load league meta on mount — uses the same working endpoint as the landing page
  useEffect(() => {
    fetch(`/api/football/leagues?id=${params.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d?.league) { setNotFound(true); return; }
        setLeague(d.league);
      })
      .catch(() => setNotFound(true));
  }, [params.id]);

  // Lazy: fixtures
  useEffect(() => {
    if (activeTab !== "fixtures" || fixtures !== null) return;
    setFixturesLoading(true);
    fetch(`/api/football/league-fixtures?league=${params.id}`)
      .then((r) => r.ok ? r.json() : { upcoming: [], recent: [] })
      .then((d) => setFixtures({ upcoming: d.upcoming ?? [], recent: d.recent ?? [] }))
      .finally(() => setFixturesLoading(false));
  }, [activeTab, params.id, fixtures]);

  // Lazy: standings
  useEffect(() => {
    if (activeTab !== "standings" || standings !== null) return;
    setStandingsLoading(true);
    fetch(`/api/football/standings?league=${params.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setStandings(d?.standings ?? []))
      .finally(() => setStandingsLoading(false));
  }, [activeTab, params.id, standings]);

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
    fetch(`/api/football/topscorers?league=${params.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setTopScorers(d?.topScorers ?? []); setTopAssists(d?.topAssists ?? []); })
      .finally(() => setPlayersLoading(false));
  }, [activeTab, params.id, topScorers]);

  const TABS: { key: Tab; label: string }[] = [
    { key: "fixtures",  label: "Fixtures"    },
    { key: "standings", label: "Standings"   },
    { key: "teams",     label: "Team List"   },
    { key: "players",   label: "Top Players" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          <button onClick={() => router.back()} className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700">
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
              <Target className="mb-3 h-12 w-12 text-gray-200" />
              <p className="font-semibold text-gray-700">League not found</p>
              <Link href="/football" className="mt-4 text-sm font-semibold text-accent-green hover:underline">← Back to Football</Link>
            </div>
          )}

          {league && (
            <>
              {/* Hero */}
              <div className="mb-6 overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                <div className="h-1.5 w-full bg-emerald-200" />
                <div className="flex items-center gap-5 p-6 sm:p-8">
                  <div className="relative h-16 w-16 shrink-0">
                    {league.logo ? (
                      <Image src={league.logo} alt={league.name} fill className="object-contain" sizes="64px" />
                    ) : (
                      <span className="text-4xl">{league.flag}</span>
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">{league.name}</h1>
                    <p className="mt-1 text-sm text-gray-400">
                      {league.flag} {league.country} · {league.season}/{String(league.season + 1).slice(2)} Season
                    </p>
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
                          : "border-transparent text-gray-400 hover:text-gray-700"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Fixtures ── */}
              {activeTab === "fixtures" && (
                <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                  {fixturesLoading ? (
                    <div className="space-y-1 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
                  ) : (
                    <>
                      {(fixtures?.upcoming.length ?? 0) > 0 && (
                        <>
                          <div className="border-b border-bg-border px-5 py-3">
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Upcoming</p>
                          </div>
                          <div className="divide-y divide-bg-border">
                            {fixtures!.upcoming.map((f) => <FixtureRow key={f.fixture.id} f={f} showScore={false} />)}
                          </div>
                        </>
                      )}
                      {(fixtures?.recent.length ?? 0) > 0 && (
                        <>
                          <div className={`border-b border-bg-border px-5 py-3 ${fixtures?.upcoming.length ? "border-t" : ""}`}>
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Recent Results</p>
                          </div>
                          <div className="divide-y divide-bg-border">
                            {[...(fixtures?.recent ?? [])].reverse().map((f) => <FixtureRow key={f.fixture.id} f={f} showScore={true} />)}
                          </div>
                        </>
                      )}
                      {fixtures && !fixtures.upcoming.length && !fixtures.recent.length && (
                        <EmptyState message="No fixtures available for this season" />
                      )}
                    </>
                  )}
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
                            <tr className="border-b border-bg-border text-left text-xs text-gray-400">
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
                              <tr key={row.team.id} className={`transition-colors hover:bg-gray-50 ${zoneClass(row.description)}`}>
                                <td className="px-4 py-3 text-center text-xs font-semibold text-gray-400">{row.rank}</td>
                                <td className="px-4 py-3">
                                  <Link href={`/teams/${encodeURIComponent(row.team.name)}`} className="group flex items-center gap-2.5">
                                    <div className="relative h-6 w-6 shrink-0">
                                      <Image src={row.team.logo} alt={row.team.name} fill className="object-contain" sizes="24px" />
                                    </div>
                                    <span className="font-semibold text-gray-800 group-hover:text-accent-green">{row.team.name}</span>
                                  </Link>
                                </td>
                                <td className="px-3 py-3 text-center text-gray-600">{row.all.played}</td>
                                <td className="px-3 py-3 text-center text-gray-600">{row.all.win}</td>
                                <td className="px-3 py-3 text-center text-gray-600">{row.all.draw}</td>
                                <td className="px-3 py-3 text-center text-gray-600">{row.all.lose}</td>
                                <td className="px-3 py-3 text-center text-gray-600">{row.all.goals.for}</td>
                                <td className="px-3 py-3 text-center text-gray-600">{row.all.goals.against}</td>
                                <td className={`px-3 py-3 text-center font-medium ${row.goalsDiff > 0 ? "text-emerald-600" : row.goalsDiff < 0 ? "text-red-500" : "text-gray-400"}`}>
                                  {row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff}
                                </td>
                                <td className="px-3 py-3 text-center font-extrabold text-gray-900">{row.points}</td>
                                <td className="px-4 py-3"><FormDots form={row.form} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex flex-wrap gap-4 border-t border-bg-border px-4 py-3 text-xs text-gray-400">
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
                          className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50"
                        >
                          <div className="relative h-10 w-10 shrink-0">
                            <Image src={t.team.logo} alt={t.team.name} fill className="object-contain" sizes="40px" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-gray-800 group-hover:text-accent-green">{t.team.name}</p>
                            <p className="text-xs text-gray-400">
                              {t.venue.city && `${t.venue.city} · `}{t.venue.name}
                              {t.team.founded && ` · Est. ${t.team.founded}`}
                            </p>
                          </div>
                          {t.venue.capacity && (
                            <p className="shrink-0 text-xs text-gray-400">{t.venue.capacity.toLocaleString()} cap.</p>
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
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</p>
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
                                <span className="w-6 shrink-0 text-center text-sm font-bold text-gray-300">{i + 1}</span>
                                <Link href={`/athletes/${item.player.id}`} className="group flex flex-1 items-center gap-3">
                                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100">
                                    <Image src={item.player.photo} alt={item.player.name} fill className="object-cover" sizes="40px" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold text-gray-800 group-hover:text-accent-green">{item.player.name}</p>
                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
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
                                  <span className="text-xl font-extrabold text-gray-900">{value ?? "—"}</span>
                                  <p className="text-[10px] text-gray-400">{unit}</p>
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
