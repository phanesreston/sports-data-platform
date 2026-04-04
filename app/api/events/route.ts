import { NextRequest, NextResponse } from "next/server";
import { SAMPLE_ODDS } from "@/data/sampleOdds";
import type { OddsEvent, Sport, TeamStats, H2HStats } from "@/lib/types";
import type { OddsApiEvent } from "@/lib/types";
import {
  transformOddsApiEvent,
  deriveMarketsFromOdds,
  placeholderStats,
} from "@/lib/transformers";
import type { FixtureWithStats } from "@/app/api/sports/fixtures/route";

// Sports that The Odds API covers (others get football fixtures route or sample)
const ODDS_API_SPORTS: Sport[] = [
  "football", "nba", "american_football", "baseball",
  "hockey", "mma", "rugby", "afl", "basketball", "tennis",
];

export async function GET(req: NextRequest) {
  const sport = (req.nextUrl.searchParams.get("sport") ?? "all") as Sport | "all";
  const baseUrl = getBaseUrl(req);

  const hasOddsKey     = !!process.env.ODDS_API_KEY;
  const hasSportsKey   = !!process.env.API_SPORTS_KEY;

  // No keys at all — return sample data immediately, no extra round-trips
  if (!hasOddsKey && !hasSportsKey) {
    return sampleResponse(sport);
  }

  const sportsToFetch: Sport[] =
    sport === "all" ? ODDS_API_SPORTS : [sport as Sport];

  try {
    const allEvents: OddsEvent[] = [];

    for (const s of sportsToFetch) {
      // Fetch odds and fixtures in parallel for each sport
      const [oddsRes, fixturesRes] = await Promise.allSettled([
        hasOddsKey
          ? fetch(`${baseUrl}/api/odds?sport=${s}`, { next: { revalidate: 300 } })
          : Promise.resolve(null),
        hasSportsKey && s === "football"
          ? fetch(`${baseUrl}/api/sports/fixtures?sport=${s}`, { next: { revalidate: 300 } })
          : Promise.resolve(null),
      ]);

      const oddsData = await parseJson<{ events: OddsApiEvent[] }>(oddsRes);
      const fixturesData = await parseJson<{ fixtures: FixtureWithStats[] }>(fixturesRes);

      if (!oddsData?.events?.length && !fixturesData?.fixtures?.length) {
        // Both sources empty — fall back to sample data for this sport
        allEvents.push(...SAMPLE_ODDS.filter((e) => e.sport === s));
        continue;
      }

      // Build a stats lookup keyed by "homeTeam__awayTeam"
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
            h2h:  f.h2h,
          });
        }
      }

      if (oddsData?.events?.length) {
        // We have odds — transform and enrich with stats from the fixtures route
        const transformed = oddsData.events.slice(0, 10).map((raw) => {
          // If we also have prediction markets from the fixtures route, merge them
          const statsKey = `${raw.home_team}__${raw.away_team}`;
          const fixtureEntry = fixturesData?.fixtures?.find(
            (f) =>
              f.fixture.teams.home.name === raw.home_team &&
              f.fixture.teams.away.name === raw.away_team
          );
          const marketsOverride =
            fixtureEntry?.markets && fixtureEntry.markets.length > 0
              ? fixtureEntry.markets
              : undefined;

          const event = transformOddsApiEvent(raw, statsMap, marketsOverride);

          // Patch bestOdds onto markets derived from predictions
          if (marketsOverride && event.bookmakers.length > 0) {
            event.markets = event.markets.map((market) => {
              if (market.name === "Match Result" && market.bestOdds === 0) {
                const bestBks = deriveMarketsFromOdds(
                  event.bookmakers,
                  raw.home_team,
                  raw.away_team
                );
                return { ...market, bestOdds: bestBks[0]?.bestOdds ?? 0, bestBookmaker: bestBks[0]?.bestBookmaker ?? "" };
              }
              return market;
            });
          }

          return event;
        });
        allEvents.push(...transformed);
      } else if (fixturesData?.fixtures?.length) {
        // Only have fixtures (no odds) — build events from fixture data
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
            markets: f.markets,
          };
          allEvents.push(event);
        }
      }
    }

    // Mark the first 3 as featured if none are already
    if (!allEvents.some((e) => e.featured)) {
      allEvents.slice(0, 3).forEach((e) => { e.featured = true; });
    }

    return NextResponse.json({
      events: allEvents,
      source: "live",
      count: allEvents.length,
    });
  } catch (err) {
    console.error("[/api/events] error:", err);
    return sampleResponse(sport);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sampleResponse(sport: Sport | "all") {
  const filtered =
    sport === "all"
      ? SAMPLE_ODDS
      : SAMPLE_ODDS.filter((e) => e.sport === sport);
  return NextResponse.json({ events: filtered, source: "sample" });
}

async function parseJson<T>(
  settled: PromiseSettledResult<Response | null> | undefined
): Promise<T | null> {
  if (!settled || settled.status === "rejected") return null;
  const res = settled.value;
  if (!res || !res.ok) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}
