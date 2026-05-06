// /api/football/team-results — all completed fixtures for a team in a season.
//
// DB-first: reads from the local fixtures table (seeded by scripts/seed.ts).
// Falls back to the live API if the DB is empty (pre-seed environment).
//
// Usage: GET /api/football/team-results?team={id}&season={year}

import { NextRequest, NextResponse } from "next/server";
import { and, or, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db, fixtures, teams, leagues } from "@/lib/db";
import { apiFetch, unwrap, currentSeason } from "@/lib/apifootball";
import type { ApiFixture } from "@/lib/types";

const COMPLETED = ["FT", "AET", "PEN"];

export async function GET(req: NextRequest) {
  const teamId = req.nextUrl.searchParams.get("team");
  const season = req.nextUrl.searchParams.get("season") ?? String(currentSeason());

  if (!teamId) {
    return NextResponse.json({ error: "team required" }, { status: 400 });
  }

  const tid = Number(teamId);
  const sea = Number(season);

  // ── 1. Query DB ──────────────────────────────────────────────────────────────
  const ht = alias(teams, "ht");
  const at = alias(teams, "at");

  const rows = await db
    .select({
      id:         fixtures.id,
      date:       fixtures.date,
      round:      fixtures.round,
      status:     fixtures.status,
      homeTeamId: fixtures.homeTeamId,
      homeName:   ht.name,
      homeLogo:   ht.logo,
      awayTeamId: fixtures.awayTeamId,
      awayName:   at.name,
      awayLogo:   at.logo,
      homeGoals:  fixtures.homeGoals,
      awayGoals:  fixtures.awayGoals,
      leagueId:   fixtures.leagueId,
      leagueName: leagues.name,
      leagueLogo: leagues.logo,
    })
    .from(fixtures)
    .innerJoin(ht,      eq(fixtures.homeTeamId, ht.id))
    .innerJoin(at,      eq(fixtures.awayTeamId, at.id))
    .innerJoin(leagues, eq(fixtures.leagueId,   leagues.id))
    .where(
      and(
        inArray(fixtures.status, COMPLETED),
        eq(fixtures.season, sea),
        or(
          eq(fixtures.homeTeamId, tid),
          eq(fixtures.awayTeamId, tid)
        )
      )
    )
    .orderBy(fixtures.timestamp);

  if (rows.length > 0) {
    const results = rows.map((r) => {
      const isHome = r.homeTeamId === tid;
      const gf     = (isHome ? r.homeGoals : r.awayGoals)  ?? 0;
      const ga     = (isHome ? r.awayGoals : r.homeGoals)  ?? 0;
      const total  = (r.homeGoals ?? 0) + (r.awayGoals ?? 0);
      const result: "W" | "D" | "L" = gf > ga ? "W" : gf === ga ? "D" : "L";

      return {
        id:       r.id,
        date:     r.date,
        round:    r.round,
        isHome,
        homeTeam: { id: r.homeTeamId, name: r.homeName, logo: r.homeLogo },
        awayTeam: { id: r.awayTeamId, name: r.awayName, logo: r.awayLogo },
        goals:    { for: gf, against: ga, total },
        result,
        btts:     gf > 0 && ga > 0,
        over25:   total > 2,
        league:   { id: r.leagueId, name: r.leagueName, logo: r.leagueLogo },
      };
    });

    return NextResponse.json({ fixtures: results });
  }

  // ── 2. Fallback: live API ────────────────────────────────────────────────────
  const res = await apiFetch<ApiFixture>(
    "/fixtures",
    { team: teamId, season, status: "FT-AET-PEN" },
    3600
  );

  const apiFixtures = unwrap(res) ?? [];
  const results = apiFixtures
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
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return NextResponse.json({ fixtures: results });
}
