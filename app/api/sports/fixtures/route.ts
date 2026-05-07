import { NextRequest, NextResponse } from "next/server";
import type {
  ApiFootballResponse,
  ApiFixture,
  ApiPrediction,
} from "@/lib/types";
import type { TeamStats, H2HStats } from "@/lib/types";
import {
  unwrapApiFootball,
  transformPredictionToMarkets,
  placeholderStats,
} from "@/lib/transformers";
import { currentSeason } from "@/lib/apifootball";
import type { Market } from "@/lib/types";
import { db, teams, leagueTeams, fixtures as fixturesTable } from "@/lib/db";
import { and, eq, inArray, desc, or } from "drizzle-orm";

const BASE_URL = "https://v3.football.api-sports.io";
const SEASON = currentSeason();

const FOOTBALL_LEAGUES = [
  { id: 39,  name: "Premier League"   },
  { id: 140, name: "La Liga"          },
  { id: 135, name: "Serie A"          },
  { id: 78,  name: "Bundesliga"       },
  { id: 61,  name: "Ligue 1"          },
  { id: 2,   name: "Champions League" },
  { id: 3,   name: "Europa League"    },
].map((l) => ({ ...l, season: SEASON }));

async function apiFetch<T>(
  path: string,
  params: Record<string, string | number>,
  revalidate = 300
): Promise<ApiFootballResponse<T> | null> {
  const key = process.env.API_SPORTS_KEY;
  if (!key) return null;

  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  try {
    const res = await fetch(url.toString(), {
      headers: { "x-apisports-key": key },
      next: { revalidate },
    });

    if (!res.ok) {
      console.error(`[API-Football] ${path} returned ${res.status}`);
      return null;
    }

    const remaining = res.headers.get("x-ratelimit-requests-remaining");
    if (remaining !== null && parseInt(remaining) < 20) {
      console.warn(`[API-Football] Low daily quota remaining: ${remaining}`);
    }

    const json = await res.json() as ApiFootballResponse<T>;
    if (json.errors && Object.keys(json.errors).length > 0) {
      console.error(`[API-Football] errors in response:`, json.errors);
    }
    return json;
  } catch (err) {
    console.error(`[API-Football] fetch error on ${path}:`, err);
    return null;
  }
}

export interface FixtureWithStats {
  fixture: ApiFixture;
  homeStats: TeamStats;
  awayStats: TeamStats;
  h2h: H2HStats;
  markets: Market[];
}

const COMPLETED = ["FT", "AET", "PEN"];

async function teamStatsFromDb(teamId: number, leagueId: number, season: number): Promise<TeamStats> {
  const rows = await db
    .select({
      homeTeamId: fixturesTable.homeTeamId,
      homeGoals:  fixturesTable.homeGoals,
      awayGoals:  fixturesTable.awayGoals,
    })
    .from(fixturesTable)
    .where(
      and(
        eq(fixturesTable.leagueId, leagueId),
        eq(fixturesTable.season, season),
        inArray(fixturesTable.status, COMPLETED),
        or(
          eq(fixturesTable.homeTeamId, teamId),
          eq(fixturesTable.awayTeamId, teamId)
        )
      )
    )
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
    form: formResults.reverse(), // oldest→newest
    avgScored:   Math.round((totalFor / rows.length) * 10) / 10,
    avgConceded: Math.round((totalAgainst / rows.length) * 10) / 10,
  };
}

