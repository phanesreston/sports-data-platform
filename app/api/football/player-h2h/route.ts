// /api/football/player-h2h — a player's stats across all H2H fixtures
// between their team and a specific opponent.
//
// Usage: GET /api/football/player-h2h?player={id}&team1={playerTeamId}&team2={opponentTeamId}
//
// Steps:
//   1. Fetch the last 20 H2H fixtures between team1 and team2.
//   2. For each completed fixture, fetch per-player stats via /fixtures/players.
//      These are cached 24 h — historical fixture stats are immutable.
//   3. Locate the requested player in the response and extract their stats.
//   4. Aggregate across all appearances and return summary + per-game breakdown.

import { NextRequest, NextResponse } from "next/server";
import { apiFetch, unwrap } from "@/lib/apifootball";
import type { ApiFixture } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

interface PlayerGameStats {
  minutes:    number;
  rating:     number | null;
  goals:      number;
  assists:    number;
  shotsOn:    number;
  shotsTotal: number;
  keyPasses:  number;
  yellowCard: boolean;
  redCard:    boolean;
}

async function fetchPlayerStatsForFixture(
  fixtureId: number,
  playerId: number
): Promise<PlayerGameStats | null> {
  const raw = await apiFetch<AnyObj>("/fixtures/players", { fixture: fixtureId }, 86400);
  if (!raw?.response) return null;

  for (const teamData of raw.response as AnyObj[]) {
    const entry = (teamData.players as AnyObj[] | undefined)?.find(
      (p) => p.player?.id === playerId
    );
    if (!entry) continue;
    const s = entry.statistics?.[0] ?? {};
    const minutes = s.games?.minutes ?? 0;
    if (!minutes) return null; // didn't feature
    return {
      minutes,
      rating:     s.games?.rating     ? parseFloat(s.games.rating) : null,
      goals:      s.goals?.total      ?? 0,
      assists:    s.goals?.assists    ?? 0,
      shotsOn:    s.shots?.on         ?? 0,
      shotsTotal: s.shots?.total      ?? 0,
      keyPasses:  s.passes?.key       ?? 0,
      yellowCard: (s.cards?.yellow    ?? 0) > 0,
      redCard:    (s.cards?.red       ?? 0) > 0,
    };
  }
  return null;
}

const BATCH = 5;
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

export async function GET(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get("player");
  const team1Id  = req.nextUrl.searchParams.get("team1");
  const team2Id  = req.nextUrl.searchParams.get("team2");

  if (!playerId || !team1Id || !team2Id) {
    return NextResponse.json({ error: "player, team1 and team2 required" }, { status: 400 });
  }

  const raw = await apiFetch<ApiFixture>(
    "/fixtures/headtohead",
    { h2h: `${team1Id}-${team2Id}`, last: 20 },
    3600
  );

  const fixtures = unwrap(raw);
  if (!fixtures) return NextResponse.json({ appearances: [], summary: null });

  const completed = fixtures
    .filter((f) => ["FT", "AET", "PEN"].includes(f.fixture.status.short))
    .sort((a, b) => b.fixture.timestamp - a.fixture.timestamp);

  const appearances: AnyObj[] = [];
  const pid = Number(playerId);
  const t1  = Number(team1Id);

  for (let i = 0; i < completed.length; i += BATCH) {
    if (i > 0) await sleep(200);
    const batch = completed.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async (f) => {
        const stats = await fetchPlayerStatsForFixture(f.fixture.id, pid);
        if (!stats) return null;
        return {
          fixtureId:  f.fixture.id,
          date:       f.fixture.date,
          homeTeamId: f.teams.home.id,
          homeTeam:   f.teams.home.name,
          homeLogo:   f.teams.home.logo,
          awayTeam:   f.teams.away.name,
          awayLogo:   f.teams.away.logo,
          awayTeamId: f.teams.away.id,
          homeScore:  f.goals.home,
          awayScore:  f.goals.away,
          isHome:     f.teams.home.id === t1,
          league:     f.league.name,
          leagueLogo: f.league.logo,
          ...stats,
        };
      })
    );
    appearances.push(...results.filter(Boolean));
  }

  if (appearances.length === 0) {
    return NextResponse.json({ appearances: [], summary: null });
  }

  const n             = appearances.length;
  const totalGoals    = appearances.reduce((s, a) => s + (a.goals    ?? 0), 0);
  const totalAssists  = appearances.reduce((s, a) => s + (a.assists  ?? 0), 0);
  const totalMinutes  = appearances.reduce((s, a) => s + (a.minutes  ?? 0), 0);
  const totalShotsOn  = appearances.reduce((s, a) => s + (a.shotsOn  ?? 0), 0);
  const totalKeyPasses= appearances.reduce((s, a) => s + (a.keyPasses?? 0), 0);
  const ratings       = appearances.map((a) => a.rating).filter((r): r is number => r !== null);
  const avgRating     = ratings.length > 0
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
      goalsPerGame:      +(totalGoals / n).toFixed(2),
      assistsPerGame:    +(totalAssists / n).toFixed(2),
      shotsOnTarget:     totalShotsOn,
      keyPasses:         totalKeyPasses,
      avgRating,
    },
  });
}
