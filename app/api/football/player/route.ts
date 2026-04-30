// /api/football/player — fetches a single player's full profile and statistics.
//
// Usage:
//   GET /api/football/player?id=276           → auto-discovers the most recent season
//   GET /api/football/player?id=276&season=2023 → fetches a specific season only
//
// Season discovery works by trying seasons in descending order (current, current-1,
// current-2) and returning the first one that has data. This handles players who
// haven't appeared in the current season yet (e.g. newly signed, injured).

import { NextRequest, NextResponse } from "next/server";
import { apiFetch, unwrap, isRateLimited, currentSeason } from "@/lib/apifootball";

// ApiPlayerFull — the full shape returned by /players?id=&season= on API-Football v3.
// Exported so the athlete page can reuse it for type-safety.
export interface ApiPlayerFull {
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    nationality: string;
    height: string | null;
    weight: string | null;
    photo: string;
    injured: boolean;
  };
  // statistics is an array — one entry per competition the player appeared in.
  // A player appearing in the Premier League AND the Champions League will have two entries.
  statistics: {
    team:   { id: number; name: string; logo: string };
    league: { id: number; name: string; logo: string; country: string; season: number };
    games: {
      appearences: number | null;
      lineups:     number | null;
      minutes:     number | null;
      position:    string;
      rating:      string | null;
    };
    goals:   { total: number | null; assists: number | null; conceded: number | null; saves: number | null };
    shots:   { total: number | null; on: number | null };
    passes:  { total: number | null; key: number | null; accuracy: string | null };
    tackles: { total: number | null; blocks: number | null; interceptions: number | null };
    duels:   { total: number | null; won: number | null };
    dribbles:{ attempts: number | null; success: number | null };
    cards:   { yellow: number; red: number };
  }[];
}

// Try up to 3 seasons when no specific season is requested.
// The API returns an empty array (not a 404) when a player has no data for that season.
const FALLBACK_SEASONS = [currentSeason(), currentSeason() - 1, currentSeason() - 2];

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // If the caller passes ?season=X we only try that one season (used by the season
  // selector on the athlete page). Otherwise we walk through FALLBACK_SEASONS.
  const seasonParam = req.nextUrl.searchParams.get("season");
  const seasons = seasonParam ? [Number(seasonParam)] : FALLBACK_SEASONS;

  for (const season of seasons) {
    // Cache player stats for 60 seconds — short because match ratings update live.
    const raw = await apiFetch<ApiPlayerFull>("/players", { id, season }, 60);

    // isRateLimited detects the API-Football rate-limit error response.
    // We return 429 immediately rather than trying the next season.
    if (isRateLimited(raw)) {
      console.warn(`[player] rate limited fetching player ${id} season ${season}`);
      return NextResponse.json({ error: "Rate limited — try again in a moment" }, { status: 429 });
    }

    const res = unwrap(raw);
    if (res?.length) {
      console.log(`[player] found player ${id} in season ${season}`);
      // Return the season alongside the data so the client can pre-select the right
      // year in the season selector without guessing.
      return NextResponse.json({ player: res[0], season });
    }

    console.log(`[player] no data for player ${id} season ${season}, trying next`);
  }

  console.warn(`[player] player ${id} not found in any season`);
  return NextResponse.json({ error: "Player not found" }, { status: 404 });
}
