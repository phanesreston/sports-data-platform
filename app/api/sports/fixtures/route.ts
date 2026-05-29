/**
 * /api/sports/fixtures — upcoming fixture data served entirely from the DB.
 *
 * No live API calls are made at request time. All data is populated by the
 * sync script (npm run db:sync) or the /api/admin/sync endpoint:
 *   - Upcoming fixtures   → fixtures table (status = NS)
 *   - Predictions         → fixture_predictions table
 *   - Team stats + H2H    → computed from completed fixtures in DB
 *   - Team logos          → teams table via league_teams
 *
 * Run `npm run db:sync` (or SYNC_STEP=predictions for predictions only)
 * to refresh the data. Recommended: nightly cron.
 */

import { NextRequest, NextResponse } from "next/server";
import type { TeamStats, H2HStats } from "@/lib/types";
import { placeholderStats } from "@/lib/transformers";
import type { Market, MarketOption } from "@/lib/types";
import { db, teams, leagueTeams, fixtures as fixturesTable, leagues, fixturePredictions } from "@/lib/db";
import { alias } from "drizzle-orm/sqlite-core";
import { and, eq, inArray, desc, or, gt, lt, asc } from "drizzle-orm";
import type { ApiFixture } from "@/lib/types";

const SEASON = (() => {
  const now = new Date();
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
})();

const OVERVIEW_LEAGUE_IDS = [1, 39, 140, 135, 78, 61, 2, 3];

const LEAGUE_META: Record<number, { name: string; country: string; logo: string }> = {
  1:   { name: "FIFA World Cup",        country: "World",   logo: "https://media.api-sports.io/football/leagues/1.png"   },
  39:  { name: "Premier League",        country: "England", logo: "https://media.api-sports.io/football/leagues/39.png"  },
  140: { name: "La Liga",               country: "Spain",   logo: "https://media.api-sports.io/football/leagues/140.png" },
  135: { name: "Serie A",               country: "Italy",   logo: "https://media.api-sports.io/football/leagues/135.png" },
  78:  { name: "Bundesliga",            country: "Germany", logo: "https://media.api-sports.io/football/leagues/78.png"  },
  61:  { name: "Ligue 1",               country: "France",  logo: "https://media.api-sports.io/football/leagues/61.png"  },
  2:   { name: "UEFA Champions League", country: "World",   logo: "https://media.api-sports.io/football/leagues/2.png"   },
  3:   { name: "UEFA Europa League",    country: "World",   logo: "https://media.api-sports.io/football/leagues/3.png"   },
};

export interface FixtureWithStats {
  fixture: ApiFixture;
  homeStats: TeamStats;
  awayStats: TeamStats;
  h2h: H2HStats;
  markets: Market[];
}

const COMPLETED = ["FT", "AET", "PEN"];

// ── DB helpers ────────────────────────────────────────────────────────────────

async function teamStatsFromDb(teamId: number, leagueId: number, season: number): Promise<TeamStats> {
  const rows = await db
    .select({
      homeTeamId: fixturesTable.homeTeamId,
      homeGoals:  fixturesTable.homeGoals,
      awayGoals:  fixturesTable.awayGoals,
    })
    .from(fixturesTable)
    .where(and(
      eq(fixturesTable.leagueId, leagueId),
      eq(fixturesTable.season, season),
      inArray(fixturesTable.status, COMPLETED),
      or(eq(fixturesTable.homeTeamId, teamId), eq(fixturesTable.awayTeamId, teamId))
    ))
    .orderBy(desc(fixturesTable.timestamp))
    .limit(38);

  if (rows.length === 0) return placeholderStats();

  let totalFor = 0, totalAgainst = 0;
  const formResults: ("W" | "D" | "L")[] = [];

  for (const row of rows) {
    const isHome       = row.homeTeamId === teamId;
    const goalsFor     = (isHome ? row.homeGoals : row.awayGoals) ?? 0;
    const goalsAgainst = (isHome ? row.awayGoals : row.homeGoals) ?? 0;
    totalFor     += goalsFor;
    totalAgainst += goalsAgainst;
    if (formResults.length < 5) {
      formResults.push(goalsFor > goalsAgainst ? "W" : goalsFor < goalsAgainst ? "L" : "D");
    }
  }

  return {
    form:        formResults.reverse(),
    avgScored:   Math.round((totalFor / rows.length) * 10) / 10,
    avgConceded: Math.round((totalAgainst / rows.length) * 10) / 10,
  };
}

