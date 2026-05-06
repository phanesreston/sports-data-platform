// /api/football/league-teams — teams competing in a league for a given season.
//
// DB-only: reads from the leagueTeams + teams tables seeded by scripts/seed.ts.
//
// Usage: GET /api/football/league-teams?league={id}&season={year}

import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db, leagueTeams, teams } from "@/lib/db";
import { currentSeason } from "@/lib/apifootball";

const SEASON = currentSeason();

export async function GET(req: NextRequest) {
  const league = req.nextUrl.searchParams.get("league");
  const season = Number(req.nextUrl.searchParams.get("season") ?? SEASON);

  if (!league) return NextResponse.json({ error: "league required" }, { status: 400 });

  const rows = await db
    .select({
      id:      teams.id,
      name:    teams.name,
      logo:    teams.logo,
      country: teams.country,
    })
    .from(leagueTeams)
    .innerJoin(teams, eq(leagueTeams.teamId, teams.id))
    .where(and(eq(leagueTeams.leagueId, Number(league)), eq(leagueTeams.season, season)))
    .orderBy(asc(teams.name));

  return NextResponse.json({
    teams: rows.map((t) => ({
      team:  { id: t.id, name: t.name, logo: t.logo, country: t.country, founded: null },
      venue: { name: "", city: "", capacity: null },
    })),
  });
}
