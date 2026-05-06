// /api/football/player-search — searches for players by name.
//
// DB-only: queries the players table with a LIKE pattern, enriched with
// squad membership for team/position info.
//
// Usage: GET /api/football/player-search?q={name}

import { NextRequest, NextResponse } from "next/server";
import { and, eq, like } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db, players, squads, teams } from "@/lib/db";
import { currentSeason } from "@/lib/apifootball";

const SEASON = currentSeason();

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) return NextResponse.json({ players: [] });

  const pattern = `%${q}%`;

  const rows = await db
    .select({
      id:          players.id,
      name:        players.name,
      photo:       players.photo,
      nationality: players.nationality,
      position:    squads.position,
      teamId:      squads.teamId,
      teamName:    teams.name,
      teamLogo:    teams.logo,
    })
    .from(players)
    .leftJoin(squads, and(eq(squads.playerId, players.id), eq(squads.season, SEASON)))
    .leftJoin(teams, sql`${teams.id} = ${squads.teamId}`)
    .where(like(players.name, pattern))
    .limit(10);

  return NextResponse.json({
    players: rows.map((r) => ({
      id:          r.id,
      name:        r.name,
      photo:       r.photo ?? null,
      nationality: r.nationality ?? null,
      team:        r.teamId ? { id: r.teamId, name: r.teamName, logo: r.teamLogo } : null,
      league:      null,
      position:    r.position ?? null,
    })),
  });
}
