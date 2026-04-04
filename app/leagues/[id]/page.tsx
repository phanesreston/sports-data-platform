"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Target } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Tab = "standings" | "topscorers" | "topassists";

interface Standing {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  form: string;
  description: string | null;
  all:  { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
}

interface TopScorer {
  player: { id: number; name: string; photo: string; nationality: string; age: number };
  statistics: {
    team:   { id: number; name: string; logo: string };
    league: { id: number; name: string };
    games:  { appearences: number | null };
    goals:  { total: number | null; assists: number | null };
  }[];
}

interface LeagueData {
  league:      { id: number; name: string; logo: string; country: string; season: number };
  standings:   Standing[];
  topScorers:  TopScorer[];
  topAssists:  TopScorer[];
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

const ZONE_COLORS: Record<string, string> = {
  "champions league": "border-l-4 border-l-blue-500",
  "europa league":    "border-l-4 border-l-orange-400",
  "conference":       "border-l-4 border-l-teal-400",
  "relegation":       "border-l-4 border-l-red-400",
  "promotion":        "border-l-4 border-l-emerald-500",
};

function zoneClass(description: string | null): string {
  if (!description) return "";
  const lower = description.toLowerCase();
  for (const [key, cls] of Object.entries(ZONE_COLORS)) {
    if (lower.includes(key)) return cls;
  }
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

export default function LeaguePage({ params }: { params: { id: string } }) {
  const [data, setData]       = useState<LeagueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("standings");

  useEffect(() => {
    Promise.all([
      fetch(`/api/football/standings?league=${params.id}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/football/topscorers?league=${params.id}`).then((r) => r.ok ? r.json() : null),
    ])
      .then(([standingsData, scorersData]) => {
        if (!standingsData || standingsData.error) { setNotFound(true); return; }
        setData({
          league:     standingsData.league,
          standings:  standingsData.standings ?? [],
          topScorers: scorersData?.topScorers ?? [],
          topAssists: scorersData?.topAssists ?? [],
        });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          <Link href="/?sport=football" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700">
            <ChevronLeft className="h-4 w-4" /> Football
          </Link>

          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
          )}

          {!loading && notFound && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-bg-border bg-bg-card py-20 text-center shadow-sm">
              <Target className="mb-3 h-12 w-12 text-gray-200" />
              <p className="font-semibold text-gray-700">League not found</p>
              <Link href="/" className="mt-4 text-sm font-semibold text-accent-green hover:underline">← Back to predictions</Link>
            </div>
          )}

          {!loading && data && (
            <>
              {/* Hero */}
              <div className="mb-6 overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                <div className="h-1.5 w-full bg-emerald-200" />
                <div className="flex items-center gap-5 p-6 sm:p-8">
                  <div className="relative h-16 w-16 shrink-0">
                    <Image src={data.league.logo} alt={data.league.name} fill className="object-contain" sizes="64px" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">{data.league.name}</h1>
                    <p className="mt-1 text-sm text-gray-400">{data.league.country} · {data.league.season}/{String(data.league.season + 1).slice(2)} Season</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="mb-6 border-b border-bg-border">
                <div className="-mb-px flex gap-1">
                  {(["standings", "topscorers", "topassists"] as Tab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                        activeTab === tab
                          ? "border-accent-green text-accent-green"
                          : "border-transparent text-gray-400 hover:text-gray-700"
                      }`}
                    >
                      {tab === "standings"  && "Table"}
                      {tab === "topscorers" && "Top Scorers"}
                      {tab === "topassists" && "Top Assists"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Standings table */}
              {activeTab === "standings" && (
                <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-bg-border text-left text-xs text-gray-400">
                          <th className="px-4 py-3 font-medium w-8">#</th>
                          <th className="px-4 py-3 font-medium">Team</th>
                          <th className="px-3 py-3 text-center font-medium">P</th>
                          <th className="px-3 py-3 text-center font-medium">W</th>
                          <th className="px-3 py-3 text-center font-medium">D</th>
                          <th className="px-3 py-3 text-center font-medium">L</th>
                          <th className="px-3 py-3 text-center font-medium">GF</th>
                          <th className="px-3 py-3 text-center font-medium">GA</th>
                          <th className="px-3 py-3 text-center font-medium">GD</th>
                          <th className="px-3 py-3 text-center font-medium font-bold">Pts</th>
                          <th className="px-4 py-3 font-medium">Form</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-bg-border">
                        {data.standings.map((row) => (
                          <tr key={row.team.id} className={`transition-colors hover:bg-gray-50 ${zoneClass(row.description)}`}>
                            <td className="px-4 py-3 text-center text-xs font-semibold text-gray-400">{row.rank}</td>
                            <td className="px-4 py-3">
                              <Link href={`/teams/${encodeURIComponent(row.team.name)}`} className="flex items-center gap-2.5 group">
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
                  {/* Zone legend */}
                  <div className="flex flex-wrap gap-4 border-t border-bg-border px-4 py-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1.5"><span className="h-3 w-1 rounded-full bg-blue-500" />Champions League</span>
                    <span className="flex items-center gap-1.5"><span className="h-3 w-1 rounded-full bg-orange-400" />Europa League</span>
                    <span className="flex items-center gap-1.5"><span className="h-3 w-1 rounded-full bg-red-400" />Relegation</span>
                  </div>
                </div>
              )}

              {/* Top scorers / assists */}
              {(activeTab === "topscorers" || activeTab === "topassists") && (
                <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                  {(activeTab === "topscorers" ? data.topScorers : data.topAssists).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <p className="text-sm text-gray-400">No data available</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-bg-border">
                      {(activeTab === "topscorers" ? data.topScorers : data.topAssists).map((item, i) => {
                        const stat = item.statistics[0];
                        const value = activeTab === "topscorers" ? stat?.goals.total : stat?.goals.assists;
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
                                  {stat?.games.appearences != null && (
                                    <><span>·</span><span>{stat.games.appearences} apps</span></>
                                  )}
                                </div>
                              </div>
                            </Link>
                            <div className="shrink-0 text-right">
                              <span className="text-xl font-extrabold text-gray-900">{value ?? "—"}</span>
                              <p className="text-[10px] text-gray-400">{activeTab === "topscorers" ? "goals" : "assists"}</p>
                            </div>
                          </div>
                        );
                      })}
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
