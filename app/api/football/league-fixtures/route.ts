// /api/football/league-fixtures — fixtures for a league, optionally filtered by round.
//
// DB-first: reads from the local fixtures table.
// Falls back to the live API if the DB is empty (pre-seed environment).
//
// Usage:
//   GET /api/football/league-fixtures?league={id}&season={year}
//     → { upcoming: Fixture[], recent: Fixture[] }
//   GET /api/football/league-fixtures?league={id}&season={year}&round={round}
//     → { all: Fixture[], upcoming: Fixture[], recent: Fixture[], live: Fixture[] }

import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db, fixtures, teams, leagues } from "@/lib/db";
import { apiFetch, unwrap, currentSeason } from "@/lib/apifootball";
import type { ApiFixture } from "@/lib/types";

const SEASON   = currentSeason();
const COMPLETED = ["FT", "AET", "PEN"];
const UPCOMING  = ["NS", "TBD"];
const LIVE_EXCL = [...COMPLETED, ...UPCOMING, "PST", "CANC", "SUSP"];

function winnerFlag(homeGoals: number | null, awayGoals: number | null) {
  if (homeGoals === null || awayGoals === null) return { home: null, away: null };
  if (homeGoals > awayGoals) return { home: true,  away: false };
  if (awayGoals > homeGoals) return { home: false, away: true  };
  return { home: false, away: false };
}

function toShape(r: {
  id: number; date: string; status: string; round: string;
  homeTeamId: number; homeName: string; homeLogo: string;
  awayTeamId: number; awayName: string; awayLogo: string;
  homeGoals: number | null; awayGoals: number | null;
}) {
  const w = winnerFlag(r.homeGoals, r.awayGoals);
  return {
    fixture: { id: r.id, date: r.date, status: { short: r.status } },
    league:  { round: r.round },
    teams: {
      home: { id: r.homeTeamId, name: r.homeName, logo: r.homeLogo, winner: w.home },
      away: { id: r.awayTeamId, name: r.awayName, logo: r.awayLogo, winner: w.away },
    },
    goals: { home: r.homeGoals, away: r.awayGoals },
  };
}

export async function GET(req: NextRequest) {
  const league = req.nextUrl.searchParams.get("league");
  const season = Number(req.nextUrl.searchParams.get("season") ?? SEASON);
  const round  = req.nextUrl.searchParams.get("round");

  if (!league) return NextResponse.json({ error: "league required" }, { status: 400 });

  const lid = Number(league);

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
  };

  const baseWhere = and(
    eq(fixtures.leagueId, lid),
    eq(fixtures.season, season),
  );

  // ── Round-specific query ─────────────────────────────────────────────────────
  if (round) {
    const rows = await db
      .select(baseSelect)
      .from(fixtures)
      .innerJoin(ht, eq(fixtures.homeTeamId, ht.id))
      .innerJoin(at, eq(fixtures.awayTeamId, at.id))
      .where(and(baseWhere, eq(fixtures.round, round)))
      .orderBy(fixtures.timestamp);

    if (rows.length > 0) {
      const all      = rows.map(toShape).sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());
      const upcoming = all.filter((f) => UPCOMING.includes(f.fixture.status.short));
      const recent   = all.filter((f) => COMPLETED.includes(f.fixture.status.short));
      const live     = all.filter((f) => !LIVE_EXCL.includes(f.fixture.status.short));
      return NextResponse.json({ all, upcoming, recent, live });
    }

    // Fallback to API for this round
    const res = await apiFetch<ApiFixture>("/fixtures", { league, season, round }, 300);
    const all = (unwrap(res) ?? []).sort(
      (a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
    );
    return NextResponse.json({
      all,
      upcoming: all.filter((f) => UPCOMING.includes(f.fixture.status.short)),
      recent:   all.filter((f) => COMPLETED.includes(f.fixture.status.short)),
      live:     all.filter((f) => !LIVE_EXCL.includes(f.fixture.status.short)),
    });
  }

  // ── No round: return upcoming + recent ─────────────────────────────────────
  const [recentRows, upcomingRows] = await Promise.all([
    db.select(baseSelect)
      .from(fixtures)
      .innerJoin(ht, eq(fixtures.homeTeamId, ht.id))
      .innerJoin(at, eq(fixtures.awayTeamId, at.id))
      .where(and(baseWhere, inArray(fixtures.status, COMPLETED)))
      .orderBy(fixtures.timestamp)
      .limit(10),
    db.select(baseSelect)
      .from(fixtures)
      .innerJoin(ht, eq(fixtures.homeTeamId, ht.id))
      .innerJoin(at, eq(fixtures.awayTeamId, at.id))
      .where(and(baseWhere, inArray(fixtures.status, UPCOMING)))
      .orderBy(fixtures.timestamp)
      .limit(20),
  ]);

  if (recentRows.length > 0 || upcomingRows.length > 0) {
    return NextResponse.json({
      upcoming: upcomingRows.map(toShape),
      recent:   recentRows.map(toShape),
    });
  }

  // Fallback to API
  const [upcomingRes, recentRes] = await Promise.all([
    apiFetch<ApiFixture>("/fixtures", { league, season, next: 20 }, 300),
    apiFetch<ApiFixture>("/fixtures", { league, season, last: 10 }, 300),
  ]);

  return NextResponse.json({
    upcoming: (unwrap(upcomingRes) ?? []).filter((f) => UPCOMING.includes(f.fixture.status.short)),
    recent:   (unwrap(recentRes)   ?? []).filter((f) => COMPLETED.includes(f.fixture.status.short)),
  });
}
