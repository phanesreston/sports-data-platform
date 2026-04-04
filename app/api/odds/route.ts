import { NextRequest, NextResponse } from "next/server";
import type { OddsApiEvent } from "@/lib/types";

const BASE_URL = "https://api.the-odds-api.com/v4";

// Maps our internal sport keys to The Odds API sport keys
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
  // formula1, handball, volleyball, horse_racing not supported by The Odds API
};

export async function GET(req: NextRequest) {
  const sport = req.nextUrl.searchParams.get("sport") ?? "football";
  const apiKey = process.env.ODDS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ODDS_API_KEY not configured", events: [] },
      { status: 200 } // Return 200 so callers can degrade gracefully
    );
  }

  const sportKey = SPORT_KEY_MAP[sport];
  if (!sportKey) {
    return NextResponse.json({ events: [] });
  }

  try {
    const url = new URL(`${BASE_URL}/sports/${sportKey}/odds`);
    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("regions", "uk,eu,au");
    url.searchParams.set("markets", "h2h");
    url.searchParams.set("oddsFormat", "decimal");
    url.searchParams.set("dateFormat", "iso");

    const res = await fetch(url.toString(), {
      next: { revalidate: 300 }, // cache 5 min
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[Odds API] error:", res.status, text);
      return NextResponse.json({ events: [], error: `Odds API returned ${res.status}` });
    }

    const events: OddsApiEvent[] = await res.json();

    // Return remaining quota in headers for monitoring
    const remaining = res.headers.get("x-requests-remaining");
    const used = res.headers.get("x-requests-used");

    return NextResponse.json(
      { events },
      {
        headers: {
          ...(remaining ? { "X-Odds-Remaining": remaining } : {}),
          ...(used ? { "X-Odds-Used": used } : {}),
        },
      }
    );
  } catch (err) {
    console.error("[Odds API] fetch error:", err);
    return NextResponse.json({ events: [], error: "Failed to fetch odds" });
  }
}
