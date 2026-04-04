import type {
  Sport,
  OddsEvent,
  Bookmaker,
  TeamStats,
  H2HStats,
  Market,
  MarketOption,
  OddsApiEvent,
  OddsApiBookmaker,
  ApiSportsFixture,
  ApiSportsTeamStats,
  ApiSportsH2H,
} from "./types";

// ─── Sport key mapping ─────────────────────────────────────────────────────────
// Maps The Odds API sport_key values to our internal Sport type.

const ODDS_API_SPORT_MAP: Record<string, Sport> = {
  soccer_epl: "football",
  soccer_uefa_champs_league: "football",
  soccer_spain_la_liga: "football",
  soccer_germany_bundesliga: "football",
  soccer_italy_serie_a: "football",
  soccer_france_ligue_one: "football",
  basketball_nba: "nba",
  basketball_euroleague: "basketball",
  americanfootball_nfl: "american_football",
  americanfootball_ncaaf: "american_football",
  baseball_mlb: "baseball",
  icehockey_nhl: "hockey",
  mma_mixed_martial_arts: "mma",
  rugbyleague_nrl: "rugby",
  rugbyunion: "rugby",
  aussierules_afl: "afl",
  tennis_atp_french_open: "tennis",
  tennis_wta_french_open: "tennis",
  volleyball_wvl: "volleyball",
};

export function oddsApiSportToInternal(sportKey: string): Sport {
  return ODDS_API_SPORT_MAP[sportKey] ?? "football";
}

// ─── Odds API transformer ──────────────────────────────────────────────────────

export function transformOddsApiEvent(
  raw: OddsApiEvent,
  statsMap: Map<string, { home: TeamStats; away: TeamStats; h2h: H2HStats }>
): OddsEvent {
  const sport = oddsApiSportToInternal(raw.sport_key);
  const statsKey = `${raw.home_team}__${raw.away_team}`;
  const stats = statsMap.get(statsKey);

  const bookmakers: Bookmaker[] = raw.bookmakers
    .map((bk) => transformBookmaker(bk, raw.home_team, raw.away_team))
    .filter((b): b is Bookmaker => b !== null);

  const markets = deriveMarkets(bookmakers, raw.home_team, raw.away_team);

  return {
    id: raw.id,
    sport,
    league: raw.sport_title,
    homeTeam: raw.home_team,
    awayTeam: raw.away_team,
    commenceTime: raw.commence_time,
    bookmakers,
    homeStats: stats?.home ?? placeholderStats(),
    awayStats: stats?.away ?? placeholderStats(),
    h2h: stats?.h2h ?? { homeWins: 0, draws: 0, awayWins: 0 },
    markets,
  };
}

function transformBookmaker(
  bk: OddsApiBookmaker,
  homeTeam: string,
  awayTeam: string
): Bookmaker | null {
  const h2h = bk.markets.find((m) => m.key === "h2h");
  if (!h2h) return null;

  const homeOutcome = h2h.outcomes.find((o) => o.name === homeTeam);
  const awayOutcome = h2h.outcomes.find((o) => o.name === awayTeam);
  const drawOutcome = h2h.outcomes.find(
    (o) => o.name !== homeTeam && o.name !== awayTeam
  );

  if (!homeOutcome || !awayOutcome) return null;

  return {
    name: bk.title,
    home: homeOutcome.price,
    away: awayOutcome.price,
    ...(drawOutcome ? { draw: drawOutcome.price } : {}),
  };
}

// ─── Derive prediction markets from bookmaker odds ────────────────────────────

export function deriveMarkets(
  bookmakers: Bookmaker[],
  homeTeam: string,
  awayTeam: string
): Market[] {
  if (bookmakers.length === 0) return [];

  const hasDraws = bookmakers.some((b) => b.draw != null);

  // Average probabilities across bookmakers (implied from odds)
  const avgImplied = (prices: number[]) =>
    prices.reduce((sum, p) => sum + 1 / p, 0) / prices.length;

  const homeProb = avgImplied(bookmakers.map((b) => b.home));
  const awayProb = avgImplied(bookmakers.map((b) => b.away));
  const drawProb = hasDraws
    ? avgImplied(
        bookmakers.filter((b) => b.draw != null).map((b) => b.draw as number)
      )
    : 0;

  // Normalise to 100%
  const total = homeProb + awayProb + drawProb;
  const normHome = Math.round((homeProb / total) * 100);
  const normAway = Math.round((awayProb / total) * 100);
  const normDraw = hasDraws ? 100 - normHome - normAway : 0;

  const pick = normHome >= normAway && normHome >= normDraw ? "home" : normAway >= normDraw ? "away" : "draw";

  const options: MarketOption[] = [
    { label: homeTeam, probability: normHome, pick: pick === "home" },
    ...(hasDraws
      ? [{ label: "Draw", probability: normDraw, pick: pick === "draw" }]
      : []),
    { label: awayTeam, probability: normAway, pick: pick === "away" },
  ];

  // Best odds for the picked outcome
  const pickPrices =
    pick === "home"
      ? bookmakers.map((b) => b.home)
      : pick === "away"
      ? bookmakers.map((b) => b.away)
      : bookmakers.filter((b) => b.draw != null).map((b) => b.draw as number);

  const bestOdds = Math.max(...pickPrices);
  const bestBk =
    bookmakers.find(
      (b) =>
        (pick === "home" ? b.home : pick === "away" ? b.away : b.draw) ===
        bestOdds
    )?.name ?? "";

  return [
    {
      name: "Match Result",
      options,
      bestOdds,
      bestBookmaker: bestBk,
    },
  ];
}

// ─── API-Sports transformer ────────────────────────────────────────────────────

export function transformApiSportsStats(
  raw: ApiSportsTeamStats
): TeamStats {
  const formStr = raw.form ?? "";
  const form = formStr
    .slice(-5)
    .split("")
    .map((c) => (c === "W" ? "W" : c === "D" ? "D" : "L")) as (
    | "W"
    | "D"
    | "L"
  )[];

  return {
    form: form.length > 0 ? form : ["D", "D", "D", "D", "D"],
    avgScored: parseFloat(raw.goals?.for?.average?.total ?? "0"),
    avgConceded: parseFloat(raw.goals?.against?.average?.total ?? "0"),
  };
}

export function transformApiSportsH2H(
  results: ApiSportsH2H[],
  homeTeamId: number
): H2HStats {
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;

  for (const match of results.slice(0, 10)) {
    const hg = match.goals.home ?? 0;
    const ag = match.goals.away ?? 0;
    const matchHomeId = match.teams.home.id;

    if (hg === ag) {
      draws++;
    } else if (
      (matchHomeId === homeTeamId && hg > ag) ||
      (matchHomeId !== homeTeamId && ag > hg)
    ) {
      homeWins++;
    } else {
      awayWins++;
    }
  }

  return { homeWins, draws, awayWins };
}

// ─── Placeholder stats (used when API-Sports data not available) ───────────────

export function placeholderStats(): TeamStats {
  return {
    form: ["W", "D", "W", "L", "W"],
    avgScored: 1.5,
    avgConceded: 1.2,
  };
}
