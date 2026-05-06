import { NextRequest, NextResponse } from "next/server";
import { and, or, eq, inArray, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db, fixtures, teams, leagues } from "@/lib/db";

export interface H2HMatch {
  date: string;
  homeTeamId: number;
  homeTeam: string;
  homeLogo: string;
  homeScore: number | null;
  awayTeamId: number;
  awayTeam: string;
  awayLogo: string;
  awayScore: number | null;
  winner: "home" | "away" | "draw" | null;
  league: string;
  leagueLogo: string;
}

const COMPLETED = ["FT", "AET", "PEN"];

export async function GET(req: NextRequest) {
  const home = req.nextUrl.searchParams.get("home");
  const away = req.nextUrl.searchParams.get("away");
  const last = parseInt(req.nextUrl.searchParams.get("last") ?? "20", 10);

  if (!home || !away) return NextResponse.json({ matches: [] });

  const homeId = Number(home);
  const awayId = Number(away);

  // Alias teams twice so we can join home and away separately
  const ht = alias(teams, "ht");
  const at = alias(teams, "at");

  const rows = await db
    .select({
      date:       fixtures.date,
      homeTeamId: fixtures.homeTeamId,
      homeTeam:   ht.name,
      homeLogo:   ht.logo,
      homeScore:  fixtures.homeGoals,
      awayTeamId: fixtures.awayTeamId,
      awayTeam:   at.name,
      awayLogo:   at.logo,
      awayScore:  fixtures.awayGoals,
      league:     leagues.name,
      leagueLogo: leagues.logo,
    })
    .from(fixtures)
    .innerJoin(ht,      eq(fixtures.homeTeamId, ht.id))
    .innerJoin(at,      eq(fixtures.awayTeamId, at.id))
    .innerJoin(leagues, eq(fixtures.leagueId,   leagues.id))
    .where(
      and(
        inArray(fixtures.status, COMPLETED),
        or(
          and(eq(fixtures.homeTeamId, homeId), eq(fixtures.awayTeamId, awayId)),
          and(eq(fixtures.homeTeamId, awayId), eq(fixtures.awayTeamId, homeId))
        )
      )
    )
    .orderBy(desc(fixtures.timestamp))
    .limit(last);

  const matches: H2HMatch[] = rows.map((r) => {
    const hg = r.homeScore;
    const ag = r.awayScore;
    let winner: H2HMatch["winner"] = null;
    if (hg !== null && ag !== null) {
      winner = hg > ag ? "home" : ag > hg ? "away" : "draw";
    }
    return { ...r, homeScore: hg, awayScore: ag, winner };
  });

  return NextResponse.json({ matches });
}
