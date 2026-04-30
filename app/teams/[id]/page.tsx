"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, MapPin, Calendar, Users, BarChart3, List, Shield } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PredictionCard from "@/components/PredictionCard";
import PlayerPhoto from "@/components/PlayerPhoto";
import type { OddsEvent } from "@/data/sampleOdds";

type Tab = "overview" | "squad" | "fixtures";

const CURRENT_SEASON = (() => {
  const now = new Date();
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
})();
const SEASONS = [CURRENT_SEASON, CURRENT_SEASON - 1, CURRENT_SEASON - 2];

function seasonLabel(s: number) {
  return `${s}/${String(s + 1).slice(2)}`;
}

const RESULT_STYLES = {
  W: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  D: "bg-bg-border text-slate-400 border-bg-border",
  L: "bg-red-500/10 text-red-400 border-red-500/20",
};

interface SquadPlayer {
  id: number; name: string; age: number; number: number | null; position: string; photo: string;
}

interface TeamData {
  team:  { id: number; name: string; country: string; founded: number; logo: string };
  venue: { name: string; city: string; capacity: number };
  stats: {
    form: string;
    league: { id: number; name: string; logo: string };
    fixtures: { played: { total: number }; wins: { total: number }; draws: { total: number }; loses: { total: number } };
    goals: {
      for:     { average: { total: string }; total: { total: number } };
      against: { average: { total: string }; total: { total: number } };
    };
    clean_sheet: { total: number };
  } | null;
  squad: Record<string, SquadPlayer[]>;
}