async function h2hFromDb(homeTeamId: number, awayTeamId: number): Promise<H2HStats> {
  const rows = await db
    .select({ homeTeamId: fixturesTable.homeTeamId, homeGoals: fixturesTable.homeGoals, awayGoals: fixturesTable.awayGoals })
    .from(fixturesTable)
    .where(and(
      inArray(fixturesTable.status, COMPLETED),
      or(
        and(eq(fixturesTable.homeTeamId, homeTeamId), eq(fixturesTable.awayTeamId, awayTeamId)),
        and(eq(fixturesTable.homeTeamId, awayTeamId), eq(fixturesTable.awayTeamId, homeTeamId))
      )
    ))
    .orderBy(desc(fixturesTable.timestamp))
    .limit(10);

  let homeWins = 0, draws = 0, awayWins = 0;
  for (const row of rows) {
    const hg = row.homeGoals ?? 0, ag = row.awayGoals ?? 0;
    if (hg === ag) draws++;
    else if ((row.homeTeamId === homeTeamId && hg > ag) || (row.homeTeamId !== homeTeamId && ag > hg)) homeWins++;
    else awayWins++;
  }
  return { homeWins, draws, awayWins };
}

function marketsFromPrediction(
  homePct: number, drawPct: number, awayPct: number,
  advice: string | null, underOver: string | null,
  homeTeam: string, awayTeam: string
): Market[] {
  const pickLabel =
    homePct >= awayPct && homePct >= drawPct ? homeTeam :
    awayPct >= drawPct ? awayTeam : "Draw";

  const options: MarketOption[] = [
    { label: homeTeam, probability: homePct, pick: pickLabel === homeTeam },
    ...(drawPct > 0 ? [{ label: "Draw", probability: drawPct, pick: pickLabel === "Draw" } as MarketOption] : []),
    { label: awayTeam, probability: awayPct, pick: pickLabel === awayTeam },
  ];

  const markets: Market[] = [{
    name: "Match Result",
    options,
    bestOdds: 0,
    bestBookmaker: advice ?? "",
  }];

  if (underOver) {
    const other = underOver.startsWith("Under")
      ? underOver.replace("Under", "Over")
      : underOver.replace("Over", "Under");
    markets.push({
      name: "Goals Over/Under",
      options: [
        { label: underOver, probability: 60, pick: true },
        { label: other,     probability: 40, pick: false },
      ],
      bestOdds: 0,
      bestBookmaker: "",
    });
  }

  return markets;
}