async function h2hFromDb(homeTeamId: number, awayTeamId: number): Promise<H2HStats> {
  const rows = await db
    .select({
      homeTeamId: fixturesTable.homeTeamId,
      homeGoals:  fixturesTable.homeGoals,
      awayGoals:  fixturesTable.awayGoals,
    })
    .from(fixturesTable)
    .where(
      and(
        inArray(fixturesTable.status, COMPLETED),
        or(
          and(eq(fixturesTable.homeTeamId, homeTeamId), eq(fixturesTable.awayTeamId, awayTeamId)),
          and(eq(fixturesTable.homeTeamId, awayTeamId), eq(fixturesTable.awayTeamId, homeTeamId))
        )
      )
    )
    .orderBy(desc(fixturesTable.timestamp))
    .limit(10);

  let homeWins = 0, draws = 0, awayWins = 0;
  for (const row of rows) {
    const hg = row.homeGoals ?? 0;
    const ag = row.awayGoals ?? 0;
    if (hg === ag) {
      draws++;
    } else if (
      (row.homeTeamId === homeTeamId && hg > ag) ||
      (row.homeTeamId !== homeTeamId && ag > hg)
    ) {
      homeWins++;
    } else {
      awayWins++;
    }
  }

  return { homeWins, draws, awayWins };
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Max predictions per league — keeps cold-start API calls within rate limits.
// 7 leagues × 2 = 14 prediction calls + 7 fixture-list calls = 21 total per cold start.
const MAX_ENRICHED_PER_LEAGUE = 2;

export async function GET(req: NextRequest) {
  const leagueParam = req.nextUrl.searchParams.get("league");

  const leaguesList = leagueParam
    ? FOOTBALL_LEAGUES.filter((l) => String(l.id) === leagueParam)
    : FOOTBALL_LEAGUES;

  console.log(`\n[fixtures] ── START ──────────────────────────────────────`);
  console.log(`[fixtures] leagues to fetch: ${leaguesList.map(l => `${l.name}(${l.id})`).join(", ")}`);

  if (leaguesList.length === 0) {
    return NextResponse.json({ fixtures: [], teamLogoMap: {} });
  }

  const allFixtures: FixtureWithStats[] = [];
  const teamLogoMap: Record<string, { logo: string; id: number }> = {};

  const today    = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 10 * 86_400_000).toISOString().split("T")[0];
  console.log(`[fixtures] season: ${SEASON}  date range: ${today} → ${nextWeek}`);

  // Build teamLogoMap from DB — single query, no API calls for logos
  const leagueIds = leaguesList.map((l) => l.id);
  const dbTeams = await db
    .select({ name: teams.name, logo: teams.logo, id: teams.id })
    .from(teams)
    .innerJoin(leagueTeams, eq(leagueTeams.teamId, teams.id))
    .where(and(inArray(leagueTeams.leagueId, leagueIds), eq(leagueTeams.season, SEASON)));

  for (const row of dbTeams) {
    if (row.logo) teamLogoMap[row.name] = { logo: row.logo, id: row.id };
  }
  console.log(`[fixtures] [DB]  teamLogoMap: ${Object.keys(teamLogoMap).length} teams loaded from DB`);

  for (let li = 0; li < leaguesList.length; li++) {
    const league = leaguesList[li];
    // Brief gap between league fixture-list calls to avoid per-minute rate limit
    if (li > 0) await sleep(400);

    console.log(`\n[fixtures] [API] fetching upcoming fixtures: league=${league.id} season=${league.season}`);

    // Upcoming fixtures — genuinely future data, must come from API
    const fixturesJson = await apiFetch<ApiFixture>("/fixtures", {
      league:   league.id,
      season:   league.season,
      from:     today,
      to:       nextWeek,
      timezone: "UTC",
    }, 3600);

    const allLeagueFixtures = unwrapApiFootball(fixturesJson ?? ({} as ApiFootballResponse<ApiFixture>));
    if (!allLeagueFixtures || allLeagueFixtures.length === 0) {
      console.warn(`[fixtures] [API] ✗ no fixtures returned for league ${league.id}`);
      continue;
    }

    const upcomingFixtures = allLeagueFixtures.filter((f) => f.fixture.status.short === "NS");
    console.log(`[fixtures] [API] ✓ ${allLeagueFixtures.length} total, ${upcomingFixtures.length} upcoming (NS)`);

    // Supplement logoMap with logos returned inline by the fixtures endpoint
    for (const f of upcomingFixtures) {
      if (f.teams.home.logo) teamLogoMap[f.teams.home.name] = { logo: f.teams.home.logo, id: f.teams.home.id };
      if (f.teams.away.logo) teamLogoMap[f.teams.away.name] = { logo: f.teams.away.logo, id: f.teams.away.id };
    }

    const toEnrich = upcomingFixtures.slice(0, MAX_ENRICHED_PER_LEAGUE);
    if (toEnrich.length === 0) continue;

    for (let i = 0; i < toEnrich.length; i++) {
      const fixture = toEnrich[i];
      const homeId  = fixture.teams.home.id;
      const awayId  = fixture.teams.away.id;
      const fixId   = fixture.fixture.id;

      // Stagger API calls: 600 ms gap between each prediction call so we stay
      // within the free-tier rate limit (~10 req/min = 6 s apart in theory,
      // but a short pause is enough because fixture-list calls and DB queries
      // fill the gaps between leagues).
      if (i > 0) await sleep(600);

      console.log(`[fixtures]   ${fixture.teams.home.name} vs ${fixture.teams.away.name} (fixture ${fixId}):`);

      // DB for stats/H2H; API only for predictions (genuinely future data).
      // Predictions cached 24 h — they rarely change day-to-day pre-match.
      const [homeStats, awayStats, h2h, predictionJson] = await Promise.all([
        teamStatsFromDb(homeId, league.id, league.season),
        teamStatsFromDb(awayId, league.id, league.season),
        h2hFromDb(homeId, awayId),
        apiFetch<ApiPrediction>("/predictions", { fixture: fixId }, 86400),
      ]);

      const predictions = unwrapApiFootball(predictionJson ?? ({} as ApiFootballResponse<ApiPrediction>));
      const markets = predictions?.[0]
        ? transformPredictionToMarkets(predictions[0], fixture.teams.home.name, fixture.teams.away.name)
        : [];

      console.log(`[fixtures]     [DB]  homeStats: form=${homeStats.form.join("") || "—"} avg=${homeStats.avgScored}/${homeStats.avgConceded}`);
      console.log(`[fixtures]     [DB]  awayStats: form=${awayStats.form.join("") || "—"} avg=${awayStats.avgScored}/${awayStats.avgConceded}`);
      console.log(`[fixtures]     [DB]  h2h: ${h2h.homeWins}W-${h2h.draws}D-${h2h.awayWins}L`);
      console.log(`[fixtures]     [API] predictions: ${predictions?.[0] ? "✓" : "✗ missing"}`);

      allFixtures.push({ fixture, homeStats, awayStats, h2h, markets });
    }
  }

  console.log(`\n[fixtures] ── DONE — ${allFixtures.length} enriched fixture(s), ${Object.keys(teamLogoMap).length} teams in logoMap ──\n`);
  return NextResponse.json({ fixtures: allFixtures, teamLogoMap });
}
