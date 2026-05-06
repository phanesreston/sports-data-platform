/**
 * One-time database seed script.
 * Run with:  npm run db:seed
 *
 * What it does (in order):
 *   1. Creates all tables (db:push must have been run first, or use --push flag)
 *   2. Seeds the 5 tracked leagues
 *   3. Seeds teams for each league (current season)
 *   4. Seeds squads (players) for every team
 *   5. Seeds the last 2 seasons of fixtures for each league
 *
 * API cost: roughly 1 + 5 + ~100 + 10 = ~120 calls.
 * With a paid API plan this runs in a few minutes.
 * With the free plan (100 calls/day) run in two sessions:
 *   Session 1: SEED_STEP=leagues-teams  npm run db:seed
 *   Session 2: SEED_STEP=squads         npm run db:seed
 *   Session 3: SEED_STEP=fixtures       npm run db:seed
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sql } from "drizzle-orm";
import * as schema from "../lib/db/schema";

// ── config ─────────────────────────────────────────────────────────────────────

const API_KEY  = process.env.API_SPORTS_KEY;
const DB_URL   = process.env.DATABASE_URL ?? "file:./sports.db";
const DB_TOKEN = process.env.DATABASE_AUTH_TOKEN;
const STEP     = process.env.SEED_STEP ?? "all"; // all | leagues-teams | squads | fixtures

// The five domestic leagues we track
const LEAGUE_IDS = [39, 140, 135, 78, 61] as const; // EPL, La Liga, Serie A, Bundesliga, Ligue 1

function currentSeason(): number {
  const now = new Date();
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
}

const SEASON     = currentSeason();
const PREV_SEASON = SEASON - 1;

// ── API helper ─────────────────────────────────────────────────────────────────

const BASE = "https://v3.football.api-sports.io";

async function apiFetch(path: string, params: Record<string, string | number>) {
  if (!API_KEY) throw new Error("API_SPORTS_KEY not set in environment");

  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const res = await fetch(url.toString(), {
    headers: { "x-apisports-key": API_KEY },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${path} → ${res.status}: ${body}`);
  }

  const data = await res.json();

  if (data.errors && Object.keys(data.errors).length > 0) {
    console.warn(`  ⚠ API errors for ${path}:`, data.errors);
  }

  const remaining = res.headers.get("x-ratelimit-requests-remaining");
  if (remaining !== null) {
    const n = parseInt(remaining);
    if (n < 20) console.warn(`  ⚠ Low API quota: ${n} requests remaining`);
  }

  return data.response as unknown[];
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── db setup ───────────────────────────────────────────────────────────────────

const client = createClient({ url: DB_URL, authToken: DB_TOKEN });
const db     = drizzle(client, { schema });

// ── seed steps ─────────────────────────────────────────────────────────────────

async function seedLeagues() {
  console.log("\n📋 Seeding leagues…");
  const now = Date.now();

  for (const id of LEAGUE_IDS) {
    const rows = await apiFetch("/leagues", { id });
    if (!rows.length) { console.warn(`  No data for league ${id}`); continue; }
    const r = rows[0] as { league: { id: number; name: string; logo: string }; country: { name: string } };

    await db.insert(schema.leagues).values({
      id:        r.league.id,
      name:      r.league.name,
      country:   r.country.name,
      logo:      r.league.logo,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: schema.leagues.id,
      set:    { name: r.league.name, logo: r.league.logo, updatedAt: now },
    });

    console.log(`  ✓ ${r.league.name}`);
    await sleep(300);
  }
}

async function seedTeams() {
  console.log("\n🏟  Seeding teams…");
  const now = Date.now();

  // Seed both seasons so fixtures from last season reference valid team rows
  for (const season of [PREV_SEASON, SEASON]) {
  for (const leagueId of LEAGUE_IDS) {
    const rows = await apiFetch("/teams", { league: leagueId, season });
    console.log(`  League ${leagueId} (${season}): ${rows.length} teams`);

    for (const row of rows as { team: { id: number; name: string; country: string; logo: string } }[]) {
      await db.insert(schema.teams).values({
        id:        row.team.id,
        name:      row.team.name,
        country:   row.team.country,
        logo:      row.team.logo,
        updatedAt: now,
      }).onConflictDoUpdate({
        target: schema.teams.id,
        set:    { name: row.team.name, logo: row.team.logo, updatedAt: now },
      });

      await db.insert(schema.leagueTeams).values({
        leagueId,
        teamId: row.team.id,
        season,
      }).onConflictDoNothing();
    }

    await sleep(300);
  }
  } // end season loop
}

async function seedSquads() {
  console.log("\n👥 Seeding squads…");
  const now = Date.now();

  // Get all teams we've already stored
  const allTeams = await db.select().from(schema.teams);
  console.log(`  ${allTeams.length} teams to process`);

  for (let i = 0; i < allTeams.length; i++) {
    const team = allTeams[i];
    process.stdout.write(`  [${i + 1}/${allTeams.length}] ${team.name}… `);

    try {
      const rows = await apiFetch("/players/squads", { team: team.id });
      const entry = (rows[0] as { players: { id: number; name: string; nationality?: string; photo?: string; number?: number; position: string }[] } | undefined);

      if (!entry?.players?.length) {
        console.log("no squad data");
        await sleep(300);
        continue;
      }

      for (const p of entry.players) {
        // Upsert player
        await db.insert(schema.players).values({
          id:          p.id,
          name:        p.name,
          nationality: p.nationality ?? null,
          photo:       p.photo ?? null,
          updatedAt:   now,
        }).onConflictDoUpdate({
          target: schema.players.id,
          set:    { name: p.name, photo: p.photo ?? null, updatedAt: now },
        });

        // Upsert squad membership
        await db.insert(schema.squads).values({
          teamId:   team.id,
          playerId: p.id,
          season:   SEASON,
          number:   p.number ?? null,
          position: p.position ?? null,
        }).onConflictDoUpdate({
          target: [schema.squads.teamId, schema.squads.playerId, schema.squads.season],
          set:    { number: p.number ?? null, position: p.position ?? null },
        });
      }

      console.log(`${entry.players.length} players`);
    } catch (err) {
      console.log(`ERROR: ${err}`);
    }

    // Stay well within rate limits — 300 ms between calls
    await sleep(300);
  }
}

async function seedFixtures() {
  console.log("\n📅 Seeding fixtures…");
  const now = Date.now();

  for (const leagueId of LEAGUE_IDS) {
    for (const season of [PREV_SEASON, SEASON]) {
      console.log(`  League ${leagueId} season ${season}…`);
      const rows = await apiFetch("/fixtures", { league: leagueId, season });

      let skipped = 0;
      for (const row of rows as {
        fixture: { id: number; date: string; timestamp: number; status: { short: string } };
        league:  { season: number; round: string };
        teams:   { home: { id: number }; away: { id: number } };
        goals:   { home: number | null; away: number | null };
      }[]) {
        try {
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
          set: {
            status:    row.fixture.status.short,
            homeGoals: row.goals.home,
            awayGoals: row.goals.away,
            updatedAt: now,
          },
        });
        } catch { skipped++; }
      }

      console.log(`    ✓ ${rows.length - skipped} fixtures (${skipped} skipped — unknown team)`);
      await sleep(500);
    }
  }
}

// ── main ───────────────────────────────────────────────────────────────────────

async function main() {
  if (!API_KEY) {
    console.error("❌  API_SPORTS_KEY is not set. Add it to .env.local and retry.");
    process.exit(1);
  }

  console.log(`\n🚀 Starting seed (step: ${STEP}) — season ${SEASON}`);
  console.log(`   DB: ${DB_URL}`);

  const start = Date.now();

  if (STEP === "all" || STEP === "leagues-teams") {
    await seedLeagues();
    await seedTeams();
  }

  if (STEP === "all" || STEP === "squads") {
    await seedSquads();
  }

  if (STEP === "all" || STEP === "fixtures") {
    await seedFixtures();
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n✅ Done in ${elapsed}s`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
