import { NextRequest, NextResponse } from "next/server";
import { apiFetch, unwrap, currentSeason } from "@/lib/apifootball";

const SEASON = currentSeason();

interface ApiTeamResult {
  team:  { id: number; name: string; country: string; logo: string };
  venue: { city: string };
}

interface ApiPlayerResult {
  player: {
    id: number;
    name: string;
    nationality: string;
    photo: string;
  };
  statistics: {
    team:   { id: number; name: string; logo: string };
    games:  { position: string };
  }[];
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ teams: [], players: [] });
  }

  // Search teams and players in parallel
  const [teamsRes, playersRes] = await Promise.all([
    apiFetch<ApiTeamResult>("/teams", { search: q }, 3600),
    apiFetch<ApiPlayerResult>("/players", { search: q, season: SEASON }, 3600),
  ]);

  const teams = (unwrap(teamsRes) ?? []).slice(0, 6).map((t) => ({
    id:      t.team.id,
    name:    t.team.name,
    country: t.team.country,
    logo:    t.team.logo,
    city:    t.venue.city ?? "",
  }));

  const players = (unwrap(playersRes) ?? []).slice(0, 6).map((p) => {
    const stat = p.statistics?.[0];
    return {
      id:       p.player.id,
      name:     p.player.name,
      photo:    p.player.photo,
      nationality: p.player.nationality,
      position: stat?.games.position ?? "",
      team:     stat ? { id: stat.team.id, name: stat.team.name, logo: stat.team.logo } : null,
    };
  });

  return NextResponse.json({ teams, players });
}
