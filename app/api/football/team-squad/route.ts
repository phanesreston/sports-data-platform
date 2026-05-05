// GET /api/football/team-squad?team={id}
// Returns the current squad for a given team — used by the H2H player picker.
// Reads from the local database when seeded; falls back to live API otherwise.

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, squads, players } from "@/lib/db";
import { apiFetch, currentSeason } from "@/lib/apifootball";

export async function GET(req: NextRequest) {
  const teamIdStr = req.nextUrl.searchParams.get("team");
  if (!teamIdStr) return NextResponse.json({ players: [] });

  const teamId = Number(teamIdStr);
  const season = currentSeason();

  // ── try database first ───────────────────────────────────────────────────────
  const dbRows = await db
    .select({
      id:       players.id,
      name:     players.name,
      photo:    players.photo,
      position: squads.position,
      number:   squads.number,
    })
    .from(squads)
    .innerJoin(players, eq(squads.playerId, players.id))
    .where(and(eq(squads.teamId, teamId), eq(squads.season, season)));

  if (dbRows.length > 0) {
    return NextResponse.json({
      players: dbRows
        .sort((a, b) => (a.number ?? 99) - (b.number ?? 99))
        .map((p) => ({ id: p.id, name: p.name, position: p.position ?? "", number: p.number, photo: p.photo ?? "" })),
    });
  }

  // ── fallback to live API (pre-seed) ──────────────────────────────────────────
  interface ApiSquadEntry {
    players: { id: number; name: string; number?: number; position: string; photo: string }[];
  }
  const raw   = await apiFetch<ApiSquadEntry>("/players/squads", { team: teamId }, 3600);
  const entry = raw?.response?.[0] as ApiSquadEntry | undefined;
  if (!entry?.players) return NextResponse.json({ players: [] });

  return NextResponse.json({
    players: entry.players.map((p) => ({
      id:       p.id,
      name:     p.name,
      position: p.position,
      number:   p.number ?? null,
      photo:    p.photo,
    })),
  });
}
