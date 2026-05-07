import { NextRequest, NextResponse } from "next/server";
import type { OddsEvent, Sport, TeamStats, H2HStats } from "@/lib/types";
import type { OddsApiEvent } from "@/lib/types";
import {
  transformOddsApiEvent,
  deriveMarketsFromOdds,
} from "@/lib/transformers";
import type { FixtureWithStats } from "@/app/api/sports/fixtures/route";
import { TEAM_NAME_ALIASES } from "@/lib/apifootball";
import { db, teams } from "@/lib/db";
import { like } from "drizzle-orm";

// Strip diacritics so "Atlético" matches "Atletico", "Alavés" matches "Alaves", etc.
// eslint-disable-next-line no-misleading-character-class
const DIACRITICS_RE = /[̀-ͯ]/g;

function normName(s: string): string {
  return s.normalize("NFD").replace(DIACRITICS_RE, "").toLowerCase();
}

/**
 * Fuzzy logo lookup: exact → accent-insensitive substring → alias fallback.
 */
function dataFromMap(
  map: Record<string, { logo?: string; id?: number }>,
  name: string
): { logo?: string; id?: number; matchedKey?: string } | undefined {
  if (map[name]) return { ...map[name], matchedKey: name };
  const norm = normName(name);
  for (const [key, val] of Object.entries(map)) {
    const k = normName(key);
    if (k.includes(norm) || norm.includes(k)) return { ...val, matchedKey: key };
  }
  const alias = TEAM_NAME_ALIASES[name];
  if (alias) {
    if (map[alias]) return { ...map[alias], matchedKey: alias };
    const al = normName(alias);
    for (const [key, val] of Object.entries(map)) {
      const k = normName(key);
      if (k.includes(al) || al.includes(k)) return { ...val, matchedKey: key };
    }
  }
  return undefined;
}

/**
 * Resolve logos + IDs for team names still missing after logoMap lookup.
 * Searches the local DB first (no API quota consumed); logs what it finds.
 */
async function fetchMissingTeamData(
  names: string[]
): Promise<Record<string, { logo?: string; id?: number }>> {
  console.log(`[events] fetchMissingTeamData: resolving ${names.length} teams from DB`);

  const result: Record<string, { logo?: string; id?: number }> = {};
  for (const name of names) {
    // Build search variants: original, alias, first word
    const alias = TEAM_NAME_ALIASES[name];
    const variants = [...new Set([name, ...(alias ? [alias] : []), name.split(" ")[0]])].filter(v => v.length >= 3);

    let found = false;
    for (const variant of variants) {
      const rows = await db
        .select({ id: teams.id, name: teams.name, logo: teams.logo })
        .from(teams)
        .where(like(teams.name, `%${variant}%`))
        .limit(5);

      if (!rows.length) continue;

      // Pick the row whose normalised name best matches the query
      const normQuery = normName(name);
      const match = rows.find(r => normName(r.name) === normQuery) ?? rows[0];
      result[name] = { id: match.id, logo: match.logo };
      console.log(`[events]   ✓ DB match: "${match.name}" (id ${match.id}) for "${name}" via "${variant}"`);
      found = true;
      break;
    }
    if (!found) console.warn(`[events]   ✗ no DB match for "${name}"`);
  }
  return result;
}

// Sports covered by The Odds API
const ODDS_API_SPORTS: Sport[] = [
  "football", "nba", "american_football", "baseball",
  "hockey", "mma", "rugby", "afl", "basketball", "tennis",
];

// Maps Odds API sport_key values to our internal league IDs and canonical names.
// Used as a fallback when an Odds API event can't be matched to an API-Football fixture.
const ODDS_SPORT_KEY_TO_LEAGUE: Record<string, { id: number; name: string }> = {
  soccer_epl:                    { id: 39,  name: "Premier League"   },
  soccer_spain_la_liga:          { id: 140, name: "La Liga"          },
  soccer_germany_bundesliga:     { id: 78,  name: "Bundesliga"       },
  soccer_italy_serie_a:          { id: 135, name: "Serie A"          },
  soccer_france_ligue_one:       { id: 61,  name: "Ligue 1"          },
  soccer_uefa_champs_league:     { id: 2,   name: "Champions League" },
  soccer_uefa_europa_league:     { id: 3,   name: "Europa League"    },
};

/**
 * Fuzzy team name match: strips punctuation/spaces and checks whether
 * either string contains the other.
 * "Tottenham Hotspur" ↔ "Tottenham", "Brighton & Hove Albion" ↔ "Brighton" etc.
 */
function fuzzyTeamMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const an = norm(a), bn = norm(b);
  return an === bn || an.includes(bn) || bn.includes(an);
}

export async function GET(req: NextRequest) {
  const sport = (req.nextUrl.searchParams.get("sport") ?? "all") as Sport | "all";
  const baseUrl = getBaseUrl(req);

  const hasOddsKey   = !!process.env.ODDS_API_KEY;
  const hasSportsKey = !!process.env.API_SPORTS_KEY;

  console.log(`\n[events] ── START sport=${sport} ─────────────────────────────`);
  console.log(`[events] ODDS_API_KEY: ${hasOddsKey ? "✓ set" : "✗ MISSING"}  API_SPORTS_KEY: ${hasSportsKey ? "✓ set" : "✗ MISSING"}`);

  const sportsToFetch: Sport[] =
    sport === "all" ? ODDS_API_SPORTS : [sport as Sport];

  try {
    const allEvents: OddsEvent[] = [];

    for (const s of sportsToFetch) {
      console.log(`\n[events] processing sport: ${s}`);
      const [oddsRes, fixturesRes] = await Promise.allSettled([
        hasOddsKey
          ? fetch(`${baseUrl}/api/odds?sport=${s}`, { next: { revalidate: 300 } })
          : Promise.resolve(null),
        hasSportsKey && s === "football"
          ? fetch(`${baseUrl}/api/sports/fixtures?sport=${s}`, { next: { revalidate: 300 } })
          : Promise.resolve(null),
      ]);

      const oddsData     = await parseJson<{ events: OddsApiEvent[] }>(oddsRes);
      const fixturesData = await parseJson<{ fixtures: FixtureWithStats[]; teamLogoMap: Record<string, { logo: string; id: number }> }>(fixturesRes);

      console.log(`[events] [API] odds: ${oddsData?.events?.length ?? 0} events`);
      console.log(`[events] [API] fixtures: ${fixturesData?.fixtures?.length ?? 0} enriched  |  [DB] logoMap: ${Object.keys(fixturesData?.teamLogoMap ?? {}).length} teams`);

      // No data from either source — skip this sport entirely (no sample fallback)
      if (!oddsData?.events?.length && !fixturesData?.fixtures?.length) {
        console.warn(`[events] no data for ${s} — skipping`);
        continue;
      }

      // teamLogoMap2: name → { logo, id } for ALL upcoming fixtures
      const teamLogoMap2: Record<string, { logo?: string; id?: number }> = fixturesData?.teamLogoMap ?? {};

      // Build stats lookup keyed by Odds API team names (after fuzzy-matching to fixture names)
      const statsMap = new Map<
        string,
        { home: TeamStats; away: TeamStats; h2h: H2HStats }
      >();

      if (oddsData?.events?.length && fixturesData?.fixtures) {
        for (const raw of oddsData.events.slice(0, 50)) {
          const f = fixturesData.fixtures.find(
            (fx) =>
              fuzzyTeamMatch(fx.fixture.teams.home.name, raw.home_team) &&
              fuzzyTeamMatch(fx.fixture.teams.away.name, raw.away_team)
          );
          if (f) {
            const key = `${raw.home_team}__${raw.away_team}`;
            statsMap.set(key, { home: f.homeStats, away: f.awayStats, h2h: f.h2h });
            console.log(`[events] [DB]  stats matched via fixture: "${raw.home_team}" → "${f.fixture.teams.home.name}" (id ${f.fixture.teams.home.id})`);
          }
        }
      }

      // Track which API-Football fixtures are matched to Odds API events, so
      // non-matched leagues (La Liga, Serie A etc.) still get surfaced below.
      const matchedFixtureIds = new Set<number>();

      if (oddsData?.events?.length) {
        const rawSlice = oddsData.events.slice(0, 50);
        console.log(`\n[events] processing ${rawSlice.length} Odds API events for ${s}:`);

        const transformed = rawSlice.map((raw) => {
          const fixtureEntry = fixturesData?.fixtures?.find(
            (f) =>
              fuzzyTeamMatch(f.fixture.teams.home.name, raw.home_team) &&
              fuzzyTeamMatch(f.fixture.teams.away.name, raw.away_team)
          );
          const marketsOverride =
            fixtureEntry?.markets?.length ? fixtureEntry.markets : undefined;

          const event = transformOddsApiEvent(raw, statsMap, marketsOverride);

          // Attach full fixture data (stats, IDs, logos) when exact fixture matches
          if (fixtureEntry) {
            matchedFixtureIds.add(fixtureEntry.fixture.fixture.id);
            event.homeLogo    = fixtureEntry.fixture.teams.home.logo;
            event.awayLogo    = fixtureEntry.fixture.teams.away.logo;
            event.homeTeamId  = fixtureEntry.fixture.teams.home.id;
            event.awayTeamId  = fixtureEntry.fixture.teams.away.id;
            event.leagueId    = fixtureEntry.fixture.league.id;
            event.leagueLogo  = fixtureEntry.fixture.league.logo;
            // Normalize to the API-Football league name so all events for the same
            // league share one name ("Premier League" not "English Premier League")
            event.league      = fixtureEntry.fixture.league.name;
            console.log(`[events]   [API] fixture matched: "${raw.home_team}" vs "${raw.away_team}"`);
          } else {
            // Fuzzy match against teamLogoMap (handles name variants)
            const homeData = dataFromMap(teamLogoMap2, raw.home_team);
            const awayData = dataFromMap(teamLogoMap2, raw.away_team);
            event.homeLogo   = homeData?.logo;
            event.awayLogo   = awayData?.logo;
            event.homeTeamId = homeData?.id;
            event.awayTeamId = awayData?.id;
            // Fallback: infer leagueId from the Odds API sport_key when no fixture matched
            if (!event.leagueId) {
              const leagueInfo = ODDS_SPORT_KEY_TO_LEAGUE[raw.sport_key];
              if (leagueInfo) {
                event.leagueId = leagueInfo.id;
                event.league   = leagueInfo.name;
              }
            }
            console.log(`[events]   [DB]  logoMap "${raw.home_team}" → ${homeData ? `"${homeData.matchedKey}" ✓` : "✗ NOT FOUND"}`);
            console.log(`[events]   [DB]  logoMap "${raw.away_team}" → ${awayData ? `"${awayData.matchedKey}" ✓` : "✗ NOT FOUND"}`);
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

        // For football events still missing logos or IDs after the logoMap lookup, try the DB
        if (s === "football") {
          const missingNames = new Set<string>();
          for (const e of transformed) {
            if (!e.homeLogo || !e.homeTeamId) missingNames.add(e.homeTeam);
            if (!e.awayLogo || !e.awayTeamId) missingNames.add(e.awayTeam);
          }
          if (missingNames.size > 0) {
            console.log(`[events] [DB]  logo fallback for: ${[...missingNames].join(", ")}`);
            const fetched = await fetchMissingTeamData([...missingNames]);
            for (const e of transformed) {
              const home = fetched[e.homeTeam];
              const away = fetched[e.awayTeam];
              if (!e.homeLogo && home?.logo)    e.homeLogo   = home.logo;
              if (!e.homeTeamId && home?.id)    e.homeTeamId = home.id;
              if (!e.awayLogo && away?.logo)    e.awayLogo   = away.logo;
              if (!e.awayTeamId && away?.id)    e.awayTeamId = away.id;
            }
          } else {
            console.log(`[events] [DB]  all logos resolved from logoMap — no fallback needed`);
          }

          // Final summary per event
          console.log(`[events] [DB]  logo/id summary:`);
          for (const e of transformed) {
            console.log(`[events]   [DB]  "${e.homeTeam}" logo=${!!e.homeLogo}  |  "${e.awayTeam}" logo=${!!e.awayLogo}`);
          }
        }

        allEvents.push(...transformed);
      }

      // Always add API-Football fixtures not matched to any Odds API event.
      // The Odds API only covers soccer_epl, so La Liga, Serie A, Bundesliga etc.
      // only appear here. When there are no Odds API events at all, every fixture
      // is unmatched and this block acts as the sole data source.
      if (fixturesData?.fixtures?.length) {
        const fixtureOnlyCount = { added: 0 };
        for (const f of fixturesData.fixtures) {
          if (matchedFixtureIds.has(f.fixture.fixture.id)) continue;
          // Also skip if an existing event already represents this match — handles
          // cases where the Odds API name doesn't fuzzy-match the API-Football name
          // (e.g. "Atletico Madrid" vs "Atlético Madrid") so the ID wasn't tracked
          // above but the game would still appear twice.
          const homeN = f.fixture.teams.home.name;
          const awayN = f.fixture.teams.away.name;
          const alreadyCovered = allEvents.some(
            (e) => fuzzyTeamMatch(e.homeTeam, homeN) && fuzzyTeamMatch(e.awayTeam, awayN)
          );
          if (alreadyCovered) continue;
          fixtureOnlyCount.added++;
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
        if (fixtureOnlyCount.added > 0) {
          console.log(`[events] [API] added ${fixtureOnlyCount.added} unmatched fixtures (non-EPL leagues)`);
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
