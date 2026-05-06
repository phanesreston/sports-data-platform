// /api/football/player — player profile and season statistics.
//
// DB-only: reads from players, squads, teams, fixtures, leagues, and
// fixturePlayerStats tables. Statistics are aggregated from per-fixture rows.
//
// Fields not stored in DB (age, height, weight, injured) are returned as null.
// If no stats are cached for this player, statistics will be an empty array.
// Pre-populate with: SEED_STEP=player-stats npm run db:seed
//
// Usage:
//   GET /api/football/player?id=276           → most recent season with data
//   GET /api/football/player?id=276&season=2024 → specific season

import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db, players, squads, teams, fixtures, leagues, fixturePlayerStats } from "@/lib/db";
import { currentSeason } from "@/lib/apifootball";

export interface ApiPlayerFull {
  player: {
    id: number;
    name: string;
    firstname: string | undefined;
    lastname: string | undefined;
    age: number | null;
    nationality: string | null;
    height: string | null;
    weight: string | null;
    photo: string | null;
    injured: boolean | undefined;
  };
  statistics: {
    team:      { id: number; name: string; logo: string };
    league:    { id: number; name: string; logo: string; country: string; season: number };
    games:     { appearences: number | null; lineups: number | null; minutes: number | null; position: string; rating: string | null };
    goals:     { total: number | null; assists: number | null; conceded: number | null; saves: number | null };
    shots:     { total: number | null; on: number | null };
    passes:    { total: number | null; key: number | null; accuracy: string | null };
    tackles:   { total: number | null; blocks: number | null; interceptions: number | null };
    duels:     { total: number | null; won: number | null };
    dribbles:  { attempts: number | null; success: number | null };
    cards:     { yellow: number; red: number };
  }[];
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const pid          = Number(id);
  const seasonParam  = req.nextUrl.searchParams.get("season");
  const CURRENT      = currentSeason();

  // ── 1. Player profile ────────────────────────────────────────────────────────
  const playerRows = await db.select().from(players).where(eq(players.id, pid));
  if (!playerRows.length) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }
  const playerRow = playerRows[0];

  // ── 2. Current team from squads (most recent season) ─────────────────────────
  const squadRows = await db
    .select({ teamId: squads.teamId, position: squads.position, season: squads.season })
    .from(squads)
    .where(eq(squads.playerId, pid))
    .orderBy(desc(squads.season))
    .limit(1);
  const position = squadRows[0]?.position ?? "Midfielder";

  // ── 3. Aggregate stats from fixturePlayerStats ───────────────────────────────
  const statsRows = await db
    .select({
      season:      fixtures.season,
      leagueId:    fixtures.leagueId,
      leagueName:  leagues.name,
      leagueLogo:  leagues.logo,
      leagueCountry: leagues.country,
      teamId:      fixturePlayerStats.teamId,
      teamName:    teams.name,
      teamLogo:    teams.logo,
      minutes:     fixturePlayerStats.minutes,
      rating:      fixturePlayerStats.rating,
      goals:       fixturePlayerStats.goals,
      assists:     fixturePlayerStats.assists,
      shotsOn:     fixturePlayerStats.shotsOn,
      shotsTotal:  fixturePlayerStats.shotsTotal,
      keyPasses:   fixturePlayerStats.keyPasses,
      yellowCards: fixturePlayerStats.yellowCards,
      redCards:    fixturePlayerStats.redCards,
    })
    .from(fixturePlayerStats)
    .innerJoin(fixtures, eq(fixturePlayerStats.fixtureId, fixtures.id))
    .innerJoin(leagues, eq(fixtures.leagueId, leagues.id))
    .innerJoin(teams,   eq(fixturePlayerStats.teamId, teams.id))
    .where(eq(fixturePlayerStats.playerId, pid))
    .orderBy(desc(fixtures.season));

  // Group by season + league
  type Entry = {
    season: number; leagueId: number; leagueName: string; leagueLogo: string; leagueCountry: string;
    teamId: number; teamName: string; teamLogo: string;
    appearances: number; minutes: number; ratings: number[];
    goals: number; assists: number; shotsOn: number; shotsTotal: number;
    keyPasses: number; yellowCards: number; redCards: number;
  };
  const grouped = new Map<string, Entry>();

  for (const row of statsRows) {
    const key = `${row.season}:${row.leagueId}`;
    let e = grouped.get(key);
    if (!e) {
      e = {
        season: row.season, leagueId: row.leagueId, leagueName: row.leagueName,
        leagueLogo: row.leagueLogo, leagueCountry: row.leagueCountry ?? "",
        teamId: row.teamId, teamName: row.teamName, teamLogo: row.teamLogo,
        appearances: 0, minutes: 0, ratings: [],
        goals: 0, assists: 0, shotsOn: 0, shotsTotal: 0, keyPasses: 0, yellowCards: 0, redCards: 0,
      };
      grouped.set(key, e);
    }
    e.appearances++;
    e.minutes      += row.minutes      ?? 0;
    e.goals        += row.goals        ?? 0;
    e.assists      += row.assists      ?? 0;
    e.shotsOn      += row.shotsOn      ?? 0;
    e.shotsTotal   += row.shotsTotal   ?? 0;
    e.keyPasses    += row.keyPasses    ?? 0;
    e.yellowCards  += row.yellowCards  ?? 0;
    e.redCards     += row.redCards     ?? 0;
    if (row.rating != null) e.ratings.push(row.rating);
  }

  // Determine which season to return
  const allSeasons = [...new Set([...grouped.values()].map((e) => e.season))].sort((a, b) => b - a);
  let targetSeason: number;
  if (seasonParam) {
    targetSeason = Number(seasonParam);
  } else {
    // Pick most recent season with data, defaulting to current
    targetSeason = allSeasons[0] ?? CURRENT;
  }

  const statistics = [...grouped.values()]
    .filter((e) => e.season === targetSeason)
    .map((e) => ({
      team:   { id: e.teamId, name: e.teamName, logo: e.teamLogo },
      league: { id: e.leagueId, name: e.leagueName, logo: e.leagueLogo, country: e.leagueCountry, season: e.season },
      games: {
        appearences: e.appearances,
        lineups:     e.appearances,
        minutes:     e.minutes || null,
        position,
        rating: e.ratings.length
          ? (e.ratings.reduce((a, b) => a + b, 0) / e.ratings.length).toFixed(2)
          : null,
      },
      goals:    { total: e.goals || null,       assists: e.assists || null,   conceded: null, saves: null },
      shots:    { total: e.shotsTotal || null,   on: e.shotsOn || null },
      passes:   { total: null,                   key: e.keyPasses || null,    accuracy: null },
      tackles:  { total: null, blocks: null, interceptions: null },
      duels:    { total: null, won: null },
      dribbles: { attempts: null, success: null },
      cards:    { yellow: e.yellowCards, red: e.redCards },
    }));

  const playerData: ApiPlayerFull = {
    player: {
      id:          playerRow.id,
      name:        playerRow.name,
      firstname:   undefined,
      lastname:    undefined,
      age:         null,
      nationality: playerRow.nationality ?? null,
      height:      null,
      weight:      null,
      photo:       playerRow.photo ?? null,
      injured:     undefined,
    },
    statistics,
  };

  // If no stats found for target season but we have other seasons, return profile only
  return NextResponse.json({ player: playerData, season: targetSeason });
}
