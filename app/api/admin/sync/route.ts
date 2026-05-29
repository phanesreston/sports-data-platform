/**
 * /api/admin/sync — on-demand sync of upcoming fixtures and predictions.
 *
 * All API-Football calls live here (and in npm run db:sync). The rest of the
 * app reads only from the DB, so there are zero live API calls at page-load time.
 *
 * Usage:
 *   POST /api/admin/sync                     — fixtures + predictions
 *   POST /api/admin/sync?step=fixtures        — upcoming fixture list only
 *   POST /api/admin/sync?step=predictions     — predictions for NS fixtures only
 *
 * Protect in production — add ADMIN_SECRET to .env.local and pass it:
 *   curl -X POST https://your-domain/api/admin/sync \
 *        -H "Authorization: Bearer YOUR_ADMIN_SECRET"
 *
 * Vercel Cron example (vercel.json):
 *   { "crons": [{ "path": "/api/admin/sync", "schedule": "0 3 * * *" }] }
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, inArray, isNull, lt, or } from "drizzle-orm";
import { db, fixtures, fixturePredictions, leagues, teams } from "@/lib/db";

export const dynamic = "force-dynamic";

const BASE = "https://v3.football.api-sports.io";
const ALL_LEAGUE_IDS      = [1, 39, 40, 140, 141, 135, 136, 78, 79, 61, 62, 2, 3];
const OVERVIEW_LEAGUE_IDS = [1, 39, 140, 135, 78, 61, 2, 3];

// International tournaments (World Cup etc.) run in calendar years, not Aug-May.
const CALENDAR_YEAR_LEAGUES = new Set([1]);
function leagueSeason(leagueId: number): number {
  return CALENDAR_YEAR_LEAGUES.has(leagueId) ? new Date().getFullYear() : currentSeason();
}

function currentSeason() {
  const now = new Date();
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
}

function sleep(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

async function apiFetch(path: string, params: Record<string, string | number>) {
  const key = process.env.API_SPORTS_KEY;
  if (!key) throw new Error("API_SPORTS_KEY not set");
  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString(), { headers: { "x-apisports-key": key }, cache: "no-store" });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  const data = await res.json() as { response: unknown[]; errors?: Record<string, string> };
  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(Object.values(data.errors)[0]);
  }
  return data.response;
}

// ── sync upcoming fixture list ─────────────────────────────────────────────────

async function syncFixtures(): Promise<{ updated: number; errors: number }> {
  const now  = Date.now();
  const from = new Date(now - 7  * 86400_000).toISOString().slice(0, 10);
  const to   = new Date(now + 14 * 86400_000).toISOString().slice(0, 10);

  let updated = 0, errors = 0;

  for (let i = 0; i < ALL_LEAGUE_IDS.length; i++) {
    const leagueId = ALL_LEAGUE_IDS[i];
    if (i > 0) await sleep(400);
    try {
      const rows = await apiFetch("/fixtures", { league: leagueId, season: leagueSeason(leagueId), from, to });
      for (const row of rows as {
        fixture: { id: number; date: string; timestamp: number; status: { short: string } };
        league:  { id: number; name: string; country: string; logo: string; season: number; round: string };
        teams:   { home: { id: number; name: string; logo: string }; away: { id: number; name: string; logo: string } };
        goals:   { home: number | null; away: number | null };
      }[]) {
        // Ensure league + both teams exist before inserting fixture (FK constraints)
        await db.insert(leagues).values({
          id: leagueId, name: row.league.name, country: row.league.country, logo: row.league.logo ?? "", updatedAt: now,
        }).onConflictDoNothing();
        await db.insert(teams).values({
          id: row.teams.home.id, name: row.teams.home.name, logo: row.teams.home.logo ?? "", country: "", updatedAt: now,
        }).onConflictDoNothing();
        await db.insert(teams).values({
          id: row.teams.away.id, name: row.teams.away.name, logo: row.teams.away.logo ?? "", country: "", updatedAt: now,
        }).onConflictDoNothing();

        await db.insert(fixtures).values({
          id:         row.fixture.id,
          leagueId,
          season:     row.league.season,
          round:      row.league.round,
          date:       row.fixture.date,
          timestamp:  row.fixture.timestamp,
          status:     row.fixture.status.short,
          homeTeamId: row.teams.home.id,
          awayTeamId: row.teams.away.id,
          homeGoals:  row.goals.home,
          awayGoals:  row.goals.away,
          updatedAt:  now,
        }).onConflictDoUpdate({
          target: fixtures.id,
          set: { status: row.fixture.status.short, homeGoals: row.goals.home, awayGoals: row.goals.away, updatedAt: now },
        });
        updated++;
      }
      console.log(`[sync] [API] league ${leagueId}: ${rows.length} fixtures`);
    } catch (err) {
      console.error(`[sync] [API] league ${leagueId}: error — ${err}`);
      errors++;
    }
  }
  return { updated, errors };
}

// ── sync predictions ───────────────────────────────────────────────────────────

async function syncPredictions(): Promise<{ updated: number; skipped: number; errors: number }> {
  const nowSecs = Math.floor(Date.now() / 1000);
  const maxSecs = nowSecs + 14 * 86400;
  const staleMs = Date.now() - 23 * 3600_000;

  // Only re-fetch predictions that are missing or older than 23 h
  const upcoming = await db
    .select({ id: fixtures.id })
    .from(fixtures)
    .leftJoin(fixturePredictions, eq(fixturePredictions.fixtureId, fixtures.id))
    .where(and(
      eq(fixtures.status, "NS"),
      gt(fixtures.timestamp, nowSecs),
      lt(fixtures.timestamp, maxSecs),
      inArray(fixtures.leagueId, OVERVIEW_LEAGUE_IDS),
      or(isNull(fixturePredictions.updatedAt), lt(fixturePredictions.updatedAt, staleMs))
    ));

  console.log(`[sync] [DB] ${upcoming.length} fixtures need predictions`);
  let updated = 0, skipped = 0, errors = 0;

  for (let i = 0; i < upcoming.length; i++) {
    const { id } = upcoming[i];
    if (i > 0) await sleep(700);
    try {
      const rows = await apiFetch("/predictions", { fixture: id });
      if (!rows.length) { skipped++; continue; }

      const pred = rows[0] as {
        predictions: { percent: { home: string; draw: string; away: string }; advice?: string; under_over?: string | null };
      };
      const homePct = parseInt(pred.predictions.percent.home) || 0;
      const drawPct = parseInt(pred.predictions.percent.draw) || 0;
      const awayPct = parseInt(pred.predictions.percent.away) || 0;
      const now     = Date.now();

      await db.insert(fixturePredictions).values({
        fixtureId: id, homePct, drawPct, awayPct,
        advice:    pred.predictions.advice    ?? null,
        underOver: pred.predictions.under_over ?? null,
        updatedAt: now,
      }).onConflictDoUpdate({
        target: fixturePredictions.fixtureId,
        set: { homePct, drawPct, awayPct, advice: pred.predictions.advice ?? null, underOver: pred.predictions.under_over ?? null, updatedAt: now },
      });

      console.log(`[sync] [API] fixture ${id}: ${homePct}%H / ${drawPct}%D / ${awayPct}%A`);
      updated++;
    } catch (err) {
      console.error(`[sync] [API] fixture ${id}: error — ${err}`);
      errors++;
    }
  }
  return { updated, skipped, errors };
}

// ── handler ───────────────────────────────────────────────────────────────────

async function handle(req: NextRequest) {
  // Optional secret guard — skip check if ADMIN_SECRET is not configured
  const secret = process.env.ADMIN_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const step    = req.nextUrl.searchParams.get("step");
  const results: Record<string, unknown> = {};

  try {
    if (!step || step === "fixtures") {
      console.log("[sync] syncing upcoming fixtures…");
      results.fixtures = await syncFixtures();
    }
    if (!step || step === "predictions") {
      console.log("[sync] syncing predictions…");
      results.predictions = await syncPredictions();
    }
    return NextResponse.json({ ok: true, timestamp: new Date().toISOString(), ...results });
  } catch (err) {
    console.error("[sync] fatal:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export { handle as POST, handle as GET };
