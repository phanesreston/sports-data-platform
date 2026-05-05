// /api/football/historical-odds — fetches pre-match bookmaker odds from
// The Odds API's historical endpoint for a set of completed fixtures.
//
// Usage: POST /api/football/historical-odds
// Body: { fixtures: FixtureInput[] }
//
// Returns: { odds: { [fixtureId]: HistoricalOdds | null } }
//
// Strategy:
//   1. Group fixtures by (sportKey, YYYY-MM-DD) so one API call covers all
//      matches for a given league on a given day.
//   2. Snapshot time = match day at 11:00 UTC — before any European kick-off.
//   3. Match teams via normalised name + bigram fuzzy fallback.
//   4. Cache each (sportKey, date) snapshot for 24 h — historical odds are immutable.
//
// Markets: h2h (home/draw/away), totals (over 2.5), btts (both teams to score).

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
  date:      string; // ISO 8601 from API-Football e.g. "2024-08-17T14:00:00+00:00"
  homeTeam:  string;
  awayTeam:  string;
  leagueId:  number;
}

// ── name normalisation ─────────────────────────────────────────────────────────

// Known cases where the API-Football short name and the Odds API full name
// are different enough that substring + bigram matching both fail.
// Key = norm(API-Football name), value = norm(Odds API home_team).
const TEAM_ALIASES: Record<string, string> = {
  // Premier League
  "wolves":                 "wolverhamptonwanderers",
  "wolverhampton":          "wolverhamptonwanderers",
  // Ligue 1
  "psg":                    "parisaintgermain",
  "parissaintgermain":      "parisaintgermain",
  // Bundesliga
  "dortmund":               "borussiadortmund",
  "gladbach":               "borussiadortmund",        // overridden below by full alias
  "borussiamgladbach":      "borussiadortmund",
  "monchengladbach":        "borussiamonchengladbach",
  "mgladbach":              "borussiamonchengladbach",
  "leverkusen":             "bayerleverkusen",
  "frankfurt":              "eintrachtfrankfurt",
  "wolfsburg":              "vflwolfsburg",
  "freiburg":               "scfreiburg",
  "schalke":                "schalke04",
  "mainz":                  "mainz05",
  // La Liga
  "atletico":               "atleticomadrid",
  "betis":                  "realbetis",
  "celta":                  "celtavigo",
  // Serie A
  "inter":                  "intermilan",
  "roma":                   "asroma",
  "lazio":                  "sslazio",
};

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function similarity(a: string, b: string): number {
  const na = norm(a), nb = norm(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
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
  let best = 0.45;
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
          if      (o.name === event.home_team && !result.home) result.home = Number(o.price) || null;
          else if (o.name === "Draw"          && !result.draw) result.draw = Number(o.price) || null;
          else if (o.name === event.away_team && !result.away) result.away = Number(o.price) || null;
        }
      }

      // "totals" market: outcomes have a `point` field; we want Over 2.5
      if (mkt.key === "totals" && !result.over25) {
        const o = outcomes.find((x) => x.name === "Over" && Number(x.point) === 2.5);
        if (o) result.over25 = Number(o.price) || null;
      }

      // "btts" is the correct Odds API market key (not "both_teams_to_score")
      if (mkt.key === "btts" && !result.btts) {
        const o = outcomes.find((x) => x.name === "Yes");
        if (o) result.btts = Number(o.price) || null;
      }
    }

    if (result.home && result.draw && result.away) break;
  }

  return result;
}

// ── The Odds API historical fetch ──────────────────────────────────────────────

