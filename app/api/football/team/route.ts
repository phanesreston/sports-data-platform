// /api/football/team — team profile, season stats, and squad.
//
// DB-only: reads from teams, leagueTeams, leagues, fixtures, squads, and players.
// Season stats (W/D/L/form/goals/clean sheets) are computed from the fixtures table.
// Venue and founded year are not stored in DB and are omitted from the response.
//
// Usage:
//   GET /api/football/team?id={teamId}
//   GET /api/football/team?name={teamName}

import { NextRequest, NextResponse } from "next/server";
import { and, or, eq, inArray, asc, desc, like } from "drizzle-orm";
import { db, fixtures, teams, leagues, leagueTeams, squads, players } from "@/lib/db";
import { currentSeason } from "@/lib/apifootball";

const SEASON    = currentSeason();
const COMPLETED = ["FT", "AET", "PEN"];
const LEAGUE_PRIORITY = [39, 140, 135, 78, 61, 2, 3, 40, 141, 136, 79, 62];

function resultFor(
  row: { homeTeamId: number; homeGoals: number | null; awayGoals: number | null },
  teamId: number
): "W" | "D" | "L" | null {
  const hg = row.homeGoals, ag = row.awayGoals;
  if (hg === null || ag === null) return null;
  const isHome = row.homeTeamId === teamId;
  const gf = isHome ? hg : ag, ga = isHome ? ag : hg;
  return gf > ga ? "W" : gf === ga ? "D" : "L";
}

export async function GET(req: NextRequest) {
  const nameParam = req.nextUrl.searchParams.get("name");
  const idParam   = req.nextUrl.searchParams.get("id");

  if (!nameParam && !idParam) {
    return NextResponse.json({ error: "name or id required" }, { status: 400 });
  }

  // ── 1. Find team ─────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let teamRows: any[];
  if (idParam) {
    teamRows = await db.select().from(teams).where(eq(teams.id, Number(idParam)));
  } else {
    teamRows = await db.select().from(teams).where(eq(teams.name, nameParam!));
    if (!teamRows.length) {
      teamRows = await db.select().from(teams).where(like(teams.name, `%${nameParam}%`));
    }
  }

  if (!teamRows.length) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const team   = teamRows[0] as { id: number; name: string; country: string; logo: string };
  const teamId = team.id;

  // ── 2. Find primary league (current season, highest priority) ────────────────
  const leagueRows = await db
    .select({ leagueId: leagueTeams.leagueId, leagueName: leagues.name, leagueLogo: leagues.logo })
    .from(leagueTeams)
    .innerJoin(leagues, eq(leagueTeams.leagueId, leagues.id))
    .where(and(eq(leagueTeams.teamId, teamId), eq(leagueTeams.season, SEASON)));

  leagueRows.sort((a, b) => {
    const ai = LEAGUE_PRIORITY.indexOf(a.leagueId);
    const bi = LEAGUE_PRIORITY.indexOf(b.leagueId);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const primaryLeague = leagueRows[0] ?? null;
  const leagueId      = primaryLeague?.leagueId ?? null;

  // ── 3. Compute season stats from fixtures ────────────────────────────────────
  let stats = null;
  if (leagueId) {
    const rows = await db
      .select({ homeTeamId: fixtures.homeTeamId, homeGoals: fixtures.homeGoals, awayGoals: fixtures.awayGoals, timestamp: fixtures.timestamp })
      .from(fixtures)
      .where(and(
        or(eq(fixtures.homeTeamId, teamId), eq(fixtures.awayTeamId, teamId)),
        eq(fixtures.season, SEASON),
        eq(fixtures.leagueId, leagueId),
        inArray(fixtures.status, COMPLETED)
      ))
      .orderBy(desc(fixtures.timestamp));

    if (rows.length > 0) {
      let wins = 0, draws = 0, losses = 0, gf = 0, ga = 0, cleanSheets = 0;
      for (const f of rows) {
        const isHome   = f.homeTeamId === teamId;
        const scored   = (isHome ? f.homeGoals : f.awayGoals) ?? 0;
        const conceded = (isHome ? f.awayGoals : f.homeGoals) ?? 0;
        gf += scored; ga += conceded;
        const r = resultFor(f, teamId);
        if (r === "W") wins++;
        else if (r === "D") draws++;
        else if (r === "L") losses++;
        if (conceded === 0) cleanSheets++;
      }
      const played = rows.length;
      const form   = rows.slice(0, 5).reverse().map((f) => resultFor(f, teamId) ?? "").filter(Boolean).join("");

      stats = {
        form,
        league: { id: leagueId, name: primaryLeague.leagueName, logo: primaryLeague.leagueLogo },
        fixtures: {
          played: { home: 0, away: 0, total: played },
          wins:   { home: 0, away: 0, total: wins   },
          draws:  { home: 0, away: 0, total: draws  },
          loses:  { home: 0, away: 0, total: losses },
        },
        goals: {
          for:     { average: { home: "0", away: "0", total: played ? (gf / played).toFixed(2) : "0" }, total: { home: 0, away: 0, total: gf } },
          against: { average: { home: "0", away: "0", total: played ? (ga / played).toFixed(2) : "0" }, total: { home: 0, away: 0, total: ga } },
        },
        clean_sheet: { home: 0, away: 0, total: cleanSheets },
      };
    }
  }

  // ── 4. Get squad ─────────────────────────────────────────────────────────────
  const squadRows = await db
    .select({ id: players.id, name: players.name, photo: players.photo, position: squads.position, number: squads.number })
    .from(squads)
    .innerJoin(players, eq(squads.playerId, players.id))
    .where(and(eq(squads.teamId, teamId), eq(squads.season, SEASON)))
    .orderBy(asc(squads.number));

  const grouped: Record<string, { id: number; name: string; number: number | null; position: string; photo: string; age: null }[]> = {
    Goalkeepers: [], Defenders: [], Midfielders: [], Forwards: [],
  };

  for (const p of squadRows) {
    const entry = { id: p.id, name: p.name, number: p.number ?? null, position: p.position ?? "Unknown", photo: p.photo ?? "", age: null };
    const pos = p.position ?? "";
    if      (pos === "Goalkeeper")                    grouped.Goalkeepers.push(entry);
    else if (pos === "Defender")                      grouped.Defenders.push(entry);
    else if (pos === "Midfielder")                    grouped.Midfielders.push(entry);
    else                                              grouped.Forwards.push(entry);
  }

  return NextResponse.json({
    team:  { id: team.id, name: team.name, country: team.country, logo: team.logo, founded: null, code: null },
    venue: null,
    stats,
    league: primaryLeague ? { id: primaryLeague.leagueId, name: primaryLeague.leagueName, logo: primaryLeague.leagueLogo } : null,
    squad:  grouped,
  });
}