interface Fixture {
  fixture: { id: number; date: string; status: { short: string } };
  league: { id: number; name: string; logo: string; round: string };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-bg-border ${className}`} />;
}

function FormBadge({ result }: { result: "W" | "D" | "L" }) {
  return (
    <span className={`flex h-7 w-7 items-center justify-center rounded-md border text-xs font-bold ${RESULT_STYLES[result]}`}>
      {result}
    </span>
  );
}

function PlayerCard({ player }: { player: SquadPlayer }) {
  return (
    <Link
      href={`/athletes/${player.id}`}
      className="group flex items-center gap-3 rounded-xl border border-bg-border bg-bg-card p-3 shadow-sm transition-colors hover:border-bg-border"
    >
      <PlayerPhoto photo={player.photo} name={player.name} size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white group-hover:text-accent-green">{player.name}</p>
        <p className="text-[11px] text-slate-500">
          {player.position}
          {player.number != null && <span className="ml-1.5 text-slate-600">#{player.number}</span>}
          {" · "}Age {player.age}
        </p>
      </div>
    </Link>
  );
}

function FixtureRow({ f, teamId }: { f: Fixture; teamId: number }) {
  const date = new Date(f.fixture.date);
  const isHome    = f.teams.home.id === teamId;
  const isFinished = ["FT", "AET", "PEN"].includes(f.fixture.status.short);
  const isLive     = !["NS", "TBD", "FT", "AET", "PEN", "PST", "CANC", "SUSP"].includes(f.fixture.status.short);

  let result: "W" | "D" | "L" | null = null;
  if (isFinished && f.goals.home !== null && f.goals.away !== null) {
    const scored    = isHome ? f.goals.home : f.goals.away;
    const conceded  = isHome ? f.goals.away : f.goals.home;
    result = scored > conceded ? "W" : scored === conceded ? "D" : "L";
  }

  const resultBg =
    result === "W" ? "border-l-emerald-500/50" :
    result === "L" ? "border-l-red-500/40" :
    result === "D" ? "border-l-slate-600" : "";

  return (
    <div className={`flex items-center gap-3 border-l-4 px-5 py-3.5 hover:bg-bg-border transition-colors ${resultBg || "border-l-transparent"}`}>
      {/* Result badge */}
      <div className="w-7 shrink-0 text-center">
        {result && (
          <span className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-extrabold ${RESULT_STYLES[result]}`}>
            {result}
          </span>
        )}
      </div>

      {/* Date + round */}
      <div className="w-24 shrink-0 text-xs text-slate-500">
        <p>{date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
        <p className="text-[10px] truncate">{f.league.round}</p>
      </div>

      {/* Home team */}
      <Link href={`/teams/${encodeURIComponent(f.teams.home.name)}`} className="flex flex-1 items-center justify-end gap-2 group">
        <span className={`truncate text-sm font-semibold text-right group-hover:text-accent-green ${f.teams.home.id === teamId ? "text-white" : isFinished ? (f.teams.home.winner ? "text-slate-300" : "text-slate-500") : "text-slate-300"}`}>
          {f.teams.home.name}
        </span>
        <div className="relative h-6 w-6 shrink-0">
          <Image src={f.teams.home.logo} alt="" fill className="object-contain" sizes="24px" />
        </div>
      </Link>

      {/* Score / time */}
      <div className="w-16 shrink-0 text-center">
        {isLive ? (
          <span className="rounded-md bg-red-500/10 px-2 py-1 text-xs font-bold text-red-400 ring-1 ring-red-500/20">LIVE</span>
        ) : isFinished && f.goals.home !== null ? (
          <span className={`rounded-md px-2.5 py-1 text-sm font-extrabold tabular-nums ${result === "W" ? "bg-emerald-500/10 text-emerald-300" : result === "L" ? "bg-red-500/10 text-red-300" : "bg-bg-border text-white"}`}>
            {f.goals.home} – {f.goals.away}
          </span>
        ) : (
          <span className="text-xs font-medium text-slate-500">
            {date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* Away team */}
      <Link href={`/teams/${encodeURIComponent(f.teams.away.name)}`} className="flex flex-1 items-center gap-2 group">
        <div className="relative h-6 w-6 shrink-0">
          <Image src={f.teams.away.logo} alt="" fill className="object-contain" sizes="24px" />
        </div>
        <span className={`truncate text-sm font-semibold group-hover:text-accent-green ${f.teams.away.id === teamId ? "text-white" : isFinished ? (f.teams.away.winner ? "text-slate-300" : "text-slate-500") : "text-slate-300"}`}>
          {f.teams.away.name}
        </span>
      </Link>

      {/* League badge */}
      {f.league.logo && (
        <div className="relative h-4 w-4 shrink-0">
          <Image src={f.league.logo} alt={f.league.name} fill className="object-contain" sizes="16px" title={f.league.name} />
        </div>
      )}
    </div>
  );
}

export default function TeamPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData]           = useState<TeamData | null>(null);
  const [nextFixture, setNextFixture] = useState<OddsEvent | null>(null);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Season for fixtures tab
  const [selectedSeason, setSelectedSeason] = useState(CURRENT_SEASON);

  // Real fixtures from API-Football
  const [teamFixtures, setTeamFixtures] = useState<{ upcoming: Fixture[]; recent: Fixture[] } | null>(null);
  const [fixturesLoading, setFixturesLoading] = useState(false);
  const [fixturesLoadedFor, setFixturesLoadedFor] = useState<string>(""); // "teamId:season"

  const teamName = decodeURIComponent(params.id);

  // Load team data + next fixture prediction card
  useEffect(() => {
    const isNumeric = /^\d+$/.test(params.id);
    const query = isNumeric ? `id=${params.id}` : `name=${encodeURIComponent(teamName)}`;

    Promise.all([
      fetch(`/api/football/team?${query}`).then((r) => r.ok ? r.json() : null),
      fetch("/api/events?sport=football").then((r) => r.ok ? r.json() : { events: [] }),
    ])
      .then(([teamData, eventsData]) => {
        if (!teamData || teamData.error) { setNotFound(true); return; }
        setData(teamData);
        const name = teamData.team.name;
        const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
        const nn = norm(name);
        const match = (eventsData.events as OddsEvent[]).find(
          (e) => {
            const hn = norm(e.homeTeam), an = norm(e.awayTeam);
            return hn === nn || an === nn || hn.includes(nn) || nn.includes(hn) || an.includes(nn) || nn.includes(an);
          }
        );
        setNextFixture(match ?? null);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id, teamName]);

  // Load team fixtures when fixtures tab is open
  useEffect(() => {
    if (activeTab !== "fixtures" || !data?.team?.id) return;
    const key = `${data.team.id}:${selectedSeason}`;
    if (fixturesLoadedFor === key) return;

    setFixturesLoading(true);
    setTeamFixtures(null);
    setFixturesLoadedFor(key);

    fetch(`/api/football/team-fixtures?team=${data.team.id}&season=${selectedSeason}`)
      .then((r) => r.ok ? r.json() : { upcoming: [], recent: [] })
      .then((d) => setTeamFixtures({ upcoming: d.upcoming ?? [], recent: d.recent ?? [] }))
      .catch(() => setTeamFixtures({ upcoming: [], recent: [] }))
      .finally(() => setFixturesLoading(false));
  }, [activeTab, data?.team?.id, selectedSeason, fixturesLoadedFor]);

  function handleSeasonChange(s: number) {
    setSelectedSeason(s);
    setFixturesLoadedFor(""); // force reload
    setTeamFixtures(null);
  }

  const formChars = (data?.stats?.form ?? "").slice(-5).split("") as ("W" | "D" | "L")[];
  const teamId = data?.team?.id ?? 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          <button onClick={() => router.back()} className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-200">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-44 w-full rounded-2xl" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
            </div>
          )}

          {!loading && notFound && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-bg-border bg-bg-card py-20 text-center shadow-sm">
              <Shield className="mb-3 h-12 w-12 text-slate-700" />
              <p className="font-semibold text-slate-200">Team not found</p>
              <p className="mt-1 text-sm text-slate-500">"{teamName}" could not be found.</p>
              <Link href="/" className="mt-4 text-sm font-semibold text-accent-green hover:underline">← Back to predictions</Link>
            </div>
          )}

          {!loading && data && (
            <>
              {/* Hero */}
              <div className="mb-6 overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                <div className="h-1.5 w-full bg-emerald-200" />
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="relative h-20 w-20 shrink-0">
                        <Image src={data.team.logo} alt={data.team.name} fill className="object-contain" sizes="80px" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-extrabold text-white sm:text-4xl">{data.team.name}</h1>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                          {data.stats?.league && (
                            <Link href={`/leagues/${data.stats.league.id}`} className="flex items-center gap-1.5 hover:text-slate-200">
                              <div className="relative h-4 w-4">
                                <Image src={data.stats.league.logo} alt="" fill className="object-contain" sizes="16px" />
                              </div>
                              {data.stats.league.name}
                            </Link>
                          )}
                          <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{data.venue.city}</span>
                          <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Est. {data.team.founded}</span>
                          <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{data.venue.name}</span>
                        </div>
                      </div>
                    </div>

                    {formChars.length > 0 && (
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs uppercase tracking-widest text-slate-500">Form</span>
                        <div className="flex gap-1.5">
                          {formChars.map((r, i) => <FormBadge key={i} result={r} />)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="mb-6 border-b border-bg-border">
                <div className="-mb-px flex gap-1 overflow-x-auto">
                  {(["overview", "squad", "fixtures"] as Tab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-semibold capitalize transition-colors ${
                        activeTab === tab
                          ? "border-accent-green text-accent-green"
                          : "border-transparent text-slate-500 hover:text-slate-200"
                      }`}
                    >
                      {tab === "overview" && <BarChart3 className="h-3.5 w-3.5" />}
                      {tab === "squad"    && <Users className="h-3.5 w-3.5" />}
                      {tab === "fixtures" && <Calendar className="h-3.5 w-3.5" />}
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Overview */}
              {activeTab === "overview" && (
                <div className="space-y-8">
                  {data.stats && (
                    <div>
                      <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Season Stats</h2>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                        {[
                          { label: "Played",       value: data.stats.fixtures.played.total },
                          { label: "Won",          value: data.stats.fixtures.wins.total },
                          { label: "Drawn",        value: data.stats.fixtures.draws.total },
                          { label: "Lost",         value: data.stats.fixtures.loses.total },
                          { label: "Goals For",    value: data.stats.goals.for.total.total },
                          { label: "Goals Ag.",    value: data.stats.goals.against.total.total },
                          { label: "Avg Scored",   value: data.stats.goals.for.average.total },
                          { label: "Clean Sheets", value: data.stats.clean_sheet.total },
                        ].map((s) => (
                          <div key={s.label} className="rounded-xl border border-bg-border bg-bg-card px-4 py-4 text-center shadow-sm">
                            <div className="text-xl font-extrabold text-white">{s.value}</div>
                            <div className="mt-0.5 text-[11px] text-slate-500">{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {Object.values(data.squad).flat().length > 0 && (
                    <div>
                      <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Key Players</h2>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {Object.values(data.squad).flat().slice(0, 6).map((p) => <PlayerCard key={p.id} player={p} />)}
                      </div>
                      <button onClick={() => setActiveTab("squad")} className="mt-3 text-xs font-semibold text-accent-green hover:underline">
                        View full squad →
                      </button>
                    </div>
                  )}

                  {nextFixture && (
                    <div>
                      <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Next Fixture</h2>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <PredictionCard event={nextFixture} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Squad */}
              {activeTab === "squad" && (
                <div className="space-y-6">
                  {Object.entries(data.squad).map(([group, players]) =>
                    players.length > 0 ? (
                      <div key={group}>
                        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                          {group} <span className="ml-1 font-normal normal-case text-slate-600">({players.length})</span>
                        </h3>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {players.map((p) => <PlayerCard key={p.id} player={p} />)}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              )}

              {/* Fixtures */}
              {activeTab === "fixtures" && (
                <div className="space-y-4">
                  {/* Season selector */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">All Fixtures</span>
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

                  <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                    {fixturesLoading ? (
                      <div className="space-y-1 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
                    ) : !teamFixtures || (teamFixtures.upcoming.length === 0 && teamFixtures.recent.length === 0) ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <List className="mb-3 h-10 w-10 text-slate-600" />
                        <p className="text-sm text-slate-500">No fixtures found for {seasonLabel(selectedSeason)}</p>
                      </div>
                    ) : (
                      <>
                        {/* Upcoming */}
                        {teamFixtures.upcoming.length > 0 && (
                          <>
                            <div className="border-b border-bg-border px-5 py-3">
                              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Upcoming</p>
                            </div>
                            <div className="divide-y divide-bg-border">
                              {teamFixtures.upcoming.map((f) => <FixtureRow key={f.fixture.id} f={f} teamId={teamId} />)}
                            </div>
                          </>
                        )}

                        {/* Results */}
                        {teamFixtures.recent.length > 0 && (
                          <>
                            <div className={`border-b border-bg-border px-5 py-3 ${teamFixtures.upcoming.length ? "border-t" : ""}`}>
                              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Results</p>
                            </div>
                            <div className="divide-y divide-bg-border">
                              {[...teamFixtures.recent].reverse().map((f) => <FixtureRow key={f.fixture.id} f={f} teamId={teamId} />)}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
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
