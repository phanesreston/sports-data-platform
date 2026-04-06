import { NextRequest, NextResponse } from "next/server";
import type { OddsEvent, Sport, TeamStats, H2HStats } from "@/lib/types";
import type { OddsApiEvent } from "@/lib/types";
import {
  transformOddsApiEvent,
  deriveMarketsFromOdds,
} from "@/lib/transformers";
import type { FixtureWithStats } from "@/app/api/sports/fixtures/route";

// Sports covered by The Odds API
const ODDS_API_SPORTS: Sport[] = [
  "football", "nba", "american_football", "baseball",
  "hockey", "mma", "rugby", "afl", "basketball", "tennis",
];

export async function GET(req: NextRequest) {
  const sport = (req.nextUrl.searchParams.get("sport") ?? "all") as Sport | "all";
  const baseUrl = getBaseUrl(req);

  const hasOddsKey   = !!process.env.ODDS_API_KEY;
  const hasSportsKey = !!process.env.API_SPORTS_KEY;

  const sportsToFetch: Sport[] =
    sport === "all" ? ODDS_API_SPORTS : [sport as Sport];

  try {
    const allEvents: OddsEvent[] = [];

    for (const s of sportsToFetch) {
      const [oddsRes, fixturesRes] = await Promise.allSettled([
        hasOddsKey
          ? fetch(`${baseUrl}/api/odds?sport=${s}`, { next: { revalidate: 300 } })
          : Promise.resolve(null),
        hasSportsKey && s === "football"
          ? fetch(`${baseUrl}/api/sports/fixtures?sport=${s}`, { next: { revalidate: 300 } })
          : Promise.resolve(null),
      ]);

      const oddsData     = await parseJson<{ events: OddsApiEvent[] }>(oddsRes);
      const fixturesData = await parseJson<{ fixtures: FixtureWithStats[]; teamLogoMap: Record<string, string> }>(fixturesRes);

      // No data from either source — skip this sport entirely (no sample fallback)
      if (!oddsData?.events?.length && !fixturesData?.fixtures?.length) continue;

      // teamLogoMap: name → logo for ALL upcoming fixtures (not just the stats-enriched ones)
      const teamLogoMap: Record<string, string> = fixturesData?.teamLogoMap ?? {};

      // Build stats lookup keyed by "homeTeam__awayTeam"
      const statsMap = new Map<
        string,
        { home: TeamStats; away: TeamStats; h2h: H2HStats }
      >();

      if (fixturesData?.fixtures) {
        for (const f of fixturesData.fixtures) {
          const key = `${f.fixture.teams.home.name}__${f.fixture.teams.away.name}`;
          statsMap.set(key, { home: f.homeStats, away: f.awayStats, h2h: f.h2h });
        }
      }

      if (oddsData?.events?.length) {
        const transformed = oddsData.events.slice(0, 10).map((raw) => {
          const fixtureEntry = fixturesData?.fixtures?.find(
            (f) =>
              f.fixture.teams.home.name === raw.home_team &&
              f.fixture.teams.away.name === raw.away_team
          );
          const marketsOverride =
            fixtureEntry?.markets?.length ? fixtureEntry.markets : undefined;

          const event = transformOddsApiEvent(raw, statsMap, marketsOverride);

          // Attach full fixture data (stats, IDs, logos) when a fixture matches
          if (fixtureEntry) {
            event.homeLogo    = fixtureEntry.fixture.teams.home.logo;
            event.awayLogo    = fixtureEntry.fixture.teams.away.logo;
            event.homeTeamId  = fixtureEntry.fixture.teams.home.id;
            event.awayTeamId  = fixtureEntry.fixture.teams.away.id;
            event.leagueId    = fixtureEntry.fixture.league.id;
            event.leagueLogo  = fixtureEntry.fixture.league.logo;
          } else {
            // Fall back to teamLogoMap for events beyond the stats-enriched slice
            event.homeLogo = event.homeLogo ?? teamLogoMap[raw.home_team];
            event.awayLogo = event.awayLogo ?? teamLogoMap[raw.away_team];
          }

          // Patch bestOdds back onto prediction-derived markets
          if (marketsOverride && event.bookmakers.length > 0) {
            event.markets = event.markets.map((market) => {
              if (market.name === "Match Result" && market.bestOdds === 0) {
                const best = deriveMarketsFromOdds(event.bookmakers, raw.home_team, raw.away_team);
                return { ...market, bestOdds: best[0]?.bestOdds ?? 0, bestBookmaker: best[0]?.bestBookmaker ?? "" };
              }
              return market;
            });
          }

          return event;
        });
        allEvents.push(...transformed);
      } else if (fixturesData?.fixtures?.length) {
        for (const f of fixturesData.fixtures) {
          allEvents.push({
            id:          `apisports-${f.fixture.fixture.id}`,
            sport:        s,
            league:       f.fixture.league.name,
            leagueId:     f.fixture.league.id,
            leagueLogo:   f.fixture.league.logo,
            homeTeam:     f.fixture.teams.home.name,
            homeTeamId:   f.fixture.teams.home.id,
            homeLogo:     f.fixture.teams.home.logo,
            awayTeam:     f.fixture.teams.away.name,
            awayTeamId:   f.fixture.teams.away.id,
            awayLogo:     f.fixture.teams.away.logo,
            commenceTime: f.fixture.fixture.date,
            bookmakers:   [],
            homeStats:    f.homeStats,
            awayStats:    f.awayStats,
            h2h:          f.h2h,
            markets:      f.markets,
          });
        }
      }
    }

    // Mark first 3 as featured if none are
    if (allEvents.length > 0 && !allEvents.some((e) => e.featured)) {
      allEvents.slice(0, 3).forEach((e) => { e.featured = true; });
    }

    return NextResponse.json({ events: allEvents, source: "live", count: allEvents.length });
  } catch (err) {
    console.error("[/api/events] error:", err);
    return NextResponse.json({ events: [], source: "error", error: String(err) });
  }
}

async function parseJson<T>(
  settled: PromiseSettledResult<Response | null> | undefined
): Promise<T | null> {
  if (!settled || settled.status === "rejected") return null;
  const res = settled.value;
  if (!res || !res.ok) return null;
  try { return (await res.json()) as T; }
  catch { return null; }
}

function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}
