import { NextRequest, NextResponse } from "next/server";
import type { ApiSportsFixture, ApiSportsTeamStats, ApiSportsH2H } from "@/lib/types";
import {
  transformApiSportsStats,
  transformApiSportsH2H,
  placeholderStats,
} from "@/lib/transformers";
import type { TeamStats, H2HStats } from "@/lib/types";

const BASE_URL = "https://v3.football.api-sports.io";

// Maps our sport keys to API-Sports league IDs (top competitions)
const LEAGUE_IDS: Record<string, number[]> = {
  football:          [39, 140, 135, 78, 61],  // EPL, La Liga, Serie A, Bundesliga, Ligue 1
  american_football: [1],                      // NFL
  basketball:        [12],                     // NBA (via basketball endpoint)
  nba:               [12],
  baseball:          [1],                      // MLB (via baseball endpoint)
  hockey:            [57],                     // NHL (via hockey endpoint)
  rugby:             [1],                      // NRL
  afl:               [1],                      // AFL
};

// API-Sports uses different base URLs per sport
const SPORT_ENDPOINTS: Record<string, string> = {
  football:          "https://v3.football.api-sports.io",
  american_football: "https://v1.american-football.api-sports.io",
  basketball:        "https://v1.basketball.api-sports.io",
  nba:               "https://v1.basketball.api-sports.io",
  baseball:          "https://v1.baseball.api-sports.io",
  hockey:            "https://v1.hockey.api-sports.io",
  rugby:             "https://v1.rugby.api-sports.io",
  afl:               "https://v1.afl.api-sports.io",
};

async function apiFetch<T>(
  endpoint: string,
  path: string,
  params: Record<string, string>
): Promise<T | null> {
  const key = process.env.API_SPORTS_KEY;
  if (!key) return null;

  const url = new URL(`${endpoint}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "x-apisports-key": key,
        "x-rapidapi-key": key,
      },
      next: { revalidate: 300 }, // cache 5 min
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.response as T;
  } catch {
    return null;
  }
}

export interface FixtureWithStats {
  fixture: ApiSportsFixture;
  homeStats: TeamStats;
  awayStats: TeamStats;
  h2h: H2HStats;
}

export async function GET(req: NextRequest) {
  const sport = req.nextUrl.searchParams.get("sport") ?? "football";
  const endpoint = SPORT_ENDPOINTS[sport] ?? BASE_URL;
  const leagueIds = LEAGUE_IDS[sport] ?? [39];

  // Fetch upcoming fixtures for the next 7 days
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const allFixtures: FixtureWithStats[] = [];

  for (const leagueId of leagueIds.slice(0, 2)) {
    const fixtures = await apiFetch<ApiSportsFixture[]>(
      endpoint,
      "/fixtures",
      {
        league: String(leagueId),
        from: today,
        to: nextWeek,
        status: "NS", // Not Started
        timezone: "UTC",
      }
    );

    if (!fixtures) continue;

    for (const fixture of fixtures.slice(0, 5)) {
      const homeId = fixture.teams.home.id;
      const awayId = fixture.teams.away.id;

      // Fetch team stats in parallel
      const [homeStatsRaw, awayStatsRaw, h2hRaw] = await Promise.all([
        apiFetch<ApiSportsTeamStats[]>(endpoint, "/teams/statistics", {
          team: String(homeId),
          league: String(leagueId),
          season: new Date().getFullYear().toString(),
        }),
        apiFetch<ApiSportsTeamStats[]>(endpoint, "/teams/statistics", {
          team: String(awayId),
          league: String(leagueId),
          season: new Date().getFullYear().toString(),
        }),
        apiFetch<ApiSportsH2H[]>(endpoint, "/fixtures/headtohead", {
          h2h: `${homeId}-${awayId}`,
          last: "10",
        }),
      ]);

      allFixtures.push({
        fixture,
        homeStats: homeStatsRaw?.[0]
          ? transformApiSportsStats(homeStatsRaw[0])
          : placeholderStats(),
        awayStats: awayStatsRaw?.[0]
          ? transformApiSportsStats(awayStatsRaw[0])
          : placeholderStats(),
        h2h: h2hRaw
          ? transformApiSportsH2H(h2hRaw, homeId)
          : { homeWins: 0, draws: 0, awayWins: 0 },
      });
    }
  }

  return NextResponse.json({ fixtures: allFixtures });
}
