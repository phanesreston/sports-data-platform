import { NextRequest, NextResponse } from "next/server";
import type { OddsEvent, Sport, TeamStats, H2HStats } from "@/lib/types";
import type { OddsApiEvent } from "@/lib/types";
import {
  transformOddsApiEvent,
  deriveMarketsFromOdds,
} from "@/lib/transformers";
import type { FixtureWithStats } from "@/app/api/sports/fixtures/route";
import { apiFetch, unwrap } from "@/lib/apifootball";

interface ApiTeamBasic {
  team: { id: number; name: string; logo: string };
}

/**
 * Fuzzy logo lookup: tries exact match first, then checks whether either
 * string contains the other (handles "Tottenham Hotspur" ↔ "Tottenham" etc.)
 */
function logoFromMap(map: Record<string, string>, name: string): string | undefined {
  if (map[name]) return map[name];
  const lower = name.toLowerCase();
  for (const [key, logo] of Object.entries(map)) {
    const k = key.toLowerCase();
    if (k.includes(lower) || lower.includes(k)) return logo;
  }
  return undefined;
}

/**
 * Fetch logos for a set of team names we still couldn't match.
 * Uses the shared apiFetch which caches results for 24 hours, so this
 * only hits the API once per unique team name per day.
 */
async function fetchMissingLogos(names: string[]): Promise<Record<string, string>> {
  const results = await Promise.all(
    names.map(async (name) => {
      const res = unwrap(await apiFetch<ApiTeamBasic>("/teams", { search: name }, 86400));
      // search returns multiple results — take the closest (first) match
      const logo = res?.[0]?.team?.logo;
      return logo ? { name, logo } : null;
    })
  );
  const map: Record<string, string> = {};
  for (const r of results) if (r) map[r.name] = r.logo;
  return map;
}

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
        const rawSlice = oddsData.events.slice(0, 10);
        const transformed = rawSlice.map((raw) => {
          const fixtureEntry = fixturesData?.fixtures?.find(
            (f) =>
              f.fixture.teams.home.name === raw.home_team &&
              f.fixture.teams.away.name === raw.away_team
          );
          const marketsOverride =
            fixtureEntry?.markets?.length ? fixtureEntry.markets : undefined;

          const event = transformOddsApiEvent(raw, statsMap, marketsOverride);

          // Attach full fixture data (stats, IDs, logos) when exact fixture matches
          if (fixtureEntry) {
            event.homeLogo    = fixtureEntry.fixture.teams.home.logo;
            event.awayLogo    = fixtureEntry.fixture.teams.away.logo;
            event.homeTeamId  = fixtureEntry.fixture.teams.home.id;
            event.awayTeamId  = fixtureEntry.fixture.teams.away.id;
            event.leagueId    = fixtureEntry.fixture.league.id;
            event.leagueLogo  = fixtureEntry.fixture.league.logo;
          } else {
            // Fuzzy match against teamLogoMap (handles name variants)
            event.homeLogo = logoFromMap(teamLogoMap, raw.home_team);
            event.awayLogo = logoFromMap(teamLogoMap, raw.away_team);
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

        // For any football events still missing logos, fetch them directly from
        // API-Football (cached 24 h — only costs quota on first hit per team name)
        if (s === "football") {
          const missingNames = new Set<string>();
          for (const e of transformed) {
            if (!e.homeLogo) missingNames.add(e.homeTeam);
            if (!e.awayLogo) missingNames.add(e.awayTeam);
          }
          if (missingNames.size > 0) {
            const fetched = await fetchMissingLogos([...missingNames]);
            for (const e of transformed) {
              if (!e.homeLogo) e.homeLogo = fetched[e.homeTeam];
              if (!e.awayLogo) e.awayLogo = fetched[e.awayTeam];
            }
          }
        }

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