// ── route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const leagueParam = req.nextUrl.searchParams.get("league");
  const leagueIds   = leagueParam
    ? OVERVIEW_LEAGUE_IDS.filter((id) => String(id) === leagueParam)
    : OVERVIEW_LEAGUE_IDS;

  console.log(`\n[fixtures] ── START (DB-only) ────────────────────────────`);
  console.log(`[fixtures] leagues: ${leagueIds.join(", ")}  season: ${SEASON}`);

  if (leagueIds.length === 0) {
    return NextResponse.json({ fixtures: [], teamLogoMap: {} });
  }

  const allFixtureStats: FixtureWithStats[] = [];
  const teamLogoMap: Record<string, { logo: string; id: number }> = {};

  // ── 1. Team logo map from DB ─────────────────────────────────────────────────
  const dbTeams = await db
    .select({ name: teams.name, logo: teams.logo, id: teams.id })
    .from(teams)
    .innerJoin(leagueTeams, eq(leagueTeams.teamId, teams.id))
    .where(and(inArray(leagueTeams.leagueId, leagueIds), eq(leagueTeams.season, SEASON)));

  for (const row of dbTeams) {
    if (row.logo) teamLogoMap[row.name] = { logo: row.logo, id: row.id };
  }
  console.log(`[fixtures] [DB] teamLogoMap: ${Object.keys(teamLogoMap).length} teams`);

  // ── 2. Upcoming fixtures with predictions from DB ────────────────────────────
  const nowSecs    = Math.floor(Date.now() / 1000);
  const tenDaysSecs = nowSecs + 10 * 86400;

  const homeTeam = alias(teams, "home_team");
  const awayTeam = alias(teams, "away_team");

  const rows = await db
    .select({
      fixtureId:     fixturesTable.id,
      date:          fixturesTable.date,
      timestamp:     fixturesTable.timestamp,
      status:        fixturesTable.status,
      round:         fixturesTable.round,
      season:        fixturesTable.season,
      homeGoals:     fixturesTable.homeGoals,
      awayGoals:     fixturesTable.awayGoals,
      homeTeamId:    fixturesTable.homeTeamId,
      awayTeamId:    fixturesTable.awayTeamId,
      homeTeamName:  homeTeam.name,
      homeTeamLogo:  homeTeam.logo,
      awayTeamName:  awayTeam.name,
      awayTeamLogo:  awayTeam.logo,
      leagueId:      fixturesTable.leagueId,
      leagueName:    leagues.name,
      leagueLogo:    leagues.logo,
      leagueCountry: leagues.country,
      homePct:       fixturePredictions.homePct,
      drawPct:       fixturePredictions.drawPct,
      awayPct:       fixturePredictions.awayPct,
      advice:        fixturePredictions.advice,
      underOver:     fixturePredictions.underOver,
    })
    .from(fixturesTable)
    .innerJoin(homeTeam, eq(homeTeam.id, fixturesTable.homeTeamId))
    .innerJoin(awayTeam, eq(awayTeam.id, fixturesTable.awayTeamId))
    .leftJoin(leagues,  eq(leagues.id,  fixturesTable.leagueId))
    .leftJoin(fixturePredictions, eq(fixturePredictions.fixtureId, fixturesTable.id))
    .where(and(
      eq(fixturesTable.status, "NS"),
      gt(fixturesTable.timestamp, nowSecs),
      lt(fixturesTable.timestamp, tenDaysSecs),
      inArray(fixturesTable.leagueId, leagueIds),
    ))
    .orderBy(asc(fixturesTable.timestamp))
    .limit(100);

  console.log(`[fixtures] [DB] ${rows.length} upcoming fixtures found`);

  // Supplement logo map with logos from fixture rows
  for (const row of rows) {
    if (row.homeTeamLogo) teamLogoMap[row.homeTeamName] = { logo: row.homeTeamLogo, id: row.homeTeamId };
    if (row.awayTeamLogo) teamLogoMap[row.awayTeamName] = { logo: row.awayTeamLogo, id: row.awayTeamId };
  }

  // ── 3. Enrich each fixture with stats + H2H from DB ──────────────────────────
  for (const row of rows) {
    const [homeStats, awayStats, h2h] = await Promise.all([
      teamStatsFromDb(row.homeTeamId, row.leagueId, row.season),
      teamStatsFromDb(row.awayTeamId, row.leagueId, row.season),
      h2hFromDb(row.homeTeamId, row.awayTeamId),
    ]);

    const hasPrediction = row.homePct != null;
    const markets = hasPrediction
      ? marketsFromPrediction(row.homePct!, row.drawPct!, row.awayPct!, row.advice ?? null, row.underOver ?? null, row.homeTeamName, row.awayTeamName)
      : [];

    console.log(`[fixtures] [DB] ${row.homeTeamName} vs ${row.awayTeamName}: form=${homeStats.form.join("")||"—"}/${awayStats.form.join("")||"—"} h2h=${h2h.homeWins}W-${h2h.draws}D-${h2h.awayWins}L pred=${hasPrediction ? `${row.homePct}%/${row.drawPct}%/${row.awayPct}%` : "✗ missing"}`);

    // Build ApiFixture shape from DB data
    const apiFixture: ApiFixture = {
      fixture: {
        id:        row.fixtureId,
        referee:   null,
        timezone:  "UTC",
        date:      row.date,
        timestamp: row.timestamp,
        status:    { long: "", short: row.status, elapsed: null },
      },
      league: {
        id:      row.leagueId,
        name:    row.leagueName    ?? LEAGUE_META[row.leagueId]?.name    ?? String(row.leagueId),
        country: row.leagueCountry ?? LEAGUE_META[row.leagueId]?.country ?? "",
        logo:    row.leagueLogo    ?? LEAGUE_META[row.leagueId]?.logo    ?? "",
        flag:    null,
        season:  row.season,
        round:   row.round ?? "",
      },
      teams: {
        home: { id: row.homeTeamId, name: row.homeTeamName, logo: row.homeTeamLogo, winner: null },
        away: { id: row.awayTeamId, name: row.awayTeamName, logo: row.awayTeamLogo, winner: null },
      },
      goals: { home: row.homeGoals, away: row.awayGoals },
      score: {
        halftime:  { home: null, away: null },
        fulltime:  { home: null, away: null },
        extratime: { home: null, away: null },
        penalty:   { home: null, away: null },
      },
    };

    allFixtureStats.push({ fixture: apiFixture, homeStats, awayStats, h2h, markets });
  }

  console.log(`[fixtures] ── DONE — ${allFixtureStats.length} fixtures, ${Object.keys(teamLogoMap).length} teams in logoMap ──\n`);
  return NextResponse.json({ fixtures: allFixtureStats, teamLogoMap });
}
