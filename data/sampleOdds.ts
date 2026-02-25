export type Sport =
  | "football"
  | "basketball"
  | "tennis"
  | "american_football"
  | "cricket";

export interface Bookmaker {
  name: string;
  home: number;
  draw?: number;
  away: number;
}

export interface TeamStats {
  form: ("W" | "D" | "L")[];
  avgScored: number;
  avgConceded: number;
}

export interface H2HStats {
  homeWins: number;
  draws: number;
  awayWins: number;
}

export interface MarketOption {
  label: string;
  probability: number; // 0–100
  pick: boolean;
}

export interface Market {
  name: string;
  options: MarketOption[];
  bestOdds: number;
  bestBookmaker: string;
}

export interface OddsEvent {
  id: string;
  sport: Sport;
  league: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  bookmakers: Bookmaker[];
  homeStats: TeamStats;
  awayStats: TeamStats;
  h2h: H2HStats;
  markets: Market[];
  featured?: boolean;
}

export const SAMPLE_ODDS: OddsEvent[] = [
  {
    id: "evt-001",
    sport: "football",
    league: "Premier League",
    featured: true,
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    commenceTime: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "Bet365", home: 2.1, draw: 3.4, away: 3.2 },
      { name: "William Hill", home: 2.05, draw: 3.5, away: 3.3 },
      { name: "Betfair", home: 2.14, draw: 3.45, away: 3.25 },
    ],
    homeStats: { form: ["W", "W", "D", "L", "W"], avgScored: 2.1, avgConceded: 1.0 },
    awayStats: { form: ["L", "W", "W", "W", "D"], avgScored: 1.8, avgConceded: 1.2 },
    h2h: { homeWins: 3, draws: 1, awayWins: 1 },
    markets: [
      {
        name: "Match Result",
        options: [
          { label: "Arsenal Win", probability: 48, pick: true },
          { label: "Draw", probability: 26, pick: false },
          { label: "Chelsea Win", probability: 26, pick: false },
        ],
        bestOdds: 2.14,
        bestBookmaker: "Betfair",
      },
      {
        name: "Both Teams to Score",
        options: [
          { label: "Yes", probability: 62, pick: true },
          { label: "No", probability: 38, pick: false },
        ],
        bestOdds: 1.72,
        bestBookmaker: "Bet365",
      },
      {
        name: "Over 2.5 Goals",
        options: [
          { label: "Yes", probability: 58, pick: true },
          { label: "No", probability: 42, pick: false },
        ],
        bestOdds: 1.85,
        bestBookmaker: "Betfair",
      },
    ],
  },
  {
    id: "evt-002",
    sport: "football",
    league: "Premier League",
    featured: true,
    homeTeam: "Man City",
    awayTeam: "Liverpool",
    commenceTime: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "Bet365", home: 1.85, draw: 3.6, away: 4.5 },
      { name: "William Hill", home: 1.9, draw: 3.55, away: 4.4 },
      { name: "Betfair", home: 1.87, draw: 3.6, away: 4.6 },
    ],
    homeStats: { form: ["W", "W", "W", "D", "W"], avgScored: 2.6, avgConceded: 0.8 },
    awayStats: { form: ["W", "L", "W", "W", "D"], avgScored: 2.2, avgConceded: 1.1 },
    h2h: { homeWins: 4, draws: 2, awayWins: 2 },
    markets: [
      {
        name: "Match Result",
        options: [
          { label: "Man City Win", probability: 52, pick: true },
          { label: "Draw", probability: 28, pick: false },
          { label: "Liverpool Win", probability: 20, pick: false },
        ],
        bestOdds: 1.9,
        bestBookmaker: "William Hill",
      },
      {
        name: "Both Teams to Score",
        options: [
          { label: "Yes", probability: 55, pick: true },
          { label: "No", probability: 45, pick: false },
        ],
        bestOdds: 1.68,
        bestBookmaker: "Betfair",
      },
      {
        name: "Over 2.5 Goals",
        options: [
          { label: "Yes", probability: 64, pick: true },
          { label: "No", probability: 36, pick: false },
        ],
        bestOdds: 1.79,
        bestBookmaker: "Bet365",
      },
    ],
  },
  {
    id: "evt-003",
    sport: "football",
    league: "La Liga",
    homeTeam: "Real Madrid",
    awayTeam: "Barcelona",
    commenceTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "Bet365", home: 2.3, draw: 3.2, away: 3.1 },
      { name: "William Hill", home: 2.25, draw: 3.25, away: 3.15 },
      { name: "Betfair", home: 2.35, draw: 3.2, away: 3.1 },
    ],
    homeStats: { form: ["W", "D", "W", "W", "L"], avgScored: 2.3, avgConceded: 1.0 },
    awayStats: { form: ["W", "W", "L", "W", "W"], avgScored: 2.4, avgConceded: 0.9 },
    h2h: { homeWins: 3, draws: 2, awayWins: 3 },
    markets: [
      {
        name: "Match Result",
        options: [
          { label: "Real Madrid Win", probability: 38, pick: false },
          { label: "Draw", probability: 28, pick: false },
          { label: "Barcelona Win", probability: 34, pick: true },
        ],
        bestOdds: 3.1,
        bestBookmaker: "Betfair",
      },
      {
        name: "Both Teams to Score",
        options: [
          { label: "Yes", probability: 71, pick: true },
          { label: "No", probability: 29, pick: false },
        ],
        bestOdds: 1.55,
        bestBookmaker: "Bet365",
      },
      {
        name: "Over 2.5 Goals",
        options: [
          { label: "Yes", probability: 68, pick: true },
          { label: "No", probability: 32, pick: false },
        ],
        bestOdds: 1.65,
        bestBookmaker: "William Hill",
      },
    ],
  },
  {
    id: "evt-004",
    sport: "basketball",
    league: "NBA",
    featured: true,
    homeTeam: "LA Lakers",
    awayTeam: "Golden State Warriors",
    commenceTime: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "DraftKings", home: 1.95, away: 1.85 },
      { name: "FanDuel", home: 1.9, away: 1.9 },
      { name: "BetMGM", home: 1.95, away: 1.87 },
    ],
    homeStats: { form: ["W", "L", "W", "W", "L"], avgScored: 112.4, avgConceded: 109.2 },
    awayStats: { form: ["W", "W", "L", "W", "W"], avgScored: 115.6, avgConceded: 111.0 },
    h2h: { homeWins: 3, draws: 0, awayWins: 2 },
    markets: [
      {
        name: "Moneyline",
        options: [
          { label: "Lakers Win", probability: 52, pick: true },
          { label: "Warriors Win", probability: 48, pick: false },
        ],
        bestOdds: 1.95,
        bestBookmaker: "DraftKings",
      },
      {
        name: "Total Points Over 224.5",
        options: [
          { label: "Over", probability: 56, pick: true },
          { label: "Under", probability: 44, pick: false },
        ],
        bestOdds: 1.9,
        bestBookmaker: "FanDuel",
      },
      {
        name: "Spread: Lakers -2.5",
        options: [
          { label: "Lakers Cover", probability: 50, pick: false },
          { label: "Warriors Cover", probability: 50, pick: false },
        ],
        bestOdds: 1.91,
        bestBookmaker: "BetMGM",
      },
    ],
  },
  {
    id: "evt-005",
    sport: "basketball",
    league: "NBA",
    homeTeam: "Boston Celtics",
    awayTeam: "Milwaukee Bucks",
    commenceTime: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "DraftKings", home: 1.75, away: 2.1 },
      { name: "FanDuel", home: 1.72, away: 2.15 },
      { name: "BetMGM", home: 1.78, away: 2.08 },
    ],
    homeStats: { form: ["W", "W", "W", "L", "W"], avgScored: 118.2, avgConceded: 108.5 },
    awayStats: { form: ["L", "W", "L", "W", "W"], avgScored: 114.6, avgConceded: 112.3 },
    h2h: { homeWins: 4, draws: 0, awayWins: 1 },
    markets: [
      {
        name: "Moneyline",
        options: [
          { label: "Celtics Win", probability: 62, pick: true },
          { label: "Bucks Win", probability: 38, pick: false },
        ],
        bestOdds: 1.78,
        bestBookmaker: "BetMGM",
      },
      {
        name: "Total Points Over 221.5",
        options: [
          { label: "Over", probability: 54, pick: true },
          { label: "Under", probability: 46, pick: false },
        ],
        bestOdds: 1.92,
        bestBookmaker: "DraftKings",
      },
      {
        name: "Spread: Celtics -6.5",
        options: [
          { label: "Celtics Cover", probability: 55, pick: true },
          { label: "Bucks Cover", probability: 45, pick: false },
        ],
        bestOdds: 1.88,
        bestBookmaker: "FanDuel",
      },
    ],
  },
  {
    id: "evt-006",
    sport: "tennis",
    league: "ATP Masters",
    featured: true,
    homeTeam: "N. Djokovic",
    awayTeam: "C. Alcaraz",
    commenceTime: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "Bet365", home: 1.45, away: 2.75 },
      { name: "William Hill", home: 1.42, away: 2.8 },
      { name: "Betfair", home: 1.47, away: 2.78 },
    ],
    homeStats: { form: ["W", "W", "L", "W", "W"], avgScored: 1.8, avgConceded: 0.7 },
    awayStats: { form: ["W", "W", "W", "L", "W"], avgScored: 1.9, avgConceded: 0.8 },
    h2h: { homeWins: 4, draws: 0, awayWins: 3 },
    markets: [
      {
        name: "Match Winner",
        options: [
          { label: "Djokovic", probability: 62, pick: true },
          { label: "Alcaraz", probability: 38, pick: false },
        ],
        bestOdds: 1.47,
        bestBookmaker: "Betfair",
      },
      {
        name: "Total Sets Over 3.5",
        options: [
          { label: "Over", probability: 55, pick: true },
          { label: "Under", probability: 45, pick: false },
        ],
        bestOdds: 1.82,
        bestBookmaker: "Bet365",
      },
      {
        name: "First Set Winner",
        options: [
          { label: "Djokovic", probability: 60, pick: true },
          { label: "Alcaraz", probability: 40, pick: false },
        ],
        bestOdds: 1.55,
        bestBookmaker: "William Hill",
      },
    ],
  },
  {
    id: "evt-007",
    sport: "tennis",
    league: "ATP Masters",
    homeTeam: "J. Sinner",
    awayTeam: "D. Medvedev",
    commenceTime: new Date(Date.now() + 7 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "Bet365", home: 1.65, away: 2.3 },
      { name: "William Hill", home: 1.6, away: 2.35 },
      { name: "Betfair", home: 1.67, away: 2.32 },
    ],
    homeStats: { form: ["W", "W", "W", "L", "W"], avgScored: 1.9, avgConceded: 0.6 },
    awayStats: { form: ["L", "W", "W", "W", "W"], avgScored: 1.7, avgConceded: 0.9 },
    h2h: { homeWins: 3, draws: 0, awayWins: 2 },
    markets: [
      {
        name: "Match Winner",
        options: [
          { label: "Sinner", probability: 58, pick: true },
          { label: "Medvedev", probability: 42, pick: false },
        ],
        bestOdds: 1.67,
        bestBookmaker: "Betfair",
      },
      {
        name: "Total Sets Over 3.5",
        options: [
          { label: "Over", probability: 46, pick: false },
          { label: "Under", probability: 54, pick: true },
        ],
        bestOdds: 1.78,
        bestBookmaker: "Bet365",
      },
      {
        name: "First Set Winner",
        options: [
          { label: "Sinner", probability: 55, pick: true },
          { label: "Medvedev", probability: 45, pick: false },
        ],
        bestOdds: 1.62,
        bestBookmaker: "William Hill",
      },
    ],
  },
  {
    id: "evt-008",
    sport: "american_football",
    league: "NFL",
    featured: true,
    homeTeam: "Kansas City Chiefs",
    awayTeam: "Buffalo Bills",
    commenceTime: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "DraftKings", home: 1.7, away: 2.2 },
      { name: "FanDuel", home: 1.72, away: 2.18 },
      { name: "BetMGM", home: 1.68, away: 2.25 },
    ],
    homeStats: { form: ["W", "W", "L", "W", "W"], avgScored: 26.4, avgConceded: 18.2 },
    awayStats: { form: ["W", "W", "W", "L", "W"], avgScored: 28.1, avgConceded: 20.5 },
    h2h: { homeWins: 5, draws: 0, awayWins: 3 },
    markets: [
      {
        name: "Moneyline",
        options: [
          { label: "Chiefs Win", probability: 58, pick: true },
          { label: "Bills Win", probability: 42, pick: false },
        ],
        bestOdds: 1.72,
        bestBookmaker: "FanDuel",
      },
      {
        name: "Total Points Over 47.5",
        options: [
          { label: "Over", probability: 55, pick: true },
          { label: "Under", probability: 45, pick: false },
        ],
        bestOdds: 1.88,
        bestBookmaker: "DraftKings",
      },
      {
        name: "Spread: Chiefs -3.5",
        options: [
          { label: "Chiefs Cover", probability: 54, pick: true },
          { label: "Bills Cover", probability: 46, pick: false },
        ],
        bestOdds: 1.91,
        bestBookmaker: "BetMGM",
      },
    ],
  },
  {
    id: "evt-009",
    sport: "american_football",
    league: "NFL",
    homeTeam: "San Francisco 49ers",
    awayTeam: "Philadelphia Eagles",
    commenceTime: new Date(Date.now() + 50 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "DraftKings", home: 1.8, away: 2.05 },
      { name: "FanDuel", home: 1.78, away: 2.08 },
      { name: "BetMGM", home: 1.82, away: 2.0 },
    ],
    homeStats: { form: ["W", "L", "W", "W", "W"], avgScored: 24.6, avgConceded: 17.8 },
    awayStats: { form: ["W", "W", "L", "W", "L"], avgScored: 22.4, avgConceded: 19.2 },
    h2h: { homeWins: 3, draws: 0, awayWins: 3 },
    markets: [
      {
        name: "Moneyline",
        options: [
          { label: "49ers Win", probability: 54, pick: true },
          { label: "Eagles Win", probability: 46, pick: false },
        ],
        bestOdds: 1.82,
        bestBookmaker: "BetMGM",
      },
      {
        name: "Total Points Over 44.5",
        options: [
          { label: "Over", probability: 58, pick: true },
          { label: "Under", probability: 42, pick: false },
        ],
        bestOdds: 1.85,
        bestBookmaker: "FanDuel",
      },
      {
        name: "Spread: 49ers -2.5",
        options: [
          { label: "49ers Cover", probability: 52, pick: true },
          { label: "Eagles Cover", probability: 48, pick: false },
        ],
        bestOdds: 1.9,
        bestBookmaker: "DraftKings",
      },
    ],
  },
  {
    id: "evt-010",
    sport: "cricket",
    league: "IPL",
    featured: true,
    homeTeam: "Mumbai Indians",
    awayTeam: "Chennai Super Kings",
    commenceTime: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "Bet365", home: 1.9, away: 1.95 },
      { name: "William Hill", home: 1.88, away: 1.98 },
      { name: "Betfair", home: 1.92, away: 1.93 },
    ],
    homeStats: { form: ["W", "L", "W", "W", "W"], avgScored: 8.8, avgConceded: 8.2 },
    awayStats: { form: ["W", "W", "L", "W", "L"], avgScored: 8.5, avgConceded: 8.6 },
    h2h: { homeWins: 4, draws: 0, awayWins: 3 },
    markets: [
      {
        name: "Match Winner",
        options: [
          { label: "Mumbai Indians", probability: 54, pick: true },
          { label: "Chennai Super Kings", probability: 46, pick: false },
        ],
        bestOdds: 1.92,
        bestBookmaker: "Betfair",
      },
      {
        name: "Total Runs Over 170.5",
        options: [
          { label: "Over", probability: 60, pick: true },
          { label: "Under", probability: 40, pick: false },
        ],
        bestOdds: 1.78,
        bestBookmaker: "Bet365",
      },
      {
        name: "First Innings Lead",
        options: [
          { label: "Mumbai Indians", probability: 52, pick: true },
          { label: "Chennai Super Kings", probability: 48, pick: false },
        ],
        bestOdds: 1.88,
        bestBookmaker: "William Hill",
      },
    ],
  },
];

export function getBestOdds(bookmakers: Bookmaker[]): {
  home: { odds: number; bookmaker: string };
  draw?: { odds: number; bookmaker: string };
  away: { odds: number; bookmaker: string };
} {
  const best = {
    home: { odds: 0, bookmaker: "" },
    draw: undefined as { odds: number; bookmaker: string } | undefined,
    away: { odds: 0, bookmaker: "" },
  };

  for (const bm of bookmakers) {
    if (bm.home > best.home.odds) {
      best.home = { odds: bm.home, bookmaker: bm.name };
    }
    if (bm.away > best.away.odds) {
      best.away = { odds: bm.away, bookmaker: bm.name };
    }
    if (bm.draw !== undefined) {
      if (!best.draw || bm.draw > best.draw.odds) {
        best.draw = { odds: bm.draw, bookmaker: bm.name };
      }
    }
  }

  return best;
}
