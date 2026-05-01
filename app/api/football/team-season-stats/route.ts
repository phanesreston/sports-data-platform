// /api/football/team-season-stats — returns the full `/teams/statistics` payload
// for the Stats tab. The base `/api/football/team` route only surfaces a subset
// of what the API returns (fixtures, goals, clean sheet). This endpoint exposes
// shots, passes, cards, penalty, fouls and lineups as well.
//
// Usage: GET /api/football/team-season-stats?team={id}&league={id}&season={year}
// Cached 1 hour — team season stats don't change in real-time.

import { NextRequest, NextResponse } from "next/server";
import { apiFetch, currentSeason } from "@/lib/apifootball";

export async function GET(req: NextRequest) {
  const team   = req.nextUrl.searchParams.get("team");
  const league = req.nextUrl.searchParams.get("league");
  const season = req.nextUrl.searchParams.get("season") ?? String(currentSeason());

  if (!team || !league) {
    return NextResponse.json({ error: "team and league are required" }, { status: 400 });
  }

  // /teams/statistics returns a SINGLE object in response[0], not an array.
  // We cast to `unknown` and return the raw response so the client can access
  // whatever fields it needs with null-safe checks. This avoids having to
  // maintain a rigid TypeScript interface for every possible field.
  const res = await apiFetch<unknown>(
    "/teams/statistics",
    { team, league, season },
    3600
  );

  // The raw response wrapper has a `response` array with one element.
  const stats = (res as { response?: unknown[] } | null)?.response?.[0] ?? null;

  if (!stats) {
    return NextResponse.json({ stats: null });
  }

  return NextResponse.json({ stats });
}
