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
  ApiFootballResponse,
  ApiFixture,
  ApiTeamStatistics,
  ApiPrediction,
} from "./types";

// ─── API-Football response helper ─────────────────────────────────────────────
// Unwraps the standard wrapper and returns null if there are errors or no data.

export function unwrapApiFootball<T>(
  json: ApiFootballResponse<T>
): T[] | null {
  const errors = json.errors;
  const hasErrors =
    Array.isArray(errors)
      ? errors.length > 0
      : Object.keys(errors ?? {}).length > 0;

  if (hasErrors) {
    console.warn("[API-Football] errors in response:", errors);
    return null;
  }

  if (!json.response) return null;
  // /teams/statistics returns response as a plain object, not an array.
  // Wrap it so callers can always use [0] without special-casing.
  if (!Array.isArray(json.response)) return [json.response];
  if ((json.response as unknown[]).length === 0) return null;
  return json.response;
}

// ─── Sport key mapping ─────────────────────────────────────────────────────────
// Maps The Odds API sport_key values to our internal Sport type.

const ODDS_API_SPORT_MAP: Record<string, Sport> = {
  soccer_epl:                    "football",
  soccer_uefa_champs_league:     "football",
  soccer_spain_la_liga:          "football",
  soccer_germany_bundesliga:     "football",
  soccer_italy_serie_a:          "football",
  soccer_france_ligue_one:       "football",
  basketball_nba:                "nba",
  basketball_euroleague:         "basketball",
  americanfootball_nfl:          "american_football",
  americanfootball_ncaaf:        "american_football",
  baseball_mlb:                  "baseball",
  icehockey_nhl:                 "hockey",
  mma_mixed_martial_arts:        "mma",
  rugbyleague_nrl:               "rugby",
  rugbyunion:                    "rugby",
  aussierules_afl:               "afl",
  tennis_atp_french_open:        "tennis",
  tennis_wta_french_open:        "tennis",
  volleyball_wvl:                "volleyball",
};

export function oddsApiSportToInternal(sportKey: string): Sport {
  return ODDS_API_SPORT_MAP[sportKey] ?? "football";
}

// ─── API-Football fixture → TeamStats ─────────────────────────────────────────

export function transformTeamStatistics(raw: ApiTeamStatistics): TeamStats {
  // form string: "WWDLW" — convert last 5 chars; rightmost = most recent
  const formStr = raw.form ?? "";
  const last5 = formStr.slice(-5).split("").map((c): "W" | "D" | "L" => {
    if (c === "W") return "W";
    if (c === "D") return "D";
    return "L";
  });

  return {
    form: last5.length > 0 ? last5 : ["D", "D", "D", "D", "D"],
    // goals.for.average.total is a string like "1.6"
    avgScored:   parseFloat(raw.goals?.for?.average?.total ?? "0") || 0,
    avgConceded: parseFloat(raw.goals?.against?.average?.total ?? "0") || 0,
  };
}

// ─── API-Football H2H fixtures → H2HStats ────────────────────────────────────

export function transformH2H(
  fixtures: ApiFixture[],
  homeTeamId: number
): H2HStats {
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;

  for (const f of fixtures.slice(0, 10)) {
    const hg = f.goals.home ?? 0;
    const ag = f.goals.away ?? 0;
    const matchHomeId = f.teams.home.id;

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

// ─── API-Football prediction → Market[] ──────────────────────────────────────

export function transformPredictionToMarkets(
  pred: ApiPrediction,
  homeTeam: string,
  awayTeam: string
): Market[] {
  const pct = pred.predictions.percent;
  const homeProb = parseInt(pct.home) || 0;
  const drawProb = parseInt(pct.draw) || 0;
  const awayProb = parseInt(pct.away) || 0;

  const hasDraws = drawProb > 0;
  const pickLabel =
    homeProb >= awayProb && homeProb >= drawProb
      ? homeTeam
      : awayProb >= drawProb
      ? awayTeam
      : "Draw";

  const options: MarketOption[] = [
    { label: homeTeam, probability: homeProb, pick: pickLabel === homeTeam },
    ...(hasDraws
      ? [{ label: "Draw", probability: drawProb, pick: pickLabel === "Draw" }]
      : []),
    { label: awayTeam, probability: awayProb, pick: pickLabel === awayTeam },
  ];

  const markets: Market[] = [
    {
      name: "Match Result",
      options,
      bestOdds: 0, // populated later when odds data is merged
      bestBookmaker: pred.predictions.advice ?? "",
    },
  ];

  // Under/Over market from prediction if available
  if (pred.predictions.under_over) {
    const label = pred.predictions.under_over; // e.g. "Under 2.5"
    markets.push({
      name: "Goals Over/Under",
      options: [
        { label, probability: 60, pick: true },
        {
          label: label.startsWith("Under") ? label.replace("Under", "Over") : label.replace("Over", "Under"),
          probability: 40,
          pick: false,
        },
      ],
      bestOdds: 0,
      bestBookmaker: "",
    });
  }

  return markets;
}

// ─── Odds API transformer ──────────────────────────────────────────────────────

export function transformOddsApiEvent(
  raw: OddsApiEvent,
  statsMap: Map<string, { home: TeamStats; away: TeamStats; h2h: H2HStats }>,
  marketsOverride?: Market[]
): OddsEvent {
  const sport = oddsApiSportToInternal(raw.sport_key);
  const statsKey = `${raw.home_team}__${raw.away_team}`;
  const stats = statsMap.get(statsKey);

  const bookmakers: Bookmaker[] = raw.bookmakers
    .map((bk) => transformBookmaker(bk, raw.home_team, raw.away_team))
    .filter((b): b is Bookmaker => b !== null);

  const markets = marketsOverride ?? deriveMarketsFromOdds(bookmakers, raw.home_team, raw.away_team);

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

export function deriveMarketsFromOdds(
  bookmakers: Bookmaker[],
  homeTeam: string,
  awayTeam: string
): Market[] {
  if (bookmakers.length === 0) return [];

  const hasDraws = bookmakers.some((b) => b.draw != null);
  const avgImplied = (prices: number[]) =>
    prices.reduce((sum, p) => sum + 1 / p, 0) / prices.length;

  const homeProb = avgImplied(bookmakers.map((b) => b.home));
  const awayProb = avgImplied(bookmakers.map((b) => b.away));
  const drawProb = hasDraws
    ? avgImplied(
        bookmakers.filter((b) => b.draw != null).map((b) => b.draw as number)
      )
    : 0;

  const total = homeProb + awayProb + drawProb;
  const normHome = Math.round((homeProb / total) * 100);
  const normAway = Math.round((awayProb / total) * 100);
  const normDraw = hasDraws ? 100 - normHome - normAway : 0;

  const pick =
    normHome >= normAway && normHome >= normDraw
      ? "home"
      : normAway >= normDraw
      ? "away"
      : "draw";

  const options: MarketOption[] = [
    { label: homeTeam, probability: normHome, pick: pick === "home" },
    ...(hasDraws
      ? [{ label: "Draw", probability: normDraw, pick: pick === "draw" }]
      : []),
    { label: awayTeam, probability: normAway, pick: pick === "away" },
  ];

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

  return [{ name: "Match Result", options, bestOdds, bestBookmaker: bestBk }];
}

// ─── Empty stats (returned when API data is unavailable) ─────────────────────
// Returns zeros so the UI can show "no data" rather than fake figures.

export function placeholderStats(): TeamStats {
  return {
    form: [],
    avgScored: 0,
    avgConceded: 0,
  };
}
