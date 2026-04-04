import { NextRequest, NextResponse } from "next/server";
import type { OddsApiEvent } from "@/lib/types";

const BASE_URL = "https://api.the-odds-api.com/v4";

// Maps our internal sport keys to The Odds API sport keys.
// The Odds API uses sport key in the URL path: /v4/sports/{sportKey}/odds
const SPORT_KEY_MAP: Record<string, string> = {
  football:          "soccer_epl",
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
  // formula1, handball, volleyball, horse_racing not covered by The Odds API
};

// Quota cost = regions × markets. Default to 1 region (uk) = 1 credit per call.
// Override via ODDS_API_REGIONS env var e.g. "uk,eu" for more bookmakers (costs more).
const DEFAULT_REGIONS = process.env.ODDS_API_REGIONS ?? "uk";

export async function GET(req: NextRequest) {
  const sport = req.nextUrl.searchParams.get("sport") ?? "football";
  const apiKey = process.env.ODDS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ events: [] });
  }

  const sportKey = SPORT_KEY_MAP[sport];
  if (!sportKey) {
    return NextResponse.json({ events: [] });
  }

  try {
    // GET /v4/sports/{sport}/odds — apiKey as query param, not header
    const url = new URL(`${BASE_URL}/sports/${sportKey}/odds`);
    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("regions", DEFAULT_REGIONS);
    url.searchParams.set("markets", "h2h");       // 1 market × 1 region = 1 credit
    url.searchParams.set("oddsFormat", "decimal");
    url.searchParams.set("dateFormat", "iso");

    const res = await fetch(url.toString(), {
      next: { revalidate: 300 }, // cache 5 min — avoids burning quota on every page load
    });

    if (res.status === 429) {
      console.warn("[Odds API] rate limited");
      return NextResponse.json({ events: [], error: "rate_limited" });
    }

    if (!res.ok) {
      console.error("[Odds API] error:", res.status, await res.text());
      return NextResponse.json({ events: [], error: `status_${res.status}` });
    }

    // Response is a plain array — no wrapper unlike API-Football
    const events: OddsApiEvent[] = await res.json();

    // Log quota usage on every call so you can monitor free tier consumption
    const remaining = res.headers.get("x-requests-remaining");
    const used      = res.headers.get("x-requests-used");
    const last      = res.headers.get("x-requests-last");
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
