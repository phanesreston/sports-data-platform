"use client";

import Link from "next/link";
import { ChevronLeft, Trophy } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PredictionCard from "@/components/PredictionCard";
import { SAMPLE_LEAGUES, type StandingsRow, type Zone } from "@/data/sampleLeagues";
import { SAMPLE_ODDS } from "@/data/sampleOdds";

const SPORT_STYLES: Record<string, { label: string; color: string; bg: string; sportHref: string }> = {
  football:          { label: "Football",   color: "text-emerald-400", bg: "bg-emerald-400/10", sportHref: "/?sport=football" },
  basketball:        { label: "Basketball", color: "text-orange-400",  bg: "bg-orange-400/10",  sportHref: "/?sport=basketball" },
  tennis:            { label: "Tennis",     color: "text-yellow-400",  bg: "bg-yellow-400/10",  sportHref: "/?sport=tennis" },
  american_football: { label: "NFL",        color: "text-blue-400",    bg: "bg-blue-400/10",    sportHref: "/?sport=american_football" },
  cricket:           { label: "Cricket",    color: "text-pink-400",    bg: "bg-pink-400/10",    sportHref: "/?sport=cricket" },
};

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

function ZoneLegend({ zones }: { zones: NonNullable<Zone>[] }) {
  const unique = [...new Set(zones)];
  if (unique.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-3">
      {unique.map((z) => (
        <div key={z} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${ZONE_BAR[z]}`} />
          <span className="text-xs text-slate-600">{ZONE_LABEL[z]}</span>
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
    <div className="overflow-x-auto rounded-xl border border-bg-border bg-bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-bg-border text-[11px] font-bold uppercase tracking-wider text-slate-600">
            <th className="w-8 py-3 pl-4 text-center">#</th>
            <th className="py-3 pl-3 text-left">
              {isTennis ? "Player" : "Team"}
            </th>
            {headers.map((h) => (
              <th key={h} className="px-3 py-3 text-right">
                {h}
              </th>
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
                  href ? "hover:bg-bg-border/30" : ""
                }`}
              >
                {/* Position + zone bar */}
                <td className="relative py-3 pl-2 text-center">
                  {zoneBar && (
                    <span className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r ${zoneBar}`} />
                  )}
                  <span className="text-xs font-bold text-slate-600">{row.position}</span>
                </td>

                {/* Name */}
                <td className="py-3 pl-3">
                  {href ? (
                    <Link
                      href={href}
                      className="font-semibold text-white transition-colors hover:text-accent-green"
                    >
                      {row.name}
                    </Link>
                  ) : (
                    <span className="font-semibold text-white">{row.name}</span>
                  )}
                </td>

                {/* Stats */}
                {row.stats.map((val, j) => (
                  <td key={j} className="px-3 py-3 text-right font-mono text-xs text-slate-400">
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
                              ? "bg-emerald-500/20 text-emerald-400"
                              : r === "D"
                              ? "bg-slate-700 text-slate-500"
                              : "bg-red-500/20 text-red-400"
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

export default function LeaguePage({ params }: { params: { id: string } }) {
  const league = SAMPLE_LEAGUES.find((l) => l.id === params.id);

  if (!league) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">League not found</p>
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

          {/* Hero */}
          <div className="mb-8 overflow-hidden rounded-2xl border border-bg-border bg-bg-card">
            <div className={`h-1.5 w-full ${style.bg.replace("/10", "")}`} />
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${style.bg} ${style.color}`}>
                      {style.label}
                    </span>
                    <span className="text-sm text-slate-500">{league.country}</span>
                  </div>
                  <h1 className="text-3xl font-extrabold text-white sm:text-4xl">{league.name}</h1>
                  <p className="mt-2 text-sm text-slate-500">{league.season} Season</p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-bg-border bg-bg-border/50 px-4 py-3">
                  <Trophy className="h-4 w-4 text-accent-green" />
                  <div>
                    <div className="text-xs text-slate-600">Teams / Players</div>
                    <div className="font-bold text-white">
                      {league.groups.reduce((sum, g) => sum + g.rows.length, 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Standings */}
          <div className="mb-10">
            <SectionHeader label="Standings" />
            <div className="space-y-6">
              {league.groups.map((group, gi) => (
                <div key={gi}>
                  {group.label && (
                    <h3 className="mb-2 text-sm font-bold text-slate-400">{group.label}</h3>
                  )}
                  <StandingsTable
                    rows={group.rows}
                    headers={league.columnHeaders}
                    sport={league.sport}
                  />
                </div>
              ))}
            </div>
            <ZoneLegend zones={allZones} />
          </div>

          {/* Top performers */}
          {league.topPerformers && league.topPerformers.length > 0 && (
            <div className="mb-10">
              <SectionHeader label="Top Performers" />
              <div className="grid gap-6 sm:grid-cols-2">
                {league.topPerformers.map((section) => (
                  <div
                    key={section.label}
                    className="overflow-hidden rounded-xl border border-bg-border bg-bg-card"
                  >
                    <div className="border-b border-bg-border px-4 py-3">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        {section.label}
                      </h3>
                    </div>
                    <div>
                      {section.entries.map((entry, i) => {
                        const href = entry.playerId
                          ? `/athletes/${entry.playerId}`
                          : entry.teamId
                          ? `/teams/${entry.teamId}`
                          : null;
                        return (
                          <div
                            key={i}
                            className={`flex items-center justify-between gap-3 px-4 py-3 ${
                              i !== 0 ? "border-t border-bg-border" : ""
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-5 text-center text-xs font-bold text-slate-600">
                                {i + 1}
                              </span>
                              <div className="min-w-0">
                                {href ? (
                                  <Link
                                    href={href}
                                    className="block truncate text-sm font-semibold text-white transition-colors hover:text-accent-green"
                                  >
                                    {entry.name}
                                  </Link>
                                ) : (
                                  <span className="block truncate text-sm font-semibold text-white">
                                    {entry.name}
                                  </span>
                                )}
                                {entry.teamId ? (
                                  <Link
                                    href={`/teams/${entry.teamId}`}
                                    className="text-xs text-slate-500 transition-colors hover:text-slate-300"
                                  >
                                    {entry.teamName}
                                  </Link>
                                ) : (
                                  <span className="text-xs text-slate-500">{entry.teamName}</span>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className="text-sm font-extrabold text-accent-green">
                                {entry.value}
                              </span>
                              <span className="ml-1 text-xs text-slate-600">{section.unit}</span>
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

          {/* Upcoming fixtures */}
          {fixtures.length > 0 && (
            <div>
              <SectionHeader label="Upcoming Fixtures" count={fixtures.length} />
              <div className="grid gap-4 sm:grid-cols-2">
                {fixtures.map((event) => (
                  <PredictionCard key={event.id} event={event} />
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
