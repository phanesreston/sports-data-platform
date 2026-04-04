import { NextRequest, NextResponse } from "next/server";
import { SAMPLE_ODDS } from "@/data/sampleOdds";
import type { OddsEvent, Sport, TeamStats, H2HStats } from "@/lib/types";
import type { OddsApiEvent } from "@/lib/types";
import {
  transformOddsApiEvent,
  deriveMarkets,
  placeholderStats,
} from "@/lib/transformers";
import type { FixtureWithStats } from "@/app/api/sports/fixtures/route";

const SUPPORTED_SPORTS: Sport[] = [
  "football", "nba", "american_football", "baseball",
  "hockey", "mma", "rugby", "afl", "basketball", "tennis",
];

export async function GET(req: NextRequest) {
  const sport = (req.nextUrl.searchParams.get("sport") ?? "all") as Sport | "all";
  const baseUrl = getBaseUrl(req);

  // If no API keys are set, return sample data immediately
  if (!process.env.ODDS_API_KEY && !process.env.API_SPORTS_KEY) {
    const filtered = sport === "all"
      ? SAMPLE_ODDS
      : SAMPLE_ODDS.filter((e) => e.sport === sport);
    return NextResponse.json({ events: filtered, source: "sample" });
  }

  const sportsToFetch: Sport[] =
    sport === "all" ? SUPPORTED_SPORTS : [sport];

  try {
    const allEvents: OddsEvent[] = [];

    for (const s of sportsToFetch) {
      const [oddsRes, fixturesRes] = await Promise.allSettled([
        fetch(`${baseUrl}/api/odds?sport=${s}`, { next: { revalidate: 300 } }),
        fetch(`${baseUrl}/api/sports/fixtures?sport=${s}`, { next: { revalidate: 300 } }),
      ]);

      // Parse odds
      const oddsData =
        oddsRes.status === "fulfilled" && oddsRes.value.ok
          ? ((await oddsRes.value.json()) as { events: OddsApiEvent[] })
          : null;

      // Parse fixtures+stats
      const fixturesData =
        fixturesRes.status === "fulfilled" && fixturesRes.value.ok
          ? ((await fixturesRes.value.json()) as { fixtures: FixtureWithStats[] })
          : null;

      if (!oddsData?.events?.length && !fixturesData?.fixtures?.length) {
        // Fallback to sample data for this sport
        const fallback = SAMPLE_ODDS.filter((e) => e.sport === s);
        allEvents.push(...fallback);
        continue;
      }

      // Build stats lookup keyed by "homeTeam__awayTeam"
      const statsMap = new Map<
        string,
        { home: TeamStats; away: TeamStats; h2h: H2HStats }
      >();

      if (fixturesData?.fixtures) {
        for (const f of fixturesData.fixtures) {
          const key = `${f.fixture.teams.home.name}__${f.fixture.teams.away.name}`;
          statsMap.set(key, {
            home: f.homeStats,
            away: f.awayStats,
            h2h: f.h2h,
          });
        }
      }

      if (oddsData?.events?.length) {
        // We have odds — transform and enrich with stats
        const transformed = oddsData.events
          .slice(0, 10)
          .map((raw) => transformOddsApiEvent(raw, statsMap));
        allEvents.push(...transformed);
      } else if (fixturesData?.fixtures?.length) {
        // Only have fixtures, no odds — build minimal events
        for (const f of fixturesData.fixtures) {
          const event: OddsEvent = {
            id: `apisports-${f.fixture.fixture.id}`,
            sport: s,
            league: f.fixture.league.name,
            homeTeam: f.fixture.teams.home.name,
            awayTeam: f.fixture.teams.away.name,
            commenceTime: f.fixture.fixture.date,
            bookmakers: [],
            homeStats: f.homeStats,
            awayStats: f.awayStats,
            h2h: f.h2h,
            markets: deriveMarkets([], f.fixture.teams.home.name, f.fixture.teams.away.name),
          };
          allEvents.push(event);
        }
      }
    }

    // Mark the first 3 as featured if none are already
    const hasFeatured = allEvents.some((e) => e.featured);
    if (!hasFeatured) {
      allEvents.slice(0, 3).forEach((e) => { e.featured = true; });
    }

    return NextResponse.json({
      events: allEvents,
      source: "live",
      count: allEvents.length,
    });
  } catch (err) {
    console.error("[/api/events] error:", err);
    // Full fallback to sample data
    const filtered = sport === "all"
      ? SAMPLE_ODDS
      : SAMPLE_ODDS.filter((e) => e.sport === sport);
    return NextResponse.json({ events: filtered, source: "sample_fallback" });
  }
}

function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}
