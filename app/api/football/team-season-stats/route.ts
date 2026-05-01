// /api/football/team-season-stats — returns the full `/teams/statistics` payload
// for the Stats tab. The base `/api/football/team` route only surfaces a subset
// of what the API returns (fixtures, goals, clean sheet). This endpoint exposes
// shots, passes, cards, penalty, fouls and lineups as well.
//
// Usage: GET /api/football/team-season-stats?team={id}&league={id}&season={year}
// Falls back to season-1 then season-2 if the requested season returns no data.
// Cached 1 hour — team season stats don't change in real-time.

import { NextRequest, NextResponse } from "next/server";
import { apiFetch, currentSeason } from "@/lib/apifootball";

async function fetchStats(team: string, league: string, season: number) {
  const res = await apiFetch<unknown>(
    "/teams/statistics",
    { team, league, season: String(season) },
    3600
  );
  return (res as { response?: unknown[] } | null)?.response?.[0] ?? null;
}

export async function GET(req: NextRequest) {
  const team   = req.nextUrl.searchParams.get("team");
  const league = req.nextUrl.searchParams.get("league");
  const seasonParam = req.nextUrl.searchParams.get("season");
  const requestedSeason = seasonParam ? Number(seasonParam) : currentSeason();

  if (!team || !league) {
    return NextResponse.json({ error: "team and league are required" }, { status: 400 });
  }

  // Try requested season first, then fall back up to 2 seasons back if empty.
  // API-Football sometimes has no data for the current in-progress season on
  // the free tier, so the fallback ensures the Stats tab shows something useful.
  for (let offset = 0; offset <= 2; offset++) {
    const season = requestedSeason - offset;
    const stats = await fetchStats(team, league, season);
    if (stats) {
      // Return the actual season used so the client can label it correctly.
      return NextResponse.json({ stats, season });
    }
  }

  return NextResponse.json({ stats: null, season: requestedSeason });
}
