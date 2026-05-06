// /api/football/player-h2h — a player's stats across all H2H fixtures
// between their team and a specific opponent.
//
// Usage: GET /api/football/player-h2h?player={id}&team1={playerTeamId}&team2={opponentTeamId}
//
// Data strategy:
//   - H2H fixtures come from the local DB (no API call needed)
//   - Per-fixture player stats are read from fixture_player_stats in the DB
//   - If a fixture's stats aren't in the DB yet, they're fetched from the API
//     and written back — so the DB fills up naturally from real usage

import { NextRequest, NextResponse } from "next/server";
import { and, or, eq, inArray, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db, fixtures, teams, leagues, fixturePlayerStats, players } from "@/lib/db";
import { apiFetch } from "@/lib/apifootball";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

const COMPLETED = ["FT", "AET", "PEN"];

// ── fetch stats from API and cache in DB ───────────────────────────────────────

async function fetchAndCacheStats(fixtureId: number): Promise<void> {
  const raw = await apiFetch<AnyObj>("/fixtures/players", { fixture: fixtureId }, 86400);
  if (!raw?.response) return;

  const now = Date.now();

  for (const teamData of raw.response as AnyObj[]) {
    for (const entry of (teamData.players as AnyObj[] | undefined) ?? []) {
      const s = entry.statistics?.[0] ?? {};
      const minutes = s.games?.minutes ?? 0;
      if (!minutes) continue;

      const playerId: number = entry.player?.id;
      const teamId:   number = teamData.team?.id;
      if (!playerId || !teamId) continue;

      // Upsert the player row so the FK constraint is satisfied
      await db.insert(players).values({
        id:          playerId,
        name:        entry.player?.name ?? "",
        nationality: null,
        photo:       entry.player?.photo ?? null,
        updatedAt:   now,
      }).onConflictDoUpdate({
        target: players.id,
        set:    { name: entry.player?.name ?? "", updatedAt: now },
      });

      await db.insert(fixturePlayerStats).values({
        fixtureId,
        playerId,
        teamId,
        minutes,
        rating:      s.games?.rating     ? parseFloat(s.games.rating) : null,
        goals:       s.goals?.total      ?? 0,
        assists:     s.goals?.assists    ?? 0,
        shotsOn:     s.shots?.on         ?? 0,
        shotsTotal:  s.shots?.total      ?? 0,
        keyPasses:   s.passes?.key       ?? 0,
        yellowCards: s.cards?.yellow     ?? 0,
        redCards:    s.cards?.red        ?? 0,
      }).onConflictDoNothing();
    }
  }
}

