import { NextRequest, NextResponse } from "next/server";
import { apiFetch, unwrap } from "@/lib/apifootball";

// Leagues to search when resolving a team by name.
// Using league+season ensures we only get SENIOR clubs — no youth/reserve teams.
const LOOKUP_LEAGUES = [
  { id: 39,  season: 2024 }, // Premier League
  { id: 140, season: 2024 }, // La Liga
  { id: 135, season: 2024 }, // Serie A
  { id: 78,  season: 2024 }, // Bundesliga
  { id: 61,  season: 2024 }, // Ligue 1
  { id: 2,   season: 2024 }, // UEFA Champions League
  { id: 3,   season: 2024 }, // UEFA Europa League
  // Fallback seasons for recently relegated/promoted clubs
  { id: 39,  season: 2023 },
  { id: 140, season: 2023 },
  { id: 135, season: 2023 },
  { id: 78,  season: 2023 },
  { id: 61,  season: 2023 },
];

// Leagues to try for season stats (priority order)
const STATS_LEAGUE_PRIORITY = [39, 140, 135, 78, 61, 2, 3];
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

/** Strip everything except letters and digits for loose comparison */
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Find a team by name using league rosters instead of the search endpoint.
 * Fetching /teams?league=X&season=Y only returns the senior clubs actually
 * registered in that league — no youth / reserve teams possible.
 *
 * Match priority:
 *   1. Exact (after normalisation)
 *   2. One name contains the other ("Wolverhampton" ↔ "Wolverhampton Wanderers")
 */
async function findTeamByName(name: string): Promise<ApiTeam | null> {
  const nn = norm(name);

  for (const { id, season } of LOOKUP_LEAGUES) {
    const res = unwrap(
      await apiFetch<ApiTeam>("/teams", { league: id, season }, 86400)
    );
    if (!res?.length) continue;

    const exact = res.find((t) => norm(t.team.name) === nn);
    if (exact) return exact;

    const fuzzy = res.find((t) => {
      const tn = norm(t.team.name);
      return tn.includes(nn) || nn.includes(tn);
    });
    if (fuzzy) return fuzzy;
  }

  return null;
}

export async function GET(req: NextRequest) {
  const name   = req.nextUrl.searchParams.get("name");
  const teamId = req.nextUrl.searchParams.get("id");

  if (!name && !teamId) {
    return NextResponse.json({ error: "name or id required" }, { status: 400 });
  }

  // ── Step 1: resolve team entry ──────────────────────────────────────────────
  let teamEntry: ApiTeam | null = null;

  if (teamId) {
    // Direct ID lookup — unambiguous, no name matching needed
    const res = unwrap(await apiFetch<ApiTeam>("/teams", { id: teamId }, 86400));
    teamEntry = res?.[0] ?? null;
  } else {
    // League-roster lookup — returns only senior clubs, never U21/reserves
    teamEntry = await findTeamByName(name!);
  }

  if (!teamEntry) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }
  const { team, venue } = teamEntry;

  // ── Step 2: find which league the team is currently in ──────────────────────
  const leaguesRes = unwrap(
    await apiFetch<ApiLeagueForTeam>("/leagues", { team: team.id, current: "true" }, 3600)
  );
  const currentLeagueId =
    leaguesRes?.find((l) => STATS_LEAGUE_PRIORITY.includes(l.league.id))?.league.id ??
    leaguesRes?.[0]?.league.id;

  // ── Step 3: stats + squad in parallel ───────────────────────────────────────
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

  const stats = unwrap(statsRes)?.[0] ?? null;
  const squad = unwrap(squadRes)?.[0]?.players ?? [];

  const grouped = {
    Goalkeepers: squad.filter((p) => p.position === "Goalkeeper"),
    Defenders:   squad.filter((p) => p.position === "Defender"),
    Midfielders: squad.filter((p) => p.position === "Midfielder"),
    Forwards:    squad.filter((p) => p.position === "Attacker"),
  };

  return NextResponse.json({ team, venue, stats, squad: grouped });
}
