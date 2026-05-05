// /api/football/historical-odds — fetches pre-match bookmaker odds from
// The Odds API's historical endpoint for a set of completed fixtures.
//
// Usage: POST /api/football/historical-odds
// Body: { fixtures: FixtureInput[] }
//
// FixtureInput: { id, date, homeTeam, awayTeam, leagueId }
//
// Returns: { odds: { [fixtureId]: HistoricalOdds | null } }
//
// Strategy:
//   1. Group fixtures by (sportKey, YYYY-MM-DD) so one API call covers all
//      matches for a given league on a given day.
//   2. Snapshot time = match day at 10:00 UTC (pre-match morning line).
//   3. Match teams via fuzzy name normalisation.
//   4. Cache each (sportKey, date) snapshot for 24 h — historical odds don't change.
//
// Markets fetched: h2h (home/draw/away), totals (over 2.5), both_teams_to_score.

import { NextRequest, NextResponse } from "next/server";

const BASE = "https://api.the-odds-api.com/v4";

// API-Football league ID → The Odds API sport key
const LEAGUE_SPORT_KEY: Record<number, string> = {
  39:  "soccer_epl",
  140: "soccer_spain_la_liga",
  135: "soccer_italy_serie_a",
  78:  "soccer_germany_bundesliga",
  61:  "soccer_france_ligue_one",
  2:   "soccer_uefa_champs_league",
  3:   "soccer_uefa_europa_league",
};

const REGIONS = process.env.ODDS_API_REGIONS ?? "uk";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

export interface HistoricalOdds {
  home:   number | null;
  draw:   number | null;
  away:   number | null;
  over25: number | null;
  btts:   number | null;
}

export interface FixtureInput {
  id:        number;
  date:      string; // ISO 8601 from API-Football (e.g. "2024-08-17T14:00:00+00:00")
  homeTeam:  string;
  awayTeam:  string;
  leagueId:  number;
}

// ── name normalisation ─────────────────────────────────────────────────────────

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Returns a 0-1 similarity score between two team name strings.
function similarity(a: string, b: string): number {
  const na = norm(a), nb = norm(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  // Jaccard on bigrams
  const bigrams = (s: string) => {
    const bg = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) bg.add(s.slice(i, i + 2));
    return bg;
  };
  const bgA = bigrams(na), bgB = bigrams(nb);
  const inter = [...bgA].filter((g) => bgB.has(g)).length;
  const union = new Set([...bgA, ...bgB]).size;
  return union === 0 ? 0 : inter / union;
}

function bestMatch(name: string, candidates: string[]): string | null {
  let best = 0.45; // minimum threshold
  let found: string | null = null;
  for (const c of candidates) {
    const s = similarity(name, c);
    if (s > best) { best = s; found = c; }
  }
  return found;
}

// ── odds extraction ────────────────────────────────────────────────────────────

function extractOdds(event: AnyObj): HistoricalOdds {
  const result: HistoricalOdds = { home: null, draw: null, away: null, over25: null, btts: null };
  const bookmakers: AnyObj[] = Array.isArray(event?.bookmakers) ? event.bookmakers : [];

  for (const bm of bookmakers) {
    const markets: AnyObj[] = Array.isArray(bm?.markets) ? bm.markets : [];

    for (const mkt of markets) {
      const outcomes: AnyObj[] = Array.isArray(mkt?.outcomes) ? mkt.outcomes : [];

      if (mkt.key === "h2h") {
        for (const o of outcomes) {
          if (o.name === event.home_team && !result.home) result.home = Number(o.price) || null;
          else if (o.name === "Draw"           && !result.draw) result.draw = Number(o.price) || null;
          else if (o.name === event.away_team  && !result.away) result.away = Number(o.price) || null;
        }
      }

      if (mkt.key === "totals" && !result.over25) {
        const o = outcomes.find((x) => x.name === "Over" && Number(x.point) === 2.5);
        if (o) result.over25 = Number(o.price) || null;
      }

      if (mkt.key === "both_teams_to_score" && !result.btts) {
        const o = outcomes.find((x) => x.name === "Yes");
        if (o) result.btts = Number(o.price) || null;
      }
    }

    if (result.home && result.draw && result.away) break; // first complete bookmaker is enough
  }

  return result;
}

