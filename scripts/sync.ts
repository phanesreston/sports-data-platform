/**
 * Periodic sync script — run nightly via cron or manually.
 * Run with:  npm run db:sync
 *
 * Much lighter than seed.ts — only touches data that may have changed:
 *   1. Updates squads (transfers, injuries, new signings)
 *   2. Updates recent fixtures (results from the last 7 days)
 *   3. Updates status of upcoming fixtures for the next 7 days
 *
 * API cost: ~100 squad calls + 5 fixture calls = ~105 calls total.
 */

import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { gt, lt, and, inArray } from "drizzle-orm";
import * as schema from "../lib/db/schema";

const API_KEY  = process.env.API_SPORTS_KEY;
const DB_URL   = process.env.DATABASE_URL ?? "file:./sports.db";
const DB_TOKEN = process.env.DATABASE_AUTH_TOKEN;

const LEAGUE_IDS = [39, 140, 135, 78, 61];

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
  const data = await res.json();
  return data.response as unknown[];
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
  console.log("\n📅 Syncing fixtures (last 7 days + next 7 days)…");
  const SEASON = currentSeason();
  const now    = Date.now();

  for (const leagueId of LEAGUE_IDS) {
    try {
      // last + next 7 days using API's `from`/`to` params
      const from = new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10);
      const to   = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);

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
      console.log(`  League ${leagueId}: ${rows.length} fixtures updated`);
    } catch (err) {
      console.log(`  League ${leagueId}: error — ${err}`);
    }
    await sleep(400);
  }
}

// ── main ───────────────────────────────────────────────────────────────────────

async function main() {
  if (!API_KEY) { console.error("❌  API_SPORTS_KEY not set"); process.exit(1); }
  console.log(`\n🔄 Starting sync — ${new Date().toISOString()}`);

  await syncSquads();
  await syncFixtures();

  console.log("\n✅ Sync complete");
  process.exit(0);
}

main().catch((err) => { console.error("❌ Sync failed:", err); process.exit(1); });
