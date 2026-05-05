// /api/football/player-search — searches for players by name.
//
// Usage: GET /api/football/player-search?q={name}
//
// Tries the current season first, falls back to the previous season if no
// results — useful for players who haven't featured yet this season.
// Returns the top 10 matches with team, position, and photo.

import { NextRequest, NextResponse } from "next/server";
import { apiFetch, currentSeason } from "@/lib/apifootball";

interface ApiPlayerEntry {
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    nationality: string;
    photo: string;
  };
  statistics: Array<{
    team:   { id: number; name: string; logo: string };
    league: { id: number; name: string; country: string; logo: string };
    games:  { appearences: number | null; minutes: number | null; position: string };
    goals:  { total: number | null; assists: number | null };
  }>;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) return NextResponse.json({ players: [] });

  const season = currentSeason();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function search(s: number): Promise<any[]> {
    const raw = await apiFetch<ApiPlayerEntry>("/players", { search: q, season: s }, 3600);
    return raw?.response ?? [];
  }

  let entries = await search(season);
  if (entries.length === 0) entries = await search(season - 1);

  const players = entries.slice(0, 10).map((e: ApiPlayerEntry) => {
    const stat = e.statistics[0] ?? null;
    return {
      id:          e.player.id,
      name:        e.player.name,
      photo:       e.player.photo,
      nationality: e.player.nationality,
      team:        stat ? { id: stat.team.id, name: stat.team.name, logo: stat.team.logo } : null,
      league:      stat ? { id: stat.league.id, name: stat.league.name, logo: stat.league.logo } : null,
      position:    stat?.games.position ?? null,
    };
  });

  return NextResponse.json({ players });
}
