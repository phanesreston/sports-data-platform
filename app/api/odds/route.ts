import { NextRequest, NextResponse } from "next/server";
import type { OddsApiEvent } from "@/lib/types";

const BASE_URL = "https://api.the-odds-api.com/v4";

// All football (soccer) league sport keys supported by The Odds API.
// Fetched in parallel so a single /api/odds?sport=football call covers every league.
const FOOTBALL_SPORT_KEYS = [
  "soccer_epl",
  "soccer_spain_la_liga",
  "soccer_italy_serie_a",
  "soccer_germany_bundesliga",
  "soccer_france_ligue_one",
  "soccer_uefa_champs_league",
  "soccer_uefa_europa_league",
];

// Maps our internal sport keys to The Odds API sport keys.
// Football is handled separately above (multiple keys → merged response).
const SPORT_KEY_MAP: Record<string, string> = {
  nba:               "basketball_nba",
  american_football: "americanfootball_nfl",
  baseball:          "baseball_mlb",
  hockey:            "icehockey_nhl",
  mma:               "mma_mixed_martial_arts",
  rugby:             "rugbyleague_nrl",
  afl:               "aussierules_afl",
  tennis:            "tennis_atp_french_open",
  basketball:        "basketball_euroleague",
  cricket:           "cricket_test_match",
};

// Quota cost = regions × markets. Default to 1 region (uk) = 1 credit per call.
// Override via ODDS_API_REGIONS env var e.g. "uk,eu" for more bookmakers (costs more).
const DEFAULT_REGIONS = process.env.ODDS_API_REGIONS ?? "uk";

async function fetchOddsForKey(
  sportKey: string,
  apiKey: string
): Promise<{ events: OddsApiEvent[]; remaining: string | null; used: string | null; last: string | null }> {
  const url = new URL(`${BASE_URL}/sports/${sportKey}/odds`);
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("regions", DEFAULT_REGIONS);
  url.searchParams.set("markets", "h2h");
  url.searchParams.set("oddsFormat", "decimal");
  url.searchParams.set("dateFormat", "iso");

  const res = await fetch(url.toString(), {
    next: { revalidate: 300 },
  });

  if (res.status === 429) {
    console.warn(`[Odds API] rate limited for ${sportKey}`);
    return { events: [], remaining: null, used: null, last: null };
  }
  if (!res.ok) {
    console.error(`[Odds API] ${sportKey} returned ${res.status}`);
    return { events: [], remaining: null, used: null, last: null };
  }

  const events: OddsApiEvent[] = await res.json();
  return {
    events,
    remaining: res.headers.get("x-requests-remaining"),
    used:      res.headers.get("x-requests-used"),
    last:      res.headers.get("x-requests-last"),
  };
}

export async function GET(req: NextRequest) {
  const sport = req.nextUrl.searchParams.get("sport") ?? "football";
  const apiKey = process.env.ODDS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ events: [] });
  }

  try {
    if (sport === "football") {
      // Fetch all football leagues in parallel — each is a separate Odds API endpoint
      const results = await Promise.all(
        FOOTBALL_SPORT_KEYS.map((key) => fetchOddsForKey(key, apiKey))
      );

      const allEvents: OddsApiEvent[] = results.flatMap((r) => r.events);
      // Log quota from the last successful response
      const last = results.findLast((r) => r.remaining !== null);
      console.log(`[Odds API] football — ${allEvents.length} total events across ${FOOTBALL_SPORT_KEYS.length} leagues`);
      if (last) {
        console.log(`[Odds API] quota — used: ${last.used}, remaining: ${last.remaining}`);
        if (last.remaining !== null && parseInt(last.remaining) < 10) {
          console.warn(`[Odds API] ⚠ Low quota: ${last.remaining} credits remaining`);
        }
      }

      return NextResponse.json({ events: allEvents });
    }

    // Non-football sports
    const sportKey = SPORT_KEY_MAP[sport];
    if (!sportKey) {
      return NextResponse.json({ events: [] });
    }

    const { events, remaining, used, last } = await fetchOddsForKey(sportKey, apiKey);
    console.log(`[Odds API] quota — used: ${used}, remaining: ${remaining}, this call cost: ${last}`);
    if (remaining !== null && parseInt(remaining) < 10) {
      console.warn(`[Odds API] ⚠ Low quota: ${remaining} credits remaining`);
    }

    return NextResponse.json(
      { events },
      {
        headers: {
          ...(remaining ? { "X-Odds-Remaining": remaining } : {}),
          ...(used      ? { "X-Odds-Used":      used      } : {}),
          ...(last      ? { "X-Odds-Last":       last      } : {}),
        },
      }
    );
  } catch (err) {
    console.error("[Odds API] fetch error:", err);
    return NextResponse.json({ events: [], error: "fetch_failed" });
  }
}
