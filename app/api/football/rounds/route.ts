// /api/football/rounds — distinct round names for a league+season.
//
// DB-first: derives rounds from the fixtures table (no separate round table needed).
// Falls back to the live API if the DB has no fixtures for this league+season.
//
// Usage: GET /api/football/rounds?league={id}&season={year}

import { NextRequest, NextResponse } from "next/server";
import { and, eq, desc } from "drizzle-orm";
import { db, fixtures } from "@/lib/db";
import { apiFetch, unwrap, currentSeason } from "@/lib/apifootball";
import { sql } from "drizzle-orm";

const SEASON = currentSeason();

export async function GET(req: NextRequest) {
  const league = req.nextUrl.searchParams.get("league");
  const season = Number(req.nextUrl.searchParams.get("season") ?? SEASON);

  if (!league) return NextResponse.json({ rounds: [], current: null });

  const lid = Number(league);

  // ── 1. Derive distinct rounds from DB ────────────────────────────────────────
  const rows = await db
    .selectDistinct({ round: fixtures.round })
    .from(fixtures)
    .where(and(eq(fixtures.leagueId, lid), eq(fixtures.season, season)));

  if (rows.length > 0) {
    const rounds = rows.map((r) => r.round).sort((a, b) => {
      // Sort by embedded number if present ("Regular Season - 38" > "Regular Season - 1")
      const na = parseInt(a.match(/\d+/)?.[0] ?? "0");
      const nb = parseInt(b.match(/\d+/)?.[0] ?? "0");
      if (na !== nb) return na - nb;
      return a.localeCompare(b);
    });

    // Current round: most recent completed fixture's round
    const currentRow = await db
      .select({ round: fixtures.round })
      .from(fixtures)
      .where(
        and(
          eq(fixtures.leagueId, lid),
          eq(fixtures.season, season),
          sql`${fixtures.status} IN ('FT','AET','PEN')`
        )
      )
      .orderBy(desc(fixtures.timestamp))
      .limit(1);

    const current = currentRow[0]?.round ?? rounds[rounds.length - 1] ?? null;
    return NextResponse.json({ rounds, current });
  }

  // ── 2. Fallback: live API ────────────────────────────────────────────────────
  const [allRes, currentRes] = await Promise.all([
    apiFetch<string>("/fixtures/rounds", { league, season }, 3600),
    apiFetch<string>("/fixtures/rounds", { league, season, current: "true" }, 300),
  ]);

  const rounds  = unwrap(allRes) ?? [];
  const current = (unwrap(currentRes) ?? [])[0] ?? rounds[rounds.length - 1] ?? null;

  return NextResponse.json({ rounds, current });
}
