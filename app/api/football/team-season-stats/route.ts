// /api/football/team-season-stats — season statistics for the Stats tab.
//
// DB-only: computes W/D/L/goals/clean-sheets from the fixtures table.
// Fields not stored in DB (shots, passes, fouls, cards, penalties, lineups)
// are omitted — the Stats tab renders "—" for any null value automatically.
//
// Usage: GET /api/football/team-season-stats?team={id}&league={id}&season={year}

import { NextRequest, NextResponse } from "next/server";
import { and, or, eq, inArray } from "drizzle-orm";
import { db, fixtures } from "@/lib/db";
import { currentSeason } from "@/lib/apifootball";

const COMPLETED = ["FT", "AET", "PEN"];

export async function GET(req: NextRequest) {
  const team        = req.nextUrl.searchParams.get("team");
  const league      = req.nextUrl.searchParams.get("league");
  const seasonParam = req.nextUrl.searchParams.get("season");
  const requestedSeason = seasonParam ? Number(seasonParam) : currentSeason();

  if (!team || !league) {
    return NextResponse.json({ error: "team and league are required" }, { status: 400 });
  }

  const tid = Number(team);
  const lid = Number(league);

  // Try the requested season, fall back to previous two if empty
  for (let offset = 0; offset <= 2; offset++) {
    const season = requestedSeason - offset;

    const rows = await db
      .select({
        homeTeamId: fixtures.homeTeamId,
        homeGoals:  fixtures.homeGoals,
        awayGoals:  fixtures.awayGoals,
        timestamp:  fixtures.timestamp,
      })
      .from(fixtures)
      .where(and(
        or(eq(fixtures.homeTeamId, tid), eq(fixtures.awayTeamId, tid)),
        eq(fixtures.season, season),
        eq(fixtures.leagueId, lid),
        inArray(fixtures.status, COMPLETED)
      ));

    if (!rows.length) continue;

    let wins = 0, draws = 0, losses = 0, gf = 0, ga = 0, cleanSheets = 0;

    for (const f of rows) {
      const isHome   = f.homeTeamId === tid;
      const scored   = (isHome ? f.homeGoals : f.awayGoals) ?? 0;
      const conceded = (isHome ? f.awayGoals : f.homeGoals) ?? 0;
      gf += scored; ga += conceded;
      if      (scored   > conceded) wins++;
      else if (scored === conceded) draws++;
      else                          losses++;
      if (conceded === 0) cleanSheets++;
    }

    const played = rows.length;

    return NextResponse.json({
      season,
      stats: {
        fixtures: {
          played: { total: played },
          wins:   { total: wins   },
          draws:  { total: draws  },
          loses:  { total: losses },
        },
        goals: {
          for:     { total: { total: gf } },
          against: { total: { total: ga } },
        },
        clean_sheet: { total: cleanSheets },
        // Fields not in DB — the Stats tab shows "—" for null values
        shots:   null,
        passes:  null,
        fouls:   null,
        cards:   null,
        penalty: null,
        lineups: null,
      },
    });
  }

  return NextResponse.json({ stats: null, season: requestedSeason });
}
