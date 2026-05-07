/**
 * Periodic sync script — run nightly via cron or manually.
 * Run with:  npm run db:sync
 *
 * Updates everything the app serves from the DB so no live API calls
 * are needed at request time:
 *   1. Squads (transfers, signings)
 *   2. Recent + upcoming fixtures (-7 to +14 days)
 *   3. Pre-match predictions for all upcoming NS fixtures
 *
 * API cost: ~100 squad calls + 12 fixture calls + ~N prediction calls.
 * Free tier (10 req/min): run with SYNC_STEP=predictions to update only
 * predictions without burning the full daily quota.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { gt, lt, and, inArray, isNull, or, eq } from "drizzle-orm";
import * as schema from "../lib/db/schema";

const API_KEY  = process.env.API_SPORTS_KEY;
const DB_URL   = process.env.DATABASE_URL ?? "file:./sports.db";
const DB_TOKEN = process.env.DATABASE_AUTH_TOKEN;

// Domestic leagues + CL + EL
const LEAGUE_IDS = [39, 40, 140, 141, 135, 136, 78, 79, 61, 62, 2, 3];

// The 7 leagues shown on the overview (subset used for predictions)
const OVERVIEW_LEAGUE_IDS = [39, 140, 135, 78, 61, 2, 3];

function currentSeason(): number {
  const now = new Date();
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
}

const BASE = "https://v3.football.api-sports.io";

async function apiFetch(path: string, params: Record<string, string | number>) {
  if (!API_KEY) throw new Error("API_SPORTS_KEY not set");
  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString(), { headers: { "x-apisports-key": API_KEY } });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  const data = await res.json() as { response: unknown[]; errors?: Record<string, string> };
  if (data.errors && Object.keys(data.errors).length > 0) {
    const msg = Object.values(data.errors)[0];
    throw new Error(`API error: ${msg}`);
  }
  return data.response;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

const client = createClient({ url: DB_URL, authToken: DB_TOKEN });
const db     = drizzle(client, { schema });

// ── sync squads ────────────────────────────────────────────────────────────────

async function syncSquads() {
  console.log("\n👥 Syncing squads…");
  const SEASON = currentSeason();
  const now    = Date.now();

  const allTeams = await db.select({ id: schema.teams.id, name: schema.teams.name }).from(schema.teams);

  for (let i = 0; i < allTeams.length; i++) {
    const team = allTeams[i];
    process.stdout.write(`  [${i + 1}/${allTeams.length}] ${team.name}… `);

    try {
      const rows = await apiFetch("/players/squads", { team: team.id });
      const entry = rows[0] as { players: { id: number; name: string; nationality?: string; photo?: string; number?: number; position: string }[] } | undefined;
      if (!entry?.players?.length) { console.log("skip"); await sleep(300); continue; }

      for (const p of entry.players) {
        await db.insert(schema.players).values({ id: p.id, name: p.name, nationality: p.nationality ?? null, photo: p.photo ?? null, updatedAt: now })
          .onConflictDoUpdate({ target: schema.players.id, set: { name: p.name, photo: p.photo ?? null, updatedAt: now } });

        await db.insert(schema.squads).values({ teamId: team.id, playerId: p.id, season: SEASON, number: p.number ?? null, position: p.position ?? null })
          .onConflictDoUpdate({ target: [schema.squads.teamId, schema.squads.playerId, schema.squads.season], set: { number: p.number ?? null, position: p.position ?? null } });
      }
      console.log(`${entry.players.length} players`);
    } catch (err) {
      console.log(`error: ${err}`);
    }
    await sleep(300);
  }
}

// ── sync recent + upcoming fixtures ───────────────────────────────────────────

async function syncFixtures() {
  console.log("\n📅 Syncing fixtures (last 7 days + next 14 days)…");
  const SEASON = currentSeason();
  const now    = Date.now();

  for (const leagueId of LEAGUE_IDS) {
    try {
      const from = new Date(Date.now() - 7  * 86400_000).toISOString().slice(0, 10);
      const to   = new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10);

      const rows = await apiFetch("/fixtures", { league: leagueId, season: SEASON, from, to });

      for (const row of rows as {
        fixture: { id: number; date: string; timestamp: number; status: { short: string } };
        league:  { season: number; round: string };
        teams:   { home: { id: number }; away: { id: number } };
        goals:   { home: number | null; away: number | null };
      }[]) {
        await db.insert(schema.fixtures).values({
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
          target: schema.fixtures.id,
          set: { status: row.fixture.status.short, homeGoals: row.goals.home, awayGoals: row.goals.away, updatedAt: now },
        });
      }
      console.log(`  League ${leagueId}: ${rows.length} fixtures`);
    } catch (err) {
      console.log(`  League ${leagueId}: error — ${err}`);
    }
    await sleep(400);
  }
}

// ── sync predictions ───────────────────────────────────────────────────────────

async function syncPredictions() {
  console.log("\n🔮 Syncing predictions for upcoming fixtures…");
  const nowSecs  = Math.floor(Date.now() / 1000);
  const maxSecs  = nowSecs + 14 * 86400;
  const staleMs  = Date.now() - 23 * 3600_000; // re-fetch if older than 23 h

  // Find NS fixtures in overview leagues that are missing or stale predictions
  const upcoming = await db
    .select({
      id:          schema.fixtures.id,
      homeTeamId:  schema.fixtures.homeTeamId,
      awayTeamId:  schema.fixtures.awayTeamId,
      predUpdated: schema.fixturePredictions.updatedAt,
    })
    .from(schema.fixtures)
    .leftJoin(schema.fixturePredictions, eq(schema.fixturePredictions.fixtureId, schema.fixtures.id))
    .where(and(
      eq(schema.fixtures.status, "NS"),
      gt(schema.fixtures.timestamp, nowSecs),
      lt(schema.fixtures.timestamp, maxSecs),
      inArray(schema.fixtures.leagueId, OVERVIEW_LEAGUE_IDS),
      or(
        isNull(schema.fixturePredictions.updatedAt),
        lt(schema.fixturePredictions.updatedAt, staleMs)
      )
    ));

  console.log(`  ${upcoming.length} fixtures need predictions`);
  let succeeded = 0, skipped = 0;

  for (let i = 0; i < upcoming.length; i++) {
    const f = upcoming[i];
    if (i > 0) await sleep(700); // stay within ~10 req/min free-tier limit

    try {
      const rows = await apiFetch("/predictions", { fixture: f.id });
      if (!rows.length) { console.log(`  fixture ${f.id}: no prediction returned`); skipped++; continue; }

      const pred = rows[0] as {
        predictions: {
          percent: { home: string; draw: string; away: string };
          advice?: string;
          under_over?: string | null;
        };
      };

      const homePct = parseInt(pred.predictions.percent.home) || 0;
      const drawPct = parseInt(pred.predictions.percent.draw) || 0;
      const awayPct = parseInt(pred.predictions.percent.away) || 0;
      const now     = Date.now();

      await db.insert(schema.fixturePredictions).values({
        fixtureId: f.id, homePct, drawPct, awayPct,
        advice:    pred.predictions.advice    ?? null,
        underOver: pred.predictions.under_over ?? null,
        updatedAt: now,
      }).onConflictDoUpdate({
        target: schema.fixturePredictions.fixtureId,
        set: { homePct, drawPct, awayPct, advice: pred.predictions.advice ?? null, underOver: pred.predictions.under_over ?? null, updatedAt: now },
      });

      console.log(`  fixture ${f.id}: ${homePct}%H / ${drawPct}%D / ${awayPct}%A`);
      succeeded++;
    } catch (err) {
      console.log(`  fixture ${f.id}: error — ${err}`);
      skipped++;
    }
  }
  console.log(`  Done — ${succeeded} updated, ${skipped} skipped`);
}

// ── main ───────────────────────────────────────────────────────────────────────

async function main() {
  if (!API_KEY) { console.error("❌  API_SPORTS_KEY not set"); process.exit(1); }
  console.log(`\n🔄 Starting sync — ${new Date().toISOString()}`);

  const step = process.env.SYNC_STEP;

  if (!step || step === "squads")     await syncSquads();
  if (!step || step === "fixtures")   await syncFixtures();
  if (!step || step === "predictions") await syncPredictions();

  console.log("\n✅ Sync complete");
  process.exit(0);
}

main().catch((err) => { console.error("❌ Sync failed:", err); process.exit(1); });