async function fetchSnapshot(sportKey: string, snapshotDate: string): Promise<AnyObj[]> {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    console.error("[historical-odds] ODDS_API_KEY is not set");
    return [];
  }

  const url = new URL(`${BASE}/historical/sports/${sportKey}/odds`);
  url.searchParams.set("apiKey",     apiKey);
  url.searchParams.set("regions",    REGIONS);
  url.searchParams.set("markets",    "h2h,totals");
  url.searchParams.set("oddsFormat", "decimal");
  url.searchParams.set("dateFormat", "iso");
  url.searchParams.set("date",       snapshotDate);

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 86400 } });

    const remaining = res.headers.get("x-requests-remaining");
    const used      = res.headers.get("x-requests-used");
    const cost      = res.headers.get("x-requests-last");

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(`[historical-odds] ${res.status} for ${sportKey} @ ${snapshotDate}: ${errText}`);
      return [];
    }

    console.log(`[historical-odds] ${sportKey} ${snapshotDate} — remaining: ${remaining}, used: ${used}, cost: ${cost}`);
    if (remaining !== null && parseInt(remaining) < 10) {
      console.warn(`[historical-odds] ⚠ Low quota: ${remaining} credits remaining`);
    }

    const body = await res.json();
    const events = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
    console.log(`[historical-odds] ${sportKey} ${snapshotDate} — ${events.length} events in snapshot`);
    return events;
  } catch (err) {
    console.error(`[historical-odds] fetch error for ${sportKey} @ ${snapshotDate}:`, err);
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

  // Group by (sportKey, YYYY-MM-DD) to minimise API credits
  type Group = { sportKey: string; snapshotDate: string; fixtures: FixtureInput[] };
  const groups = new Map<string, Group>();

  for (const f of fixtures) {
    const sportKey = LEAGUE_SPORT_KEY[f.leagueId];
    if (!sportKey) continue;

    // 11:00 UTC is before any European kick-off; odds for that day's games are
    // published well in advance so this snapshot reliably has pre-match lines.
    const day          = f.date.slice(0, 10); // YYYY-MM-DD (handles both Z and +HH:MM offsets)
    const snapshotDate = `${day}T11:00:00Z`;
    const key          = `${sportKey}::${day}`;

    if (!groups.has(key)) groups.set(key, { sportKey, snapshotDate, fixtures: [] });
    groups.get(key)!.fixtures.push(f);
  }

  console.log(`[historical-odds] processing ${fixtures.length} fixtures across ${groups.size} date-groups`);

  const oddsMap: Record<number, HistoricalOdds | null> = {};

  for (const [groupKey, group] of groups) {
    const events = await fetchSnapshot(group.sportKey, group.snapshotDate);

    const byHome = new Map<string, AnyObj>();
    for (const ev of events) byHome.set(norm(ev.home_team ?? ""), ev);
    const allHomeNames = events.map((ev) => ev.home_team ?? "");

    for (const f of group.fixtures) {
      const normHome = norm(f.homeTeam);

      // 1. Exact normalised match
      let ev = byHome.get(normHome);

      // 2. Static alias (handles cases like "Wolves" → "Wolverhampton Wanderers")
      if (!ev) {
        const alias = TEAM_ALIASES[normHome];
        if (alias) {
          ev = byHome.get(alias);
          if (ev) console.log(`[historical-odds] alias match "${f.homeTeam}" → "${ev.home_team}" (group ${groupKey})`);
        }
      }

      // 3. Bigram fuzzy match
      if (!ev) {
        const matched = bestMatch(f.homeTeam, allHomeNames);
        if (matched) {
          console.log(`[historical-odds] fuzzy match "${f.homeTeam}" → "${matched}" (group ${groupKey})`);
          ev = byHome.get(norm(matched));
        }
      }

      if (!ev) {
        console.warn(`[historical-odds] no match for "${f.homeTeam}" vs "${f.awayTeam}" in ${group.sportKey} @ ${group.snapshotDate}`);
        oddsMap[f.id] = null;
        continue;
      }

      const o = extractOdds(ev);
      oddsMap[f.id] = (o.home || o.draw || o.away || o.over25 || o.btts) ? o : null;
    }
  }

  for (const f of fixtures) {
    if (!(f.id in oddsMap)) oddsMap[f.id] = null;
  }

  return NextResponse.json({ odds: oddsMap });
}
