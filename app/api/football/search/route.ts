import { NextRequest, NextResponse } from "next/server";
import { apiFetch, unwrap, currentSeason } from "@/lib/apifootball";

const SEASON = currentSeason();

interface ApiTeamResult {
  team:  { id: number; name: string; country: string; logo: string };
  venue: { city: string };
}

interface ApiPlayerResult {
  player: { id: number; name: string; nationality: string; photo: string };
  statistics: {
    team:  { id: number; name: string; logo: string };
    games: { position: string };
  }[];
}

interface ApiLeagueResult {
  league:  { id: number; name: string; type: string; logo: string };
  country: { name: string; flag: string | null };
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ teams: [], players: [], leagues: [] });

  const [teamsRes, playersRes, leaguesRes] = await Promise.all([
    apiFetch<ApiTeamResult>("/teams", { search: q }, 3600),
    apiFetch<ApiPlayerResult>("/players", { search: q, season: SEASON }, 3600),
    apiFetch<ApiLeagueResult>("/leagues", { search: q }, 3600),
  ]);

  const teams = (unwrap(teamsRes) ?? []).slice(0, 5).map((t) => ({
    id:      t.team.id,
    name:    t.team.name,
    country: t.team.country,
    logo:    t.team.logo,
    city:    t.venue?.city ?? "",
  }));

  const players = (unwrap(playersRes) ?? []).slice(0, 5).map((p) => {
    const stat = p.statistics?.[0];
    return {
      id:          p.player.id,
      name:        p.player.name,
      photo:       p.player.photo,
      nationality: p.player.nationality,
      position:    stat?.games.position ?? "",
      team:        stat ? { id: stat.team.id, name: stat.team.name, logo: stat.team.logo } : null,
    };
  });

  const leagues = (unwrap(leaguesRes) ?? [])
    .filter((l) => l.league.type === "League")
    .slice(0, 4)
    .map((l) => ({
      id:      l.league.id,
      name:    l.league.name,
      logo:    l.league.logo,
      country: l.country.name,
      flag:    l.country.flag ?? "",
    }));

  return NextResponse.json({ teams, players, leagues });
}
