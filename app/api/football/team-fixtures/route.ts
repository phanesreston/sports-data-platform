// /api/football/team-fixtures — upcoming and recent fixtures for a team.
//
// DB-first: reads from the local fixtures table.
// Falls back to the live API if the DB is empty (pre-seed environment).
//
// Usage: GET /api/football/team-fixtures?team={id}&season={year}

import { NextRequest, NextResponse } from "next/server";
import { and, or, eq, inArray, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db, fixtures, teams, leagues } from "@/lib/db";
import { apiFetch, unwrap, currentSeason } from "@/lib/apifootball";
import type { ApiFixture } from "@/lib/types";

const COMPLETED = ["FT", "AET", "PEN"];
const UPCOMING  = ["NS", "TBD"];

function winnerFlag(homeGoals: number | null, awayGoals: number | null) {
  if (homeGoals === null || awayGoals === null) return { home: null, away: null };
  if (homeGoals > awayGoals) return { home: true,  away: false };
  if (awayGoals > homeGoals) return { home: false, away: true  };
  return { home: false, away: false };
}

function toFixtureShape(r: {
  id: number; date: string; status: string; round: string;
  homeTeamId: number; homeName: string; homeLogo: string;
  awayTeamId: number; awayName: string; awayLogo: string;
  homeGoals: number | null; awayGoals: number | null;
  leagueId: number; leagueName: string; leagueLogo: string;
}) {
  const w = winnerFlag(r.homeGoals, r.awayGoals);
  return {
    fixture: { id: r.id, date: r.date, status: { short: r.status } },
    league:  { id: r.leagueId, name: r.leagueName, logo: r.leagueLogo, round: r.round },
    teams: {
      home: { id: r.homeTeamId, name: r.homeName, logo: r.homeLogo, winner: w.home },
      away: { id: r.awayTeamId, name: r.awayName, logo: r.awayLogo, winner: w.away },
    },
    goals: { home: r.homeGoals, away: r.awayGoals },
  };
}

export async function GET(req: NextRequest) {
  const team   = req.nextUrl.searchParams.get("team");
  const season = Number(req.nextUrl.searchParams.get("season") ?? currentSeason());

  if (!team) return NextResponse.json({ upcoming: [], recent: [] });

  const tid = Number(team);

  // ── 1. Query DB ──────────────────────────────────────────────────────────────
  const ht = alias(teams, "ht");
  const at = alias(teams, "at");

  const baseSelect = {
    id:         fixtures.id,
    date:       fixtures.date,
    timestamp:  fixtures.timestamp,
    status:     fixtures.status,
    round:      fixtures.round,
    homeTeamId: fixtures.homeTeamId,
    homeName:   ht.name,
    homeLogo:   ht.logo,
    awayTeamId: fixtures.awayTeamId,
    awayName:   at.name,
    awayLogo:   at.logo,
    homeGoals:  fixtures.homeGoals,
    awayGoals:  fixtures.awayGoals,
    leagueId:   fixtures.leagueId,
    leagueName: leagues.name,
    leagueLogo: leagues.logo,
  };

  const teamFilter = and(
    eq(fixtures.season, season),
    or(eq(fixtures.homeTeamId, tid), eq(fixtures.awayTeamId, tid))
  );

  const [recentRows, upcomingRows] = await Promise.all([
    db.select(baseSelect)
      .from(fixtures)
      .innerJoin(ht,      eq(fixtures.homeTeamId, ht.id))
      .innerJoin(at,      eq(fixtures.awayTeamId, at.id))
      .innerJoin(leagues, eq(fixtures.leagueId,   leagues.id))
      .where(and(teamFilter, inArray(fixtures.status, COMPLETED)))
      .orderBy(desc(fixtures.timestamp))
      .limit(15),
    db.select(baseSelect)
      .from(fixtures)
      .innerJoin(ht,      eq(fixtures.homeTeamId, ht.id))
      .innerJoin(at,      eq(fixtures.awayTeamId, at.id))
      .innerJoin(leagues, eq(fixtures.leagueId,   leagues.id))
      .where(and(teamFilter, inArray(fixtures.status, UPCOMING)))
      .orderBy(fixtures.timestamp)
      .limit(10),
  ]);

  if (recentRows.length > 0 || upcomingRows.length > 0) {
    return NextResponse.json({
      upcoming: upcomingRows.map(toFixtureShape),
      recent:   recentRows.map(toFixtureShape),
    });
  }

  // ── 2. Fallback: live API ────────────────────────────────────────────────────
  const [upcomingRes, recentRes] = await Promise.all([
    apiFetch<ApiFixture>("/fixtures", { team, season, next: 10 }, 300),
    apiFetch<ApiFixture>("/fixtures", { team, season, last: 15 }, 300),
  ]);

  return NextResponse.json({
    upcoming: (unwrap(upcomingRes) ?? []).filter(
      (f) => f.fixture.status.short === "NS" || f.fixture.status.short === "TBD"
    ),
    recent: (unwrap(recentRes) ?? []).filter(
      (f) => COMPLETED.includes(f.fixture.status.short)
    ),
  });
}
