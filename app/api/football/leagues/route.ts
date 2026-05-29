// /api/football/leagues — league metadata (name, country, logo).
//
// DB-first: reads from the local leagues table (seeded by scripts/seed.ts).
// Falls back to the live API if the DB is empty (pre-seed environment).
//
// Usage:
//   GET /api/football/leagues          → { leagues: LeagueMeta[] }  (top domestic leagues)
//   GET /api/football/leagues?id={id}  → { league: LeagueMeta }

import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db, leagues } from "@/lib/db";
import type { League } from "@/lib/db";
import { apiFetch, unwrap, currentSeason } from "@/lib/apifootball";

const SEASON = currentSeason();

// Flags aren't stored in the DB — overlay them by ID.
const LEAGUE_META: Record<number, { name: string; country: string; flag: string }> = {
  1:   { name: "FIFA World Cup",   country: "World",   flag: "🌍" },
  39:  { name: "Premier League",  country: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  40:  { name: "Championship",    country: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  140: { name: "La Liga",         country: "Spain",   flag: "🇪🇸" },
  141: { name: "Segunda",         country: "Spain",   flag: "🇪🇸" },
  135: { name: "Serie A",         country: "Italy",   flag: "🇮🇹" },
  136: { name: "Serie B",         country: "Italy",   flag: "🇮🇹" },
  78:  { name: "Bundesliga",      country: "Germany", flag: "🇩🇪" },
  79:  { name: "2. Bundesliga",   country: "Germany", flag: "🇩🇪" },
  61:  { name: "Ligue 1",         country: "France",  flag: "🇫🇷" },
  62:  { name: "Ligue 2",         country: "France",  flag: "🇫🇷" },
  2:   { name: "Champions League", country: "Europe", flag: "🏆" },
  3:   { name: "Europa League",   country: "Europe",  flag: "🇪🇺" },
};

export const TOP_LEAGUES = [
  { id: 1,   name: "FIFA World Cup",   country: "World",    flag: "🌍" },
  { id: 39,  name: "Premier League",   country: "England",  flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: 140, name: "La Liga",           country: "Spain",    flag: "🇪🇸" },
  { id: 135, name: "Serie A",           country: "Italy",    flag: "🇮🇹" },
  { id: 78,  name: "Bundesliga",        country: "Germany",  flag: "🇩🇪" },
  { id: 61,  name: "Ligue 1",           country: "France",   flag: "🇫🇷" },
  { id: 2,   name: "Champions League",  country: "Europe",   flag: "🏆" },
  { id: 3,   name: "Europa League",     country: "Europe",   flag: "🇪🇺" },
];

const TOP_IDS = TOP_LEAGUES.map((l) => l.id);

interface ApiLeagueInfo {
  league: { id: number; name: string; logo: string };
  country: { name: string; flag: string };
  seasons: { year: number; current: boolean }[];
}

function overlay(row: { id: number; name: string; country: string; logo: string }) {
  const meta = LEAGUE_META[row.id];
  return {
    id:      row.id,
    name:    meta?.name    ?? row.name,
    country: meta?.country ?? row.country,
    flag:    meta?.flag    ?? "",
    logo:    row.logo,
    season:  SEASON,
  };
}

export async function GET(req: NextRequest) {
  const idParam = req.nextUrl.searchParams.get("id");

  // ── Single league lookup ─────────────────────────────────────────────────────
  if (idParam) {
    const lid = Number(idParam);

    const rows = await db.select().from(leagues).where(eq(leagues.id, lid)) as League[];
    if (rows.length > 0) {
      return NextResponse.json({ league: overlay(rows[0]) });
    }

    // Fallback to API
    const res = unwrap(await apiFetch<ApiLeagueInfo>("/leagues", { id: lid, season: SEASON }, 86400));
    const info = res?.[0];
    const meta = LEAGUE_META[lid];
    return NextResponse.json({
      league: {
        id:      lid,
        name:    meta?.name    ?? info?.league.name    ?? String(lid),
        country: meta?.country ?? info?.country.name   ?? "",
        flag:    meta?.flag    ?? "",
        logo:    info?.league.logo ?? "",
        season:  SEASON,
      },
    });
  }

  // ── All top leagues ──────────────────────────────────────────────────────────
  const rows = await db.select().from(leagues).where(inArray(leagues.id, TOP_IDS)) as League[];

  if (rows.length > 0) {
    // Preserve the display order from TOP_LEAGUES
    const byId = new Map<number, League>(rows.map((r) => [r.id, r]));
    const result = TOP_LEAGUES
      .map((l) => byId.get(l.id))
      .filter((r): r is League => r !== undefined)
      .map(overlay);
    return NextResponse.json({ leagues: result });
  }

  // Fallback to API
  const results = await Promise.all(
    TOP_LEAGUES.map(async (l) => {
      const res = unwrap(await apiFetch<ApiLeagueInfo>("/leagues", { id: l.id, season: SEASON }, 86400));
      const info = res?.[0];
      return {
        id:      l.id,
        name:    l.name,
        country: l.country,
        flag:    l.flag,
        logo:    info?.league.logo ?? "",
        season:  SEASON,
      };
    })
  );
  return NextResponse.json({ leagues: results });
}
