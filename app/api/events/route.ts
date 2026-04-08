import { NextRequest, NextResponse } from "next/server";
import type { OddsEvent, Sport, TeamStats, H2HStats } from "@/lib/types";
import type { OddsApiEvent } from "@/lib/types";
import {
  transformOddsApiEvent,
  deriveMarketsFromOdds,
} from "@/lib/transformers";
import type { FixtureWithStats } from "@/app/api/sports/fixtures/route";
import { apiFetch, unwrap, pickBestTeam, getTeamSearchVariants } from "@/lib/apifootball";

interface ApiTeamBasic {
  team: { id: number; name: string; logo: string };
}

/**
 * Fuzzy logo lookup: tries exact match first, then checks whether either
 * string contains the other (handles "Tottenham Hotspur" ↔ "Tottenham" etc.)
 * Returns the matched value AND the key it matched on.
 */
function dataFromMap(
  map: Record<string, { logo?: string; id?: number }>,
  name: string
): { logo?: string; id?: number; matchedKey?: string } | undefined {
  if (map[name]) return { ...map[name], matchedKey: name };
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(map)) {
    const k = key.toLowerCase();
    if (k.includes(lower) || lower.includes(k)) return { ...val, matchedKey: key };
  }
  return undefined;
}

/**
 * Fetch logo + numeric ID for team names we couldn't match from the fixture map.
 * Tries progressive name variants (full → first word → each word ≥4 chars),
 * filters out youth/reserve results, and caches 24 h.
 */
async function fetchMissingTeamData(
  names: string[]
): Promise<Record<string, { logo?: string; id?: number }>> {
  console.log(`[events] fetchMissingTeamData for: ${names.join(", ")}`);
  const results = await Promise.all(
    names.map(async (name) => {
      let best: { team: { id: number; name: string; logo: string } } | null = null;
      for (const variant of getTeamSearchVariants(name)) {
        console.log(`[events]   searching variant "${variant}" for "${name}"`);
        const res = unwrap(
          await apiFetch<ApiTeamBasic>("/teams", { search: variant }, 86400)
        );
        console.log(`[events]   → ${res?.length ?? 0} result(s): ${res?.map(r => r.team.name).join(", ") || "none"}`);
        best = pickBestTeam(res ?? [], name);
        if (best) {
          console.log(`[events]   → picked: "${best.team.name}" (id ${best.team.id})`);
          break;
        }
      }
      if (!best) console.warn(`[events]   ✗ could not resolve "${name}"`);
      return best ? { name, logo: best.team.logo, id: best.team.id } : null;
    })
  );
  const map: Record<string, { logo?: string; id?: number }> = {};
  for (const r of results) if (r) map[r.name] = { logo: r.logo, id: r.id };
  return map;
}

// Sports covered by The Odds API
const ODDS_API_SPORTS: Sport[] = [
  "football", "nba", "american_football", "baseball",
  "hockey", "mma", "rugby", "afl", "basketball", "tennis",
];

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

      console.log(`[events] oddsData: ${oddsData?.events?.length ?? 0} events  fixturesData: ${fixturesData?.fixtures?.length ?? 0} enriched fixtures`);
      console.log(`[events] teamLogoMap from fixtures: ${Object.keys(fixturesData?.teamLogoMap ?? {}).length} teams`);

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
        for (const raw of oddsData.events.slice(0, 10)) {
          const f = fixturesData.fixtures.find(
            (fx) =>
              fuzzyTeamMatch(fx.fixture.teams.home.name, raw.home_team) &&
              fuzzyTeamMatch(fx.fixture.teams.away.name, raw.away_team)
          );
          if (f) {
            const key = `${raw.home_team}__${raw.away_team}`;
            statsMap.set(key, { home: f.homeStats, away: f.awayStats, h2h: f.h2h });
            console.log(`[events] stats matched: "${raw.home_team}" → fixture "${f.fixture.teams.home.name}" (id ${f.fixture.teams.home.id})`);
          }
        }
      }

      if (oddsData?.events?.length) {
        const rawSlice = oddsData.events.slice(0, 10);
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
            event.homeLogo    = fixtureEntry.fixture.teams.home.logo;
            event.awayLogo    = fixtureEntry.fixture.teams.away.logo;
            event.homeTeamId  = fixtureEntry.fixture.teams.home.id;
            event.awayTeamId  = fixtureEntry.fixture.teams.away.id;
            event.leagueId    = fixtureEntry.fixture.league.id;
            event.leagueLogo  = fixtureEntry.fixture.league.logo;
            console.log(`[events]   ✓ fixture match: "${raw.home_team}" vs "${raw.away_team}" → API names: "${fixtureEntry.fixture.teams.home.name}"(${fixtureEntry.fixture.teams.home.id}) vs "${fixtureEntry.fixture.teams.away.name}"(${fixtureEntry.fixture.teams.away.id})`);
          } else {
            // Fuzzy match against teamLogoMap (handles name variants)
            const homeData = dataFromMap(teamLogoMap2, raw.home_team);
            const awayData = dataFromMap(teamLogoMap2, raw.away_team);
            event.homeLogo   = homeData?.logo;
            event.awayLogo   = awayData?.logo;
            event.homeTeamId = homeData?.id;
            event.awayTeamId = awayData?.id;
            console.log(`[events]   ~ logoMap lookup: "${raw.home_team}" → ${homeData ? `matched "${homeData.matchedKey}" logo=${!!homeData.logo} id=${homeData.id}` : "✗ NOT FOUND"}`);
            console.log(`[events]   ~ logoMap lookup: "${raw.away_team}" → ${awayData ? `matched "${awayData.matchedKey}" logo=${!!awayData.logo} id=${awayData.id}` : "✗ NOT FOUND"}`);
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

        // For football events still missing logos or IDs, resolve via API-Football
        // (cached 24 h — only costs quota on first hit per unique team name)
        if (s === "football") {
          const missingNames = new Set<string>();
          for (const e of transformed) {
            if (!e.homeLogo || !e.homeTeamId) missingNames.add(e.homeTeam);
            if (!e.awayLogo || !e.awayTeamId) missingNames.add(e.awayTeam);
          }
          if (missingNames.size > 0) {
            console.log(`\n[events] still missing after logoMap — will search API: ${[...missingNames].join(", ")}`);
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
            console.log(`[events] all football events have logos — no fallback search needed`);
          }

          // Final summary per event
          console.log(`\n[events] final event logo/id summary for ${s}:`);
          for (const e of transformed) {
            console.log(`[events]   "${e.homeTeam}" logo=${!!e.homeLogo}  |  "${e.awayTeam}" logo=${!!e.awayLogo}`);
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
