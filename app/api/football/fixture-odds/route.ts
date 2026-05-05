// /api/football/fixture-odds — fetches pre-match bookmaker odds stored by
// API-Football for a batch of (already completed) fixture IDs.
//
// Usage: GET /api/football/fixture-odds?fixtures=123,456,789
//
// Returns per-fixture odds for four bet types:
//   home / draw / away  → Match Winner (bet ID 1)
//   over25              → Goals Over/Under "Over 2.5" (bet ID 5)
//   btts                → Both Teams To Score "Yes" (bet ID 8)
//
// Fetches without a `bet` filter so one API call per fixture covers all types.
// Batched in groups of 5 with 200 ms gaps to avoid burst rate-limiting.
// Each fixture is cached 24 h — historical odds are immutable once the game ends.

import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/apifootball";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

export interface FixtureOdds {
  home:   number | null;
  draw:   number | null;
  away:   number | null;
  over25: number | null;
  btts:   number | null;
}

function extractOdds(raw: AnyObj): FixtureOdds {
  const result: FixtureOdds = { home: null, draw: null, away: null, over25: null, btts: null };

  const bookmakers: AnyObj[] = Array.isArray(raw?.bookmakers) ? raw.bookmakers : [];

  for (const bm of bookmakers) {
    const bets: AnyObj[] = Array.isArray(bm?.bets) ? bm.bets : [];

    for (const bet of bets) {
      const vals: AnyObj[] = Array.isArray(bet?.values) ? bet.values : [];

      if (bet.id === 1 || bet.name === "Match Winner") {
        for (const v of vals) {
          if (v.value === "Home"  && !result.home)  result.home  = parseFloat(v.odd) || null;
          if (v.value === "Draw"  && !result.draw)  result.draw  = parseFloat(v.odd) || null;
          if (v.value === "Away"  && !result.away)  result.away  = parseFloat(v.odd) || null;
        }
      }
      if ((bet.id === 5 || bet.name === "Goals Over/Under") && !result.over25) {
        const v = vals.find((x) => x.value === "Over 2.5");
        if (v) result.over25 = parseFloat(v.odd) || null;
      }
      if ((bet.id === 8 || bet.name === "Both Teams To Score") && !result.btts) {
        const v = vals.find((x) => x.value === "Yes");
        if (v) result.btts = parseFloat(v.odd) || null;
      }
    }

    // Stop after first bookmaker that has Match Winner odds
    if (result.home && result.draw && result.away) break;
  }

  return result;
}

async function fetchOne(fixtureId: string): Promise<FixtureOdds | null> {
  const res = await apiFetch<unknown>("/odds", { fixture: fixtureId }, 86400);
  if (!res) return null;

  // /odds returns response as an array; each element is one fixture's odds
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const responseArr = (res as any)?.response;
  const item = Array.isArray(responseArr) ? responseArr[0] : responseArr;
  if (!item) return null;

  const odds = extractOdds(item as AnyObj);
  // If we got nothing useful, return null so the caller can fall back
  return (odds.home || odds.draw || odds.away || odds.over25 || odds.btts)
    ? odds
    : null;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

export async function GET(req: NextRequest) {
  const param = req.nextUrl.searchParams.get("fixtures") ?? "";
  const ids   = param.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 50);

  if (ids.length === 0) {
    return NextResponse.json({ odds: {} });
  }

  const oddsMap: Record<string, FixtureOdds | null> = {};
  const batchSize = 5;

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch   = ids.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((id) => fetchOne(id).then((o) => ({ id, o })))
    );
    for (const { id, o } of results) oddsMap[id] = o;

    // Brief pause between batches to stay within per-minute quota limits
    if (i + batchSize < ids.length) await sleep(250);
  }

  return NextResponse.json({ odds: oddsMap });
}