// ── The Odds API historical fetch ──────────────────────────────────────────────

async function fetchSnapshot(sportKey: string, isoDate: string): Promise<AnyObj[]> {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) return [];

  const url = new URL(`${BASE}/historical/sports/${sportKey}/odds`);
  url.searchParams.set("apiKey",     apiKey);
  url.searchParams.set("regions",    REGIONS);
  url.searchParams.set("markets",    "h2h,totals,both_teams_to_score");
  url.searchParams.set("oddsFormat", "decimal");
  url.searchParams.set("dateFormat", "iso");
  url.searchParams.set("date",       isoDate);

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 86400 } });

    if (!res.ok) {
      console.error(`[historical-odds] ${res.status} for ${sportKey} @ ${isoDate}`);
      return [];
    }

    const remaining = res.headers.get("x-requests-remaining");
    const used      = res.headers.get("x-requests-used");
    const cost      = res.headers.get("x-requests-last");
    console.log(`[historical-odds] ${sportKey} ${isoDate} — remaining: ${remaining}, used: ${used}, cost: ${cost}`);
    if (remaining !== null && parseInt(remaining) < 10) {
      console.warn(`[historical-odds] ⚠ Low quota: ${remaining} credits remaining`);
    }

    const body = await res.json();
    // Historical endpoint wraps events in { data: [...] }
    return Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
  } catch (err) {
    console.error(`[historical-odds] fetch error for ${sportKey} @ ${isoDate}:`, err);
    return [];
  }
}

// ── route handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let fixtures: FixtureInput[];
  try {
    const body = await req.json();
    fixtures = Array.isArray(body?.fixtures) ? body.fixtures : [];
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (fixtures.length === 0) return NextResponse.json({ odds: {} });

  // Group by (sportKey, YYYY-MM-DD) to minimise API calls
  type Group = { sportKey: string; snapshotDate: string; fixtures: FixtureInput[] };
  const groups = new Map<string, Group>();

  for (const f of fixtures) {
    const sportKey = LEAGUE_SPORT_KEY[f.leagueId];
    if (!sportKey) continue;

    // Use match-day at 10:00 UTC — well before most European kick-offs
    const day = f.date.slice(0, 10); // YYYY-MM-DD
    const snapshotDate = `${day}T10:00:00Z`;
    const key = `${sportKey}::${day}`;

    if (!groups.has(key)) groups.set(key, { sportKey, snapshotDate, fixtures: [] });
    groups.get(key)!.fixtures.push(f);
  }

  const oddsMap: Record<number, HistoricalOdds | null> = {};

  for (const [, group] of groups) {
    const events = await fetchSnapshot(group.sportKey, group.snapshotDate);

    // Index events by normalised home team name for O(1) lookup
    const byHome = new Map<string, AnyObj>();
    for (const ev of events) byHome.set(norm(ev.home_team ?? ""), ev);
    const allHomeNames: string[] = events.map((ev) => ev.home_team ?? "");

    for (const f of group.fixtures) {
      // Exact normalised match first, then fuzzy
      let ev = byHome.get(norm(f.homeTeam));
      if (!ev) {
        const matched = bestMatch(f.homeTeam, allHomeNames);
        if (matched) ev = byHome.get(norm(matched));
      }

      if (!ev) { oddsMap[f.id] = null; continue; }

      const o = extractOdds(ev);
      oddsMap[f.id] = (o.home || o.draw || o.away || o.over25 || o.btts) ? o : null;
    }
  }

  // Ensure every requested fixture has an entry (null = no data)
  for (const f of fixtures) {
    if (!(f.id in oddsMap)) oddsMap[f.id] = null;
  }

  return NextResponse.json({ odds: oddsMap });
}
