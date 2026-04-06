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

/**
 * From a list of API-Football team results, pick the best match for `query`.
 * Prefers: exact name match > senior team (no U21/U23/Reserves) > first result.
 */
function pickBestTeam(results: ApiTeam[], query: string): ApiTeam | null {
  if (!results.length) return null;
  const q = query.toLowerCase();

  // If the query itself is for a youth/reserve team, don't filter
  const queryIsYouth = /\b(u\d{2}|u-\d{2}|youth|reserve|junior|ii\b|b\s?team)\b/i.test(query);

  let pool = results;
  if (!queryIsYouth) {
    const seniors = results.filter(
      (r) => !/\b(u\d{2}|u-\d{2}|youth|reserves?|juniors?|\bii\b|b\s?team)\b/i.test(r.team.name)
    );
    if (seniors.length) pool = seniors;
  }

  // Prefer an exact name match within the pool
  return pool.find((r) => r.team.name.toLowerCase() === q) ?? pool[0];
}

export async function GET(req: NextRequest) {
  const name   = req.nextUrl.searchParams.get("name");
  const teamId = req.nextUrl.searchParams.get("id");

  if (!name && !teamId) {
    return NextResponse.json({ error: "name or id required" }, { status: 400 });
  }

  // Step 1: find team — try the full name, then progressively shorter fallbacks
  let teamRes: ApiTeam[] | null = null;

  if (teamId) {
    teamRes = unwrap(await apiFetch<ApiTeam>("/teams", { id: teamId }, 86400));
  } else {
    // Primary search with the full name
    teamRes = unwrap(await apiFetch<ApiTeam>("/teams", { search: name! }, 86400));

    // If nothing found, try the first word (handles "Wolverhampton Wanderers" → "Wolverhampton")
    if (!teamRes?.length) {
      const firstWord = name!.split(" ")[0];
      if (firstWord.length >= 3 && firstWord !== name) {
        teamRes = unwrap(await apiFetch<ApiTeam>("/teams", { search: firstWord }, 86400));
      }
    }

    // Last resort: try every word ≥4 chars until we get a hit
    if (!teamRes?.length) {
      for (const word of name!.split(" ").filter((w) => w.length >= 4)) {
        teamRes = unwrap(await apiFetch<ApiTeam>("/teams", { search: word }, 86400));
        if (teamRes?.length) break;
      }
    }
  }

  const best = pickBestTeam(teamRes ?? [], name ?? "");
  if (!best) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }
  const { team, venue } = best;

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
