import { NextRequest, NextResponse } from "next/server";
import { apiFetch, unwrap } from "@/lib/apifootball";

// Known league IDs to try when fetching team statistics
const LEAGUE_PRIORITY = [39, 140, 135, 78, 61, 2, 3, 848];
const SEASON = 2024;

interface ApiTeam {
  team: { id: number; name: string; code: string; country: string; founded: number; logo: string };
  venue: { name: string; city: string; capacity: number; surface: string; image: string };
}

interface ApiLeagueForTeam {
  league: { id: number; name: string; logo: string; country: string };
  seasons: { year: number; current: boolean }[];
}

interface ApiTeamStats {
  team: { id: number; name: string; logo: string };
  league: { id: number; name: string; logo: string; season: number };
  form: string;
  fixtures: {
    played: { home: number; away: number; total: number };
    wins:   { home: number; away: number; total: number };
    draws:  { home: number; away: number; total: number };
    loses:  { home: number; away: number; total: number };
  };
  goals: {
    for:     { average: { home: string; away: string; total: string }; total: { home: number; away: number; total: number } };
    against: { average: { home: string; away: string; total: string }; total: { home: number; away: number; total: number } };
  };
  clean_sheet: { home: number; away: number; total: number };
}

interface ApiSquadPlayer {
  id: number;
  name: string;
  age: number;
  number: number | null;
  position: string;
  photo: string;
}

export async function GET(req: NextRequest) {
  const name   = req.nextUrl.searchParams.get("name");
  const teamId = req.nextUrl.searchParams.get("id");

  if (!name && !teamId) {
    return NextResponse.json({ error: "name or id required" }, { status: 400 });
  }

  // Step 1: find team
  const searchParam: Record<string, string | number> = teamId ? { id: teamId } : { search: name! };
  const teamRes = unwrap(await apiFetch<ApiTeam>("/teams", searchParam, 86400));
  if (!teamRes?.length) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }
  const { team, venue } = teamRes[0];

  // Step 2: find which leagues the team is currently in
  const leaguesRes = unwrap(
    await apiFetch<ApiLeagueForTeam>("/leagues", { team: team.id, current: "true" }, 3600)
  );
  const currentLeagueId =
    leaguesRes?.find((l) => LEAGUE_PRIORITY.includes(l.league.id))?.league.id ??
    leaguesRes?.[0]?.league.id;

  // Step 3: team statistics (parallel with squad)
  const [statsRes, squadRes] = await Promise.all([
    currentLeagueId
      ? apiFetch<ApiTeamStats>("/teams/statistics", { team: team.id, league: currentLeagueId, season: SEASON }, 3600)
      : Promise.resolve(null),
    apiFetch<{ team: ApiTeam["team"]; players: ApiSquadPlayer[] }>(
      "/players/squads",
      { team: team.id },
      3600
    ),
  ]);

  const stats  = unwrap(statsRes)?.[0] ?? null;
  const squad  = unwrap(squadRes)?.[0]?.players ?? [];

  // Group squad by position
  const grouped = {
    Goalkeepers: squad.filter((p) => p.position === "Goalkeeper"),
    Defenders:   squad.filter((p) => p.position === "Defender"),
    Midfielders: squad.filter((p) => p.position === "Midfielder"),
    Forwards:    squad.filter((p) => p.position === "Attacker"),
  };

  return NextResponse.json({ team, venue, stats, squad: grouped });
}
