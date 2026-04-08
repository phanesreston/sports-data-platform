import { NextRequest, NextResponse } from "next/server";
import type {
  ApiFootballResponse,
  ApiFixture,
  ApiTeamStatistics,
  ApiPrediction,
} from "@/lib/types";
import type { TeamStats, H2HStats } from "@/lib/types";
import {
  unwrapApiFootball,
  transformTeamStatistics,
  transformH2H,
  transformPredictionToMarkets,
  placeholderStats,
} from "@/lib/transformers";
import type { Market } from "@/lib/types";

const BASE_URL = "https://v3.football.api-sports.io";

// Top league IDs for football (stable — won't change between seasons)
const FOOTBALL_LEAGUES = [
  { id: 39,  name: "Premier League",      season: 2024 },
  { id: 140, name: "La Liga",             season: 2024 },
  { id: 135, name: "Serie A",             season: 2024 },
  { id: 78,  name: "Bundesliga",          season: 2024 },
  { id: 61,  name: "Ligue 1",             season: 2024 },
  { id: 2,   name: "Champions League",    season: 2024 },
];

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

    // Forward rate limit info to console for monitoring
    const remaining = res.headers.get("x-ratelimit-requests-remaining");
    if (remaining !== null && parseInt(remaining) < 20) {
      console.warn(`[API-Football] Low daily quota remaining: ${remaining}`);
    }

    return res.json() as Promise<ApiFootballResponse<T>>;
  } catch (err) {
    console.error(`[API-Football] fetch error on ${path}:`, err);
    return null;
  }
}

// Minimal team shape returned by /teams?league=X&season=Y
interface ApiLeagueTeam {
  team:  { id: number; name: string; logo: string };
  venue: { id: number; name: string; city: string };
}

export interface FixtureWithStats {
  fixture: ApiFixture;
  homeStats: TeamStats;
  awayStats: TeamStats;
  h2h: H2HStats;
  markets: Market[];
}

export async function GET(req: NextRequest) {
  const leagueParam = req.nextUrl.searchParams.get("league");

  // Determine which leagues to fetch
  const leagues = leagueParam
    ? FOOTBALL_LEAGUES.filter((l) => String(l.id) === leagueParam)
    : FOOTBALL_LEAGUES.slice(0, 3); // default: top 3 leagues to keep quota low

  if (leagues.length === 0) {
    return NextResponse.json({ fixtures: [], teamLogoMap: {} });
  }

  const allFixtures: FixtureWithStats[] = [];
  // teamLogoMap: name → { logo, id } for ALL upcoming fixtures (not just the enriched ones)
  const teamLogoMap: Record<string, { logo: string; id: number }> = {};

  // Date range: today → 7 days ahead (free plan doesn't support `next` param)
  const today    = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 86_400_000).toISOString().split("T")[0];

  // Pre-seed teamLogoMap from full league team lists (exact API names + IDs).
  // Cached 24 h — one call per league per day. This ensures all 20 PL teams
  // (etc.) are in the map even if they have no fixture in the next 7 days.
  for (const league of leagues) {
    const teamsJson = await apiFetch<ApiLeagueTeam>("/teams", {
      league:  league.id,
      season:  league.season,
    }, 86400);
    const leagueTeams = unwrapApiFootball(teamsJson ?? ({} as ApiFootballResponse<ApiLeagueTeam>));
    if (leagueTeams) {
      for (const t of leagueTeams) {
        if (t.team.logo) {
          teamLogoMap[t.team.name] = { logo: t.team.logo, id: t.team.id };
        }
      }
    }
  }

  for (const league of leagues) {
    const fixturesJson = await apiFetch<ApiFixture>("/fixtures", {
      league:   league.id,
      season:   league.season,
      from:     today,
      to:       nextWeek,
      timezone: "UTC",
    });

    const allLeagueFixtures = unwrapApiFootball(fixturesJson ?? ({} as ApiFootballResponse<ApiFixture>));
    if (!allLeagueFixtures || allLeagueFixtures.length === 0) continue;

    const upcomingFixtures = allLeagueFixtures.filter((f) => f.fixture.status.short === "NS");

    // Collect logos + IDs for ALL upcoming teams in this league (cheap — data already fetched)
    for (const f of upcomingFixtures) {
      if (f.teams.home.logo) teamLogoMap[f.teams.home.name] = { logo: f.teams.home.logo, id: f.teams.home.id };
      if (f.teams.away.logo) teamLogoMap[f.teams.away.name] = { logo: f.teams.away.logo, id: f.teams.away.id };
    }

    // Enrich only the first 3 fixtures with stats/H2H/predictions (quota-heavy)
    const fixtures = upcomingFixtures.slice(0, 3);
    if (fixtures.length === 0) continue;

    // For each fixture, fetch team stats, H2H, and predictions in parallel
    for (const fixture of fixtures) {
      const homeId = fixture.teams.home.id;
      const awayId = fixture.teams.away.id;
      const fixtureId = fixture.fixture.id;

      const [homeStatsJson, awayStatsJson, h2hJson, predictionJson] =
        await Promise.all([
          apiFetch<ApiTeamStatistics>("/teams/statistics", {
            team:   homeId,
            league: league.id,
            season: league.season,
          }),
          apiFetch<ApiTeamStatistics>("/teams/statistics", {
            team:   awayId,
            league: league.id,
            season: league.season,
          }),
          apiFetch<ApiFixture>("/fixtures/headtohead", {
            h2h:  `${homeId}-${awayId}`,
            last: 10,
          }),
          apiFetch<ApiPrediction>("/predictions", {
            fixture: fixtureId,
          }),
        ]);

      // Unwrap each response — /teams/statistics returns object in response[0]
      const homeStatsRaw = unwrapApiFootball(homeStatsJson ?? ({} as ApiFootballResponse<ApiTeamStatistics>));
      const awayStatsRaw = unwrapApiFootball(awayStatsJson ?? ({} as ApiFootballResponse<ApiTeamStatistics>));
      const h2hFixtures  = unwrapApiFootball(h2hJson ?? ({} as ApiFootballResponse<ApiFixture>));
      const predictions  = unwrapApiFootball(predictionJson ?? ({} as ApiFootballResponse<ApiPrediction>));

      const homeStats = homeStatsRaw?.[0] ? transformTeamStatistics(homeStatsRaw[0]) : placeholderStats();
      const awayStats = awayStatsRaw?.[0] ? transformTeamStatistics(awayStatsRaw[0]) : placeholderStats();
      const h2h       = h2hFixtures ? transformH2H(h2hFixtures, homeId) : { homeWins: 0, draws: 0, awayWins: 0 };
      const markets   = predictions?.[0]
        ? transformPredictionToMarkets(predictions[0], fixture.teams.home.name, fixture.teams.away.name)
        : [];

      allFixtures.push({ fixture, homeStats, awayStats, h2h, markets });
    }
  }

  return NextResponse.json({ fixtures: allFixtures, teamLogoMap });
}
