import { NextRequest, NextResponse } from "next/server";
import { apiFetch, unwrap, currentSeason, TEAM_NAME_ALIASES, pickBestTeam, getTeamSearchVariants } from "@/lib/apifootball";


// Leagues to try for season stats (priority order)
const STATS_LEAGUE_PRIORITY = [39, 140, 135, 78, 61, 2, 3];
const SEASON = currentSeason();

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

/**
 * Find a team using /teams?name=X (direct name search).
 * Try the alias first (e.g. "Wolves" for "Wolverhampton Wanderers"), then
 * progressive variants of the full name. pickBestTeam filters youth/reserve
 * clubs from results so we always get the senior side.
 */
async function findTeamByName(name: string): Promise<ApiTeam | null> {
  console.log(`\n[team] findTeamByName("${name}")`);

  // Alias first, then progressive name variants
  const alias = TEAM_NAME_ALIASES[name];
  const variants: string[] = [];
  if (alias) variants.push(alias);
  for (const v of getTeamSearchVariants(name)) {
    if (!variants.includes(v)) variants.push(v);
  }

  for (const variant of variants) {
    console.log(`[team]   GET /teams?name="${variant}"`);
    const res = unwrap(await apiFetch<ApiTeam>("/teams", { name: variant }, 3600));
    if (!res?.length) {
      console.log(`[team]   no results`);
      continue;
    }
    const match = pickBestTeam(res, name);
    if (match) {
      console.log(`[team]   ✓ "${match.team.name}" (id ${match.team.id}) via search "${variant}"`);
      return match;
    }
    console.log(`[team]   all results were youth/reserve teams`);
  }

  console.warn(`[team]   ✗ no match found for "${name}"`);
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
