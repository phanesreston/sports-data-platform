"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Trophy, Calendar, BarChart3, Star, List } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PredictionCard from "@/components/PredictionCard";
import { SAMPLE_LEAGUES, type LeagueProfile, type StandingsRow, type Zone } from "@/data/sampleLeagues";
import { SAMPLE_ODDS } from "@/data/sampleOdds";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = "standings" | "upcoming" | "stats" | "performers";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "standings",  label: "Standings",      icon: <List className="h-3.5 w-3.5" /> },
  { id: "upcoming",   label: "Upcoming",        icon: <Calendar className="h-3.5 w-3.5" /> },
  { id: "stats",      label: "Stats",           icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { id: "performers", label: "Top Performers",  icon: <Star className="h-3.5 w-3.5" /> },
];

// ─── Sport styles ─────────────────────────────────────────────────────────────

const SPORT_STYLES: Record<string, { label: string; color: string; bg: string; sportHref: string }> = {
  football:          { label: "Football",   color: "text-emerald-700", bg: "bg-emerald-50", sportHref: "/?sport=football" },
  basketball:        { label: "Basketball", color: "text-orange-700",  bg: "bg-orange-50",  sportHref: "/?sport=basketball" },
  tennis:            { label: "Tennis",     color: "text-amber-700",   bg: "bg-amber-50",   sportHref: "/?sport=tennis" },
  american_football: { label: "NFL",        color: "text-blue-700",    bg: "bg-blue-50",    sportHref: "/?sport=american_football" },
  cricket:           { label: "Cricket",    color: "text-pink-700",    bg: "bg-pink-50",    sportHref: "/?sport=cricket" },
};

// ─── Zone colours ─────────────────────────────────────────────────────────────

const ZONE_BAR: Record<NonNullable<Zone>, string> = {
  champions:  "bg-accent-green",
  europa:     "bg-amber-500",
  playoff:    "bg-blue-500",
  relegation: "bg-red-500",
};

const ZONE_LABEL: Record<NonNullable<Zone>, string> = {
  champions:  "Top zone",
  europa:     "Europa / secondary",
  playoff:    "Play-in / wildcard",
  relegation: "Relegation zone",
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</span>
      {count !== undefined && (
        <span className="rounded-full bg-bg-border px-2 py-0.5 text-[10px] font-bold text-gray-400">
          {count}
        </span>
      )}
      <div className="flex-1 border-t border-bg-border" />
    </div>
  );
}

