// GET /api/football/team-squad?team={id}
// Returns the current squad for a given team — used by the H2H player picker.
// Cached 1 h (squads change rarely mid-season).

import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/apifootball";

interface ApiSquadPlayer {
  id:       number;
  name:     string;
  age:      number;
  number:   number | null;
  position: string;
  photo:    string;
}

interface ApiSquadEntry {
  team:    { id: number; name: string; logo: string };
  players: ApiSquadPlayer[];
}

export async function GET(req: NextRequest) {
  const teamId = req.nextUrl.searchParams.get("team");
  if (!teamId) return NextResponse.json({ players: [] });

  const raw = await apiFetch<ApiSquadEntry>("/players/squads", { team: teamId }, 3600);
  const entry = raw?.response?.[0];
  if (!entry?.players) return NextResponse.json({ players: [] });

  return NextResponse.json({
    players: entry.players.map((p) => ({
      id:       p.id,
      name:     p.name,
      position: p.position,
      number:   p.number,
      photo:    p.photo,
    })),
  });
}
