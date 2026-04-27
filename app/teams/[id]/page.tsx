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

const RESULT_STYLES = {
  W: "bg-emerald-50 text-emerald-700 border-emerald-200",
  D: "bg-gray-100 text-gray-600 border-gray-200",
  L: "bg-red-50 text-red-700 border-red-200",
};

interface SquadPlayer {
  id: number;
  name: string;
  age: number;
  number: number | null;
  position: string;
  photo: string;
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

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
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
      className="group flex items-center gap-3 rounded-xl border border-bg-border bg-bg-card p-3 shadow-sm transition-colors hover:border-gray-300"
    >
      <PlayerPhoto photo={player.photo} name={player.name} size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-800 group-hover:text-accent-green">
          {player.name}
        </p>
        <p className="text-[11px] text-gray-400">
          {player.position}
          {player.number != null && <span className="ml-1.5 text-gray-300">#{player.number}</span>}
          {" · "}Age {player.age}
        </p>
      </div>
    </Link>
  );
}

export default function TeamPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData]           = useState<TeamData | null>(null);
  const [fixtures, setFixtures]   = useState<OddsEvent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const teamName = decodeURIComponent(params.id);

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
        setFixtures((eventsData.events as OddsEvent[]).filter(
          (e) => {
            const hn = norm(e.homeTeam), an = norm(e.awayTeam);
            return hn === nn || an === nn || hn.includes(nn) || nn.includes(hn) || an.includes(nn) || nn.includes(an);
          }
        ));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id, teamName]);

  const formChars = (data?.stats?.form ?? "").slice(-5).split("") as ("W" | "D" | "L")[];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          <button onClick={() => router.back()} className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700">
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
              <Shield className="mb-3 h-12 w-12 text-gray-200" />
              <p className="font-semibold text-gray-700">Team not found</p>
              <p className="mt-1 text-sm text-gray-400">"{teamName}" could not be found.</p>
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
                        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">{data.team.name}</h1>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-400">
                          {data.stats?.league && (
                            <Link href={`/leagues/${data.stats.league.id}`} className="flex items-center gap-1.5 hover:text-gray-700">
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
                        <span className="text-xs uppercase tracking-widest text-gray-400">Form</span>
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
                          : "border-transparent text-gray-400 hover:text-gray-700"
                      }`}
                    >
                      {tab === "overview" && <BarChart3 className="h-3.5 w-3.5" />}
                      {tab === "squad"    && <Users className="h-3.5 w-3.5" />}
                      {tab === "fixtures" && <Calendar className="h-3.5 w-3.5" />}
                      {tab}
                      {tab === "fixtures" && fixtures.length > 0 && (
                        <span className="ml-1 rounded-full bg-bg-border px-1.5 py-0.5 text-[10px] font-bold text-gray-400">{fixtures.length}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Overview */}
              {activeTab === "overview" && (
                <div className="space-y-8">
                  {data.stats && (
                    <>
                      <div>
                        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Season Stats</h2>
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
                              <div className="text-xl font-extrabold text-gray-900">{s.value}</div>
                              <div className="mt-0.5 text-[11px] text-gray-400">{s.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {Object.values(data.squad).flat().length > 0 && (
                    <div>
                      <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Key Players</h2>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {Object.values(data.squad).flat().slice(0, 6).map((p) => <PlayerCard key={p.id} player={p} />)}
                      </div>
                      <button onClick={() => setActiveTab("squad")} className="mt-3 text-xs font-semibold text-accent-green hover:underline">
                        View full squad →
                      </button>
                    </div>
                  )}

                  {fixtures.length > 0 && (
                    <div>
                      <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Next Fixture</h2>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <PredictionCard event={fixtures[0]} />
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
                        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
                          {group} <span className="ml-1 font-normal normal-case text-gray-300">({players.length})</span>
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
                <div>
                  {fixtures.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {fixtures.map((e) => <PredictionCard key={e.id} event={e} />)}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-bg-border bg-bg-card py-16 text-center shadow-sm">
                      <List className="mb-3 h-10 w-10 text-gray-300" />
                      <p className="text-sm text-gray-400">No upcoming fixtures found</p>
                    </div>
                  )}
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
