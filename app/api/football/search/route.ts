// /api/football/search — unified search powered by the local database.
// Falls back to live API if the database is empty (first run before seed).
//
// DB queries are instant and have no API quota cost.
// Results: teams (+ which league), players (+ current team), leagues.

import { NextRequest, NextResponse } from "next/server";
import { like, sql } from "drizzle-orm";
import { db, teams, players, squads, leagues, leagueTeams } from "@/lib/db";
import { apiFetch, unwrap, currentSeason } from "@/lib/apifootball";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ teams: [], players: [], leagues: [] });

  const pattern = `%${q}%`;

  // ── teams from DB ────────────────────────────────────────────────────────────
  const dbTeams = await db
    .select({
      id:       teams.id,
      name:     teams.name,
      country:  teams.country,
      logo:     teams.logo,
      leagueId: leagueTeams.leagueId,
    })
    .from(teams)
    .leftJoin(leagueTeams, sql`${leagueTeams.teamId} = ${teams.id}`)
    .where(like(teams.name, pattern))
    .limit(5);

  // ── players from DB ──────────────────────────────────────────────────────────
  const season  = currentSeason();
  const dbPlayers = await db
    .select({
      id:       players.id,
      name:     players.name,
      photo:    players.photo,
      nationality: players.nationality,
      position: squads.position,
      teamId:   squads.teamId,
      teamName: teams.name,
      teamLogo: teams.logo,
    })
    .from(players)
    .leftJoin(squads,  sql`${squads.playerId} = ${players.id} AND ${squads.season} = ${season}`)
    .leftJoin(teams,   sql`${teams.id} = ${squads.teamId}`)
    .where(like(players.name, pattern))
    .limit(5);

  // ── leagues from DB ──────────────────────────────────────────────────────────
  const dbLeagues = await db
    .select()
    .from(leagues)
    .where(like(leagues.name, pattern))
    .limit(4);

  // If the database has no data yet (pre-seed), fall back to live API so the
  // app still works on first run.
  const hasData = dbTeams.length > 0 || dbPlayers.length > 0 || dbLeagues.length > 0;

  if (!hasData) {
    return fallbackToApi(q);
  }

  return NextResponse.json({
    teams: dbTeams.map((t) => ({
      id:      t.id,
      name:    t.name,
      country: t.country,
      logo:    t.logo,
      city:    "",
    })),
    players: dbPlayers.map((p) => ({
      id:          p.id,
      name:        p.name,
      photo:       p.photo ?? "",
      nationality: p.nationality ?? "",
      position:    p.position ?? "",
      team:        p.teamId ? { id: p.teamId, name: p.teamName ?? "", logo: p.teamLogo ?? "" } : null,
    })),
    leagues: dbLeagues.map((l) => ({
      id:      l.id,
      name:    l.name,
      logo:    l.logo,
      country: l.country,
      flag:    "",
    })),
  });
}

// ── live API fallback (used before db:seed has been run) ─────────────────────

async function fallbackToApi(q: string) {
  interface ApiTeamResult {
    team:  { id: number; name: string; country: string; logo: string };
    venue: { city: string };
  }
  interface ApiLeagueResult {
    league:  { id: number; name: string; type: string; logo: string };
    country: { name: string; flag: string | null };
  }

  const [teamsRes, leaguesRes] = await Promise.all([
    apiFetch<ApiTeamResult>("/teams", { search: q }, 3600),
    apiFetch<ApiLeagueResult>("/leagues", { search: q }, 3600),
  ]);

  const teams = (unwrap(teamsRes) ?? []).slice(0, 5).map((t) => ({
    id: t.team.id, name: t.team.name, country: t.team.country, logo: t.team.logo, city: t.venue?.city ?? "",
  }));
  const leagues = (unwrap(leaguesRes) ?? [])
    .filter((l) => l.league.type === "League").slice(0, 4)
    .map((l) => ({ id: l.league.id, name: l.league.name, logo: l.league.logo, country: l.country.name, flag: l.country.flag ?? "" }));

  return NextResponse.json({ teams, players: [], leagues });
}