function ZoneLegend({ zones }: { zones: NonNullable<Zone>[] }) {
  const unique = Array.from(new Set(zones));
  if (unique.length === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-4">
      {unique.map((z) => (
        <div key={z} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${ZONE_BAR[z as NonNullable<Zone>]}`} />
          <span className="text-xs text-gray-400">{ZONE_LABEL[z as NonNullable<Zone>]}</span>
        </div>
      ))}
    </div>
  );
}

function StandingsTable({
  rows,
  headers,
  sport,
}: {
  rows: StandingsRow[];
  headers: string[];
  sport: string;
}) {
  const isTennis = sport === "tennis";

  return (
    <div className="overflow-x-auto rounded-xl border border-bg-border bg-bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-bg-border text-[11px] font-bold uppercase tracking-wider text-gray-400">
            <th className="w-8 py-3 pl-4 text-center">#</th>
            <th className="py-3 pl-3 text-left">{isTennis ? "Player" : "Team"}</th>
            {headers.map((h) => (
              <th key={h} className="px-3 py-3 text-right">{h}</th>
            ))}
            {!isTennis && <th className="py-3 pr-4 text-right">Form</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const zoneBar = row.zone ? ZONE_BAR[row.zone] : null;
            const href = row.teamId
              ? `/teams/${row.teamId}`
              : row.playerId
              ? `/athletes/${row.playerId}`
              : null;

            return (
              <tr
                key={i}
                className={`border-b border-bg-border/50 transition-colors last:border-0 ${
                  href ? "hover:bg-bg-base" : ""
                }`}
              >
                {/* Position + zone bar */}
                <td className="relative py-3 pl-2 text-center">
                  {zoneBar && (
                    <span className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r ${zoneBar}`} />
                  )}
                  <span className="text-xs font-bold text-gray-400">{row.position}</span>
                </td>

                {/* Name */}
                <td className="py-3 pl-3">
                  {href ? (
                    <Link href={href} className="font-semibold text-gray-800 transition-colors hover:text-accent-green">
                      {row.name}
                    </Link>
                  ) : (
                    <span className="font-semibold text-gray-800">{row.name}</span>
                  )}
                </td>

                {/* Stats */}
                {row.stats.map((val, j) => (
                  <td key={j} className="px-3 py-3 text-right font-mono text-xs text-gray-500">
                    {val}
                  </td>
                ))}

                {/* Form dots */}
                {!isTennis && (
                  <td className="py-3 pr-4 text-right">
                    <div className="flex justify-end gap-0.5">
                      {(row.form ?? []).map((r, fi) => (
                        <span
                          key={fi}
                          className={`flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold ${
                            r === "W"
                              ? "bg-emerald-100 text-emerald-700"
                              : r === "D"
                              ? "bg-gray-100 text-gray-500"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LeaguePage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<Tab>("standings");

  const league = SAMPLE_LEAGUES.find((l) => l.id === params.id);

  if (!league) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">League not found</p>
            <Link href="/" className="mt-4 inline-block text-sm text-accent-green hover:underline">
              ← Back to predictions
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const style = SPORT_STYLES[league.sport] ?? SPORT_STYLES.football;
  const fixtures = SAMPLE_ODDS.filter((e) => e.league === league.name);
  const allZones = league.groups
    .flatMap((g) => g.rows.map((r) => r.zone))
    .filter((z): z is NonNullable<Zone> => z != null);
  const hasPerformers = (league.topPerformers?.length ?? 0) > 0;

  // Visible tabs — hide "Top Performers" if no data
  const visibleTabs = TABS.filter((t) => t.id !== "performers" || hasPerformers);


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
            <div className={`h-1.5 w-full ${style.bg.replace("50", "200")}`} />
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${style.bg} ${style.color}`}>
                      {style.label}
                    </span>
                    <span className="text-sm text-gray-400">{league.country}</span>
                  </div>
                  <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">{league.name}</h1>
                  <p className="mt-2 text-sm text-gray-400">{league.season} Season</p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-bg-border bg-bg-base px-4 py-3">
                  <Trophy className="h-4 w-4 text-accent-green" />
                  <div>
                    <div className="text-xs text-gray-400">Teams / Players</div>
                    <div className="font-bold text-gray-900">
                      {league.groups.reduce((sum, g) => sum + g.rows.length, 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="mb-8 border-b border-bg-border">
            <div className="scrollbar-none -mb-px flex gap-1 overflow-x-auto">
              {visibleTabs.map((tab) => (
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
                  {tab.id === "upcoming" && fixtures.length > 0 && (
                    <span className="ml-1 rounded-full bg-bg-border px-1.5 py-0.5 text-[10px] font-bold text-gray-400">
                      {fixtures.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Standings tab ─────────────────────────────────────────────── */}
          {activeTab === "standings" && (
            <div className="space-y-6">
              {league.groups.map((group, gi) => (
                <div key={gi}>
                  {group.label && (
                    <h3 className="mb-3 text-sm font-bold text-gray-500">{group.label}</h3>
                  )}
                  <StandingsTable
                    rows={group.rows}
                    headers={league.columnHeaders}
                    sport={league.sport}
                  />
                </div>
              ))}
              <ZoneLegend zones={allZones} />
            </div>
          )}

          {/* ── Upcoming tab ──────────────────────────────────────────────── */}
          {activeTab === "upcoming" && (
            <div>
              {fixtures.length > 0 ? (
                <>
                  <SectionHeader label="Upcoming Fixtures" count={fixtures.length} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    {fixtures.map((event) => (
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

          {/* ── Stats tab ─────────────────────────────────────────────────── */}
          {activeTab === "stats" && (
            <div className="space-y-8">
              {/* Overview stat cards */}
              {league.overview && league.overview.length > 0 && (
                <div>
                  <SectionHeader label="Season Overview" />
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {league.overview.map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-xl border border-bg-border bg-bg-card p-4 shadow-sm"
                      >
                        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                          {stat.label}
                        </div>
                        <div className="text-xl font-extrabold text-gray-900">{stat.value}</div>
                        {stat.sub && (
                          <div className="mt-0.5 text-[11px] text-gray-400">{stat.sub}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Derived insights from standings */}
              <LeagueInsights league={league} />
            </div>
          )}

          {/* ── Top performers tab ────────────────────────────────────────── */}
          {activeTab === "performers" && hasPerformers && (
            <div>
              <SectionHeader label="Top Performers" />
              <div className="grid gap-6 sm:grid-cols-2">
                {league.topPerformers!.map((section) => (
                  <div
                    key={section.label}
                    className="overflow-hidden rounded-xl border border-bg-border bg-bg-card shadow-sm"
                  >
                    <div className="border-b border-bg-border px-4 py-3">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                        {section.label}
                        <span className="ml-2 font-normal text-gray-300 normal-case tracking-normal">
                          — {section.unit}
                        </span>
                      </h3>
                    </div>
                    <div>
                      {section.entries.map((entry, i) => {
                        const href = entry.playerId
                          ? `/athletes/${entry.playerId}`
                          : entry.teamId
                          ? `/teams/${entry.teamId}`
                          : null;
                        const maxVal = Number(section.entries[0].value);
                        const pct = maxVal > 0 ? Math.round((Number(entry.value) / maxVal) * 100) : 0;

                        return (
                          <div
                            key={i}
                            className={`px-4 py-3 ${i !== 0 ? "border-t border-bg-border" : ""}`}
                          >
                            <div className="mb-1.5 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="w-5 shrink-0 text-center text-xs font-bold text-gray-400">
                                  {i + 1}
                                </span>
                                <div className="min-w-0">
                                  {href ? (
                                    <Link
                                      href={href}
                                      className="block truncate text-sm font-semibold text-gray-800 transition-colors hover:text-accent-green"
                                    >
                                      {entry.name}
                                    </Link>
                                  ) : (
                                    <span className="block truncate text-sm font-semibold text-gray-800">
                                      {entry.name}
                                    </span>
                                  )}
                                  {entry.teamName && (
                                    entry.teamId ? (
                                      <Link
                                        href={`/teams/${entry.teamId}`}
                                        className="text-xs text-gray-400 transition-colors hover:text-gray-600"
                                      >
                                        {entry.teamName}
                                      </Link>
                                    ) : (
                                      <span className="text-xs text-gray-400">{entry.teamName}</span>
                                    )
                                  )}
                                </div>
                              </div>
                              <div className="shrink-0 text-right">
                                <span className="text-sm font-extrabold text-accent-green">
                                  {entry.value}
                                </span>
                                <span className="ml-1 text-xs text-gray-400">{section.unit}</span>
                              </div>
                            </div>
                            {/* Progress bar */}
                            <div className="ml-8 h-1 overflow-hidden rounded-full bg-bg-border">
                              <div
                                className="h-full rounded-full bg-accent-green/60 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
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

// ─── League Insights (computed from standings) ───────────────────────────────

function LeagueInsights({ league }: { league: LeagueProfile }) {
  const sport = league.sport;
  const allRows = league.groups.flatMap((g) => g.rows);

  if (allRows.length === 0) return null;

  // Football: headers = ["P","W","D","L","GF","GA","GD","Pts"]
  if (sport === "football") {
    const sorted = [...allRows].sort((a, b) => Number(b.stats[7]) - Number(a.stats[7]));
    const bestAttack = [...allRows].sort((a, b) => Number(b.stats[4]) - Number(a.stats[4]))[0];
    const bestDefense = [...allRows].sort((a, b) => Number(a.stats[5]) - Number(b.stats[5]))[0];
    const bottom = allRows[allRows.length - 1];

    return (
      <div>
        <SectionHeader label="League Insights" />
        <div className="grid gap-4 sm:grid-cols-2">
          <InsightCard title="Current Leader" teamHref={sorted[0].teamId ? `/teams/${sorted[0].teamId}` : null} name={sorted[0].name} value={`${sorted[0].stats[7]} pts`} detail={`${sorted[0].stats[1]}W · ${sorted[0].stats[2]}D · ${sorted[0].stats[3]}L`} color="text-accent-green" />
          <InsightCard title="Best Attack" teamHref={bestAttack.teamId ? `/teams/${bestAttack.teamId}` : null} name={bestAttack.name} value={`${bestAttack.stats[4]} goals`} detail="most scored" color="text-orange-500" />
          <InsightCard title="Best Defense" teamHref={bestDefense.teamId ? `/teams/${bestDefense.teamId}` : null} name={bestDefense.name} value={`${bestDefense.stats[5]} conceded`} detail="fewest against" color="text-blue-500" />
          <InsightCard title="Bottom of Table" teamHref={bottom.teamId ? `/teams/${bottom.teamId}` : null} name={bottom.name} value={`${bottom.stats[7]} pts`} detail={`${bottom.stats[1]}W · ${bottom.stats[2]}D · ${bottom.stats[3]}L`} color="text-red-500" />
        </div>
      </div>
    );
  }

  // Basketball: headers = ["W","L","PCT","GB","Home","Away","Streak"]
  if (sport === "basketball") {
    const allConf = league.groups.map((g) => ({
      label: g.label ?? "Conference",
      leader: g.rows[0],
    }));
    const bestPct = [...allRows].sort((a, b) =>
      Number(String(b.stats[2]).replace(".", "0.")) - Number(String(a.stats[2]).replace(".", "0."))
    )[0];
    const worstPct = [...allRows].sort((a, b) =>
      Number(String(a.stats[2]).replace(".", "0.")) - Number(String(b.stats[2]).replace(".", "0."))
    )[0];

    return (
      <div>
        <SectionHeader label="League Insights" />
        <div className="grid gap-4 sm:grid-cols-2">
          {allConf.map((c) => (
            <InsightCard key={c.label} title={`${c.label} Leader`} teamHref={c.leader.teamId ? `/teams/${c.leader.teamId}` : null} name={c.leader.name} value={`${c.leader.stats[0]}-${c.leader.stats[1]}`} detail={`${c.leader.stats[2]} win %`} color="text-accent-green" />
          ))}
          <InsightCard title="Best Win %" teamHref={bestPct.teamId ? `/teams/${bestPct.teamId}` : null} name={bestPct.name} value={`${bestPct.stats[2]}`} detail={`${bestPct.stats[0]}W - ${bestPct.stats[1]}L`} color="text-orange-500" />
          <InsightCard title="Needs Improvement" teamHref={worstPct.teamId ? `/teams/${worstPct.teamId}` : null} name={worstPct.name} value={`${worstPct.stats[2]}`} detail={`${worstPct.stats[0]}W - ${worstPct.stats[1]}L`} color="text-red-500" />
        </div>
      </div>
    );
  }

  // NFL: headers = ["W","L","T","PCT","PF","PA","Diff"]
  if (sport === "american_football") {
    const allConf = league.groups.map((g) => ({
      label: g.label ?? "Conference",
      leader: g.rows[0],
    }));
    const bestOffense = [...allRows].sort((a, b) => Number(b.stats[4]) - Number(a.stats[4]))[0];
    const bestDefense = [...allRows].sort((a, b) => Number(a.stats[5]) - Number(b.stats[5]))[0];

    return (
      <div>
        <SectionHeader label="League Insights" />
        <div className="grid gap-4 sm:grid-cols-2">
          {allConf.map((c) => (
            <InsightCard key={c.label} title={`${c.label} Leader`} teamHref={c.leader.teamId ? `/teams/${c.leader.teamId}` : null} name={c.leader.name} value={`${c.leader.stats[0]}-${c.leader.stats[1]}`} detail={`${c.leader.stats[3]} win %`} color="text-accent-green" />
          ))}
          <InsightCard title="Top Offense" teamHref={bestOffense.teamId ? `/teams/${bestOffense.teamId}` : null} name={bestOffense.name} value={`${bestOffense.stats[4]} pts`} detail="most points scored" color="text-orange-500" />
          <InsightCard title="Top Defense" teamHref={bestDefense.teamId ? `/teams/${bestDefense.teamId}` : null} name={bestDefense.name} value={`${bestDefense.stats[5]} pts`} detail="fewest points allowed" color="text-blue-500" />
        </div>
      </div>
    );
  }

  // Cricket: headers = ["M","W","L","NR","Pts","NRR"]
  if (sport === "cricket") {
    const sorted = [...allRows].sort((a, b) => Number(b.stats[4]) - Number(a.stats[4]));
    const bestNRR = [...allRows].sort((a, b) =>
      Number(String(b.stats[5]).replace("+", "")) - Number(String(a.stats[5]).replace("+", ""))
    )[0];

    return (
      <div>
        <SectionHeader label="League Insights" />
        <div className="grid gap-4 sm:grid-cols-2">
          <InsightCard title="Points Leader" teamHref={sorted[0].teamId ? `/teams/${sorted[0].teamId}` : null} name={sorted[0].name} value={`${sorted[0].stats[4]} pts`} detail={`${sorted[0].stats[1]}W · ${sorted[0].stats[2]}L`} color="text-accent-green" />
          <InsightCard title="Best NRR" teamHref={bestNRR.teamId ? `/teams/${bestNRR.teamId}` : null} name={bestNRR.name} value={`${bestNRR.stats[5]}`} detail="net run rate" color="text-orange-500" />
          <InsightCard title="Most Wins" teamHref={sorted[0].teamId ? `/teams/${sorted[0].teamId}` : null} name={sorted[0].name} value={`${sorted[0].stats[1]} wins`} detail={`from ${sorted[0].stats[0]} matches`} color="text-amber-600" />
          <InsightCard title="Qualification Zone" name={`Top ${Math.ceil(allRows.length / 2.5)} advance`} value="Playoff" detail="to knockout stage" color="text-blue-500" />
        </div>
      </div>
    );
  }

  // Tennis: headers = ["Ranking","Points","W","L","Win %"]
  if (sport === "tennis") {
    const no1 = allRows[0];
    const mostWins = [...allRows].sort((a, b) => Number(b.stats[2]) - Number(a.stats[2]))[0];
    const bestWinPct = [...allRows].sort((a, b) =>
      parseInt(String(b.stats[4])) - parseInt(String(a.stats[4]))
    )[0];

    return (
      <div>
        <SectionHeader label="League Insights" />
        <div className="grid gap-4 sm:grid-cols-2">
          <InsightCard title="World No. 1" teamHref={no1.playerId ? `/athletes/${no1.playerId}` : null} name={no1.name} value={`${no1.stats[1]} pts`} detail="ATP ranking points" color="text-accent-green" />
          <InsightCard title="Most Wins" teamHref={mostWins.playerId ? `/athletes/${mostWins.playerId}` : null} name={mostWins.name} value={`${mostWins.stats[2]} wins`} detail={`${mostWins.stats[3]} losses`} color="text-orange-500" />
          <InsightCard title="Best Win %" teamHref={bestWinPct.playerId ? `/athletes/${bestWinPct.playerId}` : null} name={bestWinPct.name} value={String(bestWinPct.stats[4])} detail={`${bestWinPct.stats[2]}W - ${bestWinPct.stats[3]}L`} color="text-amber-600" />
          <InsightCard title="Points Gap" name={`${allRows[0]?.name} vs #2`} value={`${Number(allRows[0]?.stats[1]) - Number(allRows[1]?.stats[1])} pts`} detail="lead at top" color="text-blue-500" />
        </div>
      </div>
    );
  }

  return null;
}

function InsightCard({
  title,
  name,
  value,
  detail,
  color,
  teamHref,
}: {
  title: string;
  name: string;
  value: string;
  detail: string;
  color: string;
  teamHref?: string | null;
}) {
  return (
    <div className="rounded-xl border border-bg-border bg-bg-card p-4 shadow-sm">
      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">{title}</div>
      {teamHref ? (
        <Link href={teamHref} className="block text-sm font-semibold text-gray-800 transition-colors hover:text-accent-green">
          {name}
        </Link>
      ) : (
        <div className="text-sm font-semibold text-gray-800">{name}</div>
      )}
      <div className={`mt-1 text-lg font-extrabold ${color}`}>{value}</div>
      <div className="mt-0.5 text-xs text-gray-400">{detail}</div>
    </div>
  );
}
