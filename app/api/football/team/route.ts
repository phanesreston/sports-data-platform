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
  console.log(`\n[team] findTeamByName("${name}") normalisedQuery="${nn}"`);

  for (const { id, season } of LOOKUP_LEAGUES) {
    const res = unwrap(
      await apiFetch<ApiTeam>("/teams", { league: id, season }, 86400)
    );
    if (!res?.length) {
      console.log(`[team]   league ${id}/${season}: no teams returned`);
      continue;
    }

    console.log(`[team]   league ${id}/${season}: ${res.length} teams — checking for "${name}"`);

    const exact = res.find((t) => norm(t.team.name) === nn);
    if (exact) {
      console.log(`[team]   ✓ exact match: "${exact.team.name}" (id ${exact.team.id}) in league ${id}`);
      return exact;
    }

    const fuzzy = res.find((t) => {
      const tn = norm(t.team.name);
      return tn.includes(nn) || nn.includes(tn);
    });
    if (fuzzy) {
      console.log(`[team]   ~ fuzzy match: "${fuzzy.team.name}" (id ${fuzzy.team.id}) in league ${id} for query "${name}"`);
      return fuzzy;
    }
  }

  // Alias fallback: some clubs are stored under a nickname in API-Football
  const alias = TEAM_NAME_ALIASES[name];
  if (alias) {
    const an = norm(alias);
    console.log(`[team]   trying alias "${alias}" (norm="${an}") for "${name}"`);
    for (const { id, season } of LOOKUP_LEAGUES) {
      const res = unwrap(await apiFetch<ApiTeam>("/teams", { league: id, season }, 86400));
      if (!res?.length) continue;
      const match = res.find((t) => {
        const tn = norm(t.team.name);
        return tn === an || tn.includes(an) || an.includes(tn);
      });
      if (match) {
        console.log(`[team]   ✓ alias match: "${match.team.name}" (id ${match.team.id}) via alias "${alias}"`);
        return match;
      }
    }
  }

  console.warn(`[team]   ✗ no match found for "${name}" in any configured league`);
  return null;
}

export async function GET(req: NextRequest) {
  const name   = req.nextUrl.searchParams.get("name");
  const teamId = req.nextUrl.searchParams.get("id");

  if (!name && !teamId) {
    return NextResponse.json({ error: "name or id required" }, { status: 400 });
  }

  console.log(`\n[team] GET request — name="${name}" id="${teamId}"`);

  // ── Step 1: resolve team entry ──────────────────────────────────────────────
  let teamEntry: ApiTeam | null = null;

  if (teamId) {
    console.log(`[team] looking up by id: ${teamId}`);
    const res = unwrap(await apiFetch<ApiTeam>("/teams", { id: teamId }, 86400));
    teamEntry = res?.[0] ?? null;
    console.log(`[team] id lookup result: ${teamEntry ? `"${teamEntry.team.name}" (id ${teamEntry.team.id})` : "✗ not found"}`);
  } else {
    // League-roster lookup — returns only senior clubs, never U21/reserves
    teamEntry = await findTeamByName(name!);
  }

  if (!teamEntry) {
    console.warn(`[team] ✗ returning 404 for name="${name}" id="${teamId}"`);
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }
  const { team, venue } = teamEntry;
  console.log(`[team] resolved: "${team.name}" (id ${team.id})`);

  // ── Step 2: find which league the team is currently in ──────────────────────
  const leaguesRes = unwrap(
    await apiFetch<ApiLeagueForTeam>("/leagues", { team: team.id, current: "true" }, 3600)
  );
  console.log(`[team] leagues for team ${team.id}: ${leaguesRes?.map(l => `${l.league.name}(${l.league.id})`).join(", ") || "none"}`);
  const currentLeagueId =
    leaguesRes?.find((l) => STATS_LEAGUE_PRIORITY.includes(l.league.id))?.league.id ??
    leaguesRes?.[0]?.league.id;
  console.log(`[team] using league ${currentLeagueId} for stats`);

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
  console.log(`[team] stats: ${stats ? "✓" : "✗ missing"}  squad: ${squad.length} players`);
  console.log(`[team] ── DONE returning "${team.name}" ──\n`);

  const grouped = {
    Goalkeepers: squad.filter((p) => p.position === "Goalkeeper"),
    Defenders:   squad.filter((p) => p.position === "Defender"),
    Midfielders: squad.filter((p) => p.position === "Midfielder"),
    Forwards:    squad.filter((p) => p.position === "Attacker"),
  };

  return NextResponse.json({ team, venue, stats, squad: grouped });
}
