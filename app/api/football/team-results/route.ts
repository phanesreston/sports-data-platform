// /api/football/team-results — returns all completed fixtures for a team in a
// given season, enriched with per-game outcome data needed for backtesting.
//
// Usage: GET /api/football/team-results?team={id}&season={year}
//
// For each fixture the response includes:
//   result   — W / D / L from the queried team's perspective
//   btts     — whether both teams scored
//   over25   — whether the match had 3+ goals
// These cover the four built-in strategies (win / draw / over 2.5 / BTTS).
//
// Cached 1 h — past results are immutable, but a match might finish mid-hour.

import { NextRequest, NextResponse } from "next/server";
import { apiFetch, unwrap, currentSeason } from "@/lib/apifootball";
import type { ApiFixture } from "@/lib/types";

export async function GET(req: NextRequest) {
  const teamId = req.nextUrl.searchParams.get("team");
  const season = req.nextUrl.searchParams.get("season") ?? String(currentSeason());

  if (!teamId) {
    return NextResponse.json({ error: "team required" }, { status: 400 });
  }

  // FT-AET-PEN: full time / after extra time / after penalties — all finished games
  const res = await apiFetch<ApiFixture>(
    "/fixtures",
    { team: teamId, season, status: "FT-AET-PEN" },
    3600
  );

  const fixtures = unwrap(res) ?? [];
  const tid = Number(teamId);

  const results = fixtures
    .map((f) => {
      const isHome  = f.teams.home.id === tid;
      const gf      = (isHome ? f.goals.home  : f.goals.away)  ?? 0;
      const ga      = (isHome ? f.goals.away  : f.goals.home)  ?? 0;
      const total   = (f.goals.home ?? 0) + (f.goals.away ?? 0);
      const result: "W" | "D" | "L" = gf > ga ? "W" : gf === ga ? "D" : "L";

      return {
        id:       f.fixture.id,
        date:     f.fixture.date,
        round:    f.league.round,
        isHome,
        homeTeam: { id: f.teams.home.id, name: f.teams.home.name, logo: f.teams.home.logo },
        awayTeam: { id: f.teams.away.id, name: f.teams.away.name, logo: f.teams.away.logo },
        goals:    { for: gf, against: ga, total },
        result,
        btts:     gf > 0 && ga > 0,
        over25:   total > 2,
        league:   { id: f.league.id, name: f.league.name, logo: f.league.logo },
      };
    })
    // Oldest game first so cumulative P&L chart flows chronologically
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return NextResponse.json({ fixtures: results });
}