// ── main handler ───────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get("player");
  const team1Id  = req.nextUrl.searchParams.get("team1");
  const team2Id  = req.nextUrl.searchParams.get("team2");

  if (!playerId || !team1Id || !team2Id) {
    return NextResponse.json({ error: "player, team1 and team2 required" }, { status: 400 });
  }

  const pid = Number(playerId);
  const t1  = Number(team1Id);
  const t2  = Number(team2Id);

  // ── 1. Get all completed H2H fixtures from DB ────────────────────────────────
  const ht = alias(teams, "ht");
  const at = alias(teams, "at");

  const h2hFixtures = await db
    .select({
      id:         fixtures.id,
      date:       fixtures.date,
      timestamp:  fixtures.timestamp,
      homeTeamId: fixtures.homeTeamId,
      homeTeam:   ht.name,
      homeLogo:   ht.logo,
      awayTeamId: fixtures.awayTeamId,
      awayTeam:   at.name,
      awayLogo:   at.logo,
      homeGoals:  fixtures.homeGoals,
      awayGoals:  fixtures.awayGoals,
      league:     leagues.name,
      leagueLogo: leagues.logo,
    })
    .from(fixtures)
    .innerJoin(ht,      eq(fixtures.homeTeamId, ht.id))
    .innerJoin(at,      eq(fixtures.awayTeamId, at.id))
    .innerJoin(leagues, eq(fixtures.leagueId,   leagues.id))
    .where(
      and(
        inArray(fixtures.status, COMPLETED),
        or(
          and(eq(fixtures.homeTeamId, t1), eq(fixtures.awayTeamId, t2)),
          and(eq(fixtures.homeTeamId, t2), eq(fixtures.awayTeamId, t1))
        )
      )
    )
    .orderBy(desc(fixtures.timestamp));

  if (!h2hFixtures.length) {
    return NextResponse.json({ appearances: [], summary: null });
  }

  // ── 2. Which fixtures already have stats cached for this player? ─────────────
  const fixtureIds = h2hFixtures.map((f) => f.id);

  const cached = await db
    .select({ fixtureId: fixturePlayerStats.fixtureId })
    .from(fixturePlayerStats)
    .where(
      and(
        inArray(fixturePlayerStats.fixtureId, fixtureIds),
        eq(fixturePlayerStats.playerId, pid)
      )
    );

  const cachedIds = new Set(cached.map((r) => r.fixtureId));
  const missing   = h2hFixtures.filter((f) => !cachedIds.has(f.id));

  // ── 3. Fetch & cache stats for any fixture not yet in DB ─────────────────────
  const BATCH = 5;
  for (let i = 0; i < missing.length; i += BATCH) {
    if (i > 0) await new Promise((r) => setTimeout(r, 200));
    await Promise.all(missing.slice(i, i + BATCH).map((f) => fetchAndCacheStats(f.id)));
  }

  // ── 4. Read all player stats for this player across the H2H fixtures ─────────
  const statsRows = await db
    .select()
    .from(fixturePlayerStats)
    .where(
      and(
        inArray(fixturePlayerStats.fixtureId, fixtureIds),
        eq(fixturePlayerStats.playerId, pid)
      )
    );

  const statsByFixture = new Map(statsRows.map((s) => [s.fixtureId, s]));

  // ── 5. Build appearances ─────────────────────────────────────────────────────
  const appearances: AnyObj[] = [];

  for (const f of h2hFixtures) {
    const s = statsByFixture.get(f.id);
    if (!s || !s.minutes) continue;

    appearances.push({
      fixtureId:  f.id,
      date:       f.date,
      homeTeamId: f.homeTeamId,
      homeTeam:   f.homeTeam,
      homeLogo:   f.homeLogo,
      awayTeam:   f.awayTeam,
      awayLogo:   f.awayLogo,
      awayTeamId: f.awayTeamId,
      homeScore:  f.homeGoals,
      awayScore:  f.awayGoals,
      isHome:     f.homeTeamId === t1,
      league:     f.league,
      leagueLogo: f.leagueLogo,
      minutes:    s.minutes,
      rating:     s.rating,
      goals:      s.goals,
      assists:    s.assists,
      shotsOn:    s.shotsOn,
      shotsTotal: s.shotsTotal,
      keyPasses:  s.keyPasses,
      yellowCard: s.yellowCards > 0,
      redCard:    s.redCards > 0,
    });
  }

  if (!appearances.length) {
    return NextResponse.json({ appearances: [], summary: null });
  }

  // ── 6. Aggregate ─────────────────────────────────────────────────────────────
  const n              = appearances.length;
  const totalGoals     = appearances.reduce((s, a) => s + a.goals,     0);
  const totalAssists   = appearances.reduce((s, a) => s + a.assists,   0);
  const totalMinutes   = appearances.reduce((s, a) => s + a.minutes,   0);
  const totalShotsOn   = appearances.reduce((s, a) => s + a.shotsOn,   0);
  const totalKeyPasses = appearances.reduce((s, a) => s + a.keyPasses, 0);
  const ratings        = appearances.map((a) => a.rating).filter((r): r is number => r !== null);
  const avgRating      = ratings.length
    ? +(ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(2)
    : null;

  return NextResponse.json({
    appearances,
    summary: {
      appearances:       n,
      goals:             totalGoals,
      assists:           totalAssists,
      minutesPlayed:     totalMinutes,
      avgMinutesPerGame: Math.round(totalMinutes / n),
      goalsPerGame:      +(totalGoals   / n).toFixed(2),
      assistsPerGame:    +(totalAssists / n).toFixed(2),
      shotsOnTarget:     totalShotsOn,
      keyPasses:         totalKeyPasses,
      avgRating,
    },
  });
}
