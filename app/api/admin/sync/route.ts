// POST /api/admin/sync
// Triggers a database sync without needing shell access.
// Protected by ADMIN_SECRET — set this in .env.local.
//
// Usage:
//   curl -X POST https://your-domain.com/api/admin/sync \
//     -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
//     -H "Content-Type: application/json" \
//     -d '{"step":"all"}'           # all | squads | fixtures
//
// For Vercel Cron, add to vercel.json:
//   { "crons": [{ "path": "/api/admin/sync", "schedule": "0 3 * * *" }] }
// And set CRON_SECRET = ADMIN_SECRET in project env vars.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

const LEAGUE_IDS = [39, 140, 135, 78, 61];

function currentSeason(): number {
  const now = new Date();
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function apiFetch(path: string, params: Record<string, string | number>) {
  const key = process.env.API_SPORTS_KEY;
  if (!key) throw new Error("API_SPORTS_KEY not set");

  const url = new URL(`https://v3.football.api-sports.io${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const res = await fetch(url.toString(), {
    headers: { "x-apisports-key": key },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  const data = await res.json();
  return data.response as unknown[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertSquadsForTeam(team: { id: number }, season: number, now: number): Promise<number> {
  const rows = await apiFetch("/players/squads", { team: team.id });
  const entry = rows[0] as { players: { id: number; name: string; nationality?: string; photo?: string; number?: number; position: string }[] } | undefined;
  if (!entry?.players?.length) return 0;

  for (const p of entry.players) {
    await db.insert(schema.players).values({ id: p.id, name: p.name, nationality: p.nationality ?? null, photo: p.photo ?? null, updatedAt: now })
      .onConflictDoUpdate({ target: schema.players.id, set: { name: p.name, photo: p.photo ?? null, updatedAt: now } });

    await db.insert(schema.squads).values({ teamId: team.id, playerId: p.id, season, number: p.number ?? null, position: p.position ?? null })
      .onConflictDoUpdate({ target: [schema.squads.teamId, schema.squads.playerId, schema.squads.season], set: { number: p.number ?? null, position: p.position ?? null } });
  }
  return entry.players.length;
}

export async function POST(req: NextRequest) {
  // Auth check
  const secret = process.env.ADMIN_SECRET;
  const auth   = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const step: string = body.step ?? "all";

  const season = currentSeason();
  const now    = Date.now();
  const log: string[] = [];

  try {
    // ── squads ────────────────────────────────────────────────────────────────
    if (step === "all" || step === "squads") {
      const teams = await db.select({ id: schema.teams.id }).from(schema.teams);
      let totalPlayers = 0;

      for (const team of teams) {
        try {
          const n = await upsertSquadsForTeam(team, season, now);
          totalPlayers += n;
        } catch { /* skip individual failures */ }
        await sleep(300);
      }
      log.push(`squads: updated ${totalPlayers} player records across ${teams.length} teams`);
    }

    // ── fixtures ──────────────────────────────────────────────────────────────
    if (step === "all" || step === "fixtures") {
      const from = new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10);
      const to   = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);
      let totalFixtures = 0;

      for (const leagueId of LEAGUE_IDS) {
        try {
          const rows = await apiFetch("/fixtures", { league: leagueId, season, from, to });
          for (const row of rows as {
            fixture: { id: number; date: string; timestamp: number; status: { short: string } };
            league:  { season: number; round: string };
            teams:   { home: { id: number }; away: { id: number } };
            goals:   { home: number | null; away: number | null };
          }[]) {
            await db.insert(schema.fixtures).values({
              id: row.fixture.id, leagueId, season: row.league.season, round: row.league.round,
              date: row.fixture.date, timestamp: row.fixture.timestamp, status: row.fixture.status.short,
              homeTeamId: row.teams.home.id, awayTeamId: row.teams.away.id,
              homeGoals: row.goals.home, awayGoals: row.goals.away, updatedAt: now,
            }).onConflictDoUpdate({
              target: schema.fixtures.id,
              set: { status: row.fixture.status.short, homeGoals: row.goals.home, awayGoals: row.goals.away, updatedAt: now },
            });
          }
          totalFixtures += rows.length;
        } catch { /* skip individual league failures */ }
        await sleep(400);
      }
      log.push(`fixtures: updated ${totalFixtures} fixture records`);
    }

    return NextResponse.json({ ok: true, step, log });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// Allow Vercel Cron to call this as a GET too
export { POST as GET };
