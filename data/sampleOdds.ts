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

  // ── Extra Football ──────────────────────────────────────────────────────────
  {
    id: "evt-011",
    sport: "football",
    league: "Premier League",
    homeTeam: "Tottenham Hotspur",
    awayTeam: "Manchester United",
    commenceTime: new Date(Date.now() + 26 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "Bet365", home: 2.4, draw: 3.3, away: 2.9 },
      { name: "William Hill", home: 2.35, draw: 3.35, away: 2.95 },
      { name: "Betfair", home: 2.42, draw: 3.3, away: 2.88 },
    ],
    homeStats: { form: ["W", "D", "W", "L", "W"], avgScored: 1.9, avgConceded: 1.3 },
    awayStats: { form: ["L", "L", "W", "D", "W"], avgScored: 1.5, avgConceded: 1.6 },
    h2h: { homeWins: 4, draws: 2, awayWins: 2 },
    markets: [
      {
        name: "Match Result",
        options: [
          { label: "Spurs Win", probability: 42, pick: true },
          { label: "Draw", probability: 26, pick: false },
          { label: "Man Utd Win", probability: 32, pick: false },
        ],
        bestOdds: 2.42,
        bestBookmaker: "Betfair",
      },
      {
        name: "Both Teams to Score",
        options: [
          { label: "Yes", probability: 58, pick: true },
          { label: "No", probability: 42, pick: false },
        ],
        bestOdds: 1.7,
        bestBookmaker: "Bet365",
      },
      {
        name: "Over 2.5 Goals",
        options: [
          { label: "Yes", probability: 52, pick: true },
          { label: "No", probability: 48, pick: false },
        ],
        bestOdds: 1.9,
        bestBookmaker: "William Hill",
      },
    ],
  },
  {
    id: "evt-012",
    sport: "football",
    league: "La Liga",
    homeTeam: "Atletico Madrid",
    awayTeam: "Sevilla",
    commenceTime: new Date(Date.now() + 28 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "Bet365", home: 1.75, draw: 3.5, away: 4.8 },
      { name: "William Hill", home: 1.72, draw: 3.55, away: 4.9 },
      { name: "Betfair", home: 1.78, draw: 3.48, away: 4.75 },
    ],
    homeStats: { form: ["W", "W", "D", "W", "W"], avgScored: 1.8, avgConceded: 0.7 },
    awayStats: { form: ["L", "D", "W", "L", "D"], avgScored: 1.1, avgConceded: 1.5 },
    h2h: { homeWins: 6, draws: 2, awayWins: 1 },
    markets: [
      {
        name: "Match Result",
        options: [
          { label: "Atletico Win", probability: 58, pick: true },
          { label: "Draw", probability: 26, pick: false },
          { label: "Sevilla Win", probability: 16, pick: false },
        ],
        bestOdds: 1.78,
        bestBookmaker: "Betfair",
      },
      {
        name: "Both Teams to Score",
        options: [
          { label: "Yes", probability: 44, pick: false },
          { label: "No", probability: 56, pick: true },
        ],
        bestOdds: 1.65,
        bestBookmaker: "Bet365",
      },
      {
        name: "Under 2.5 Goals",
        options: [
          { label: "Yes", probability: 58, pick: true },
          { label: "No", probability: 42, pick: false },
        ],
        bestOdds: 1.72,
        bestBookmaker: "William Hill",
      },
    ],
  },
  {
    id: "evt-013",
    sport: "football",
    league: "Bundesliga",
    featured: true,
    homeTeam: "Bayern Munich",
    awayTeam: "Borussia Dortmund",
    commenceTime: new Date(Date.now() + 30 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "Bet365", home: 1.6, draw: 3.8, away: 5.5 },
      { name: "William Hill", home: 1.58, draw: 3.85, away: 5.6 },
      { name: "Betfair", home: 1.62, draw: 3.78, away: 5.5 },
    ],
    homeStats: { form: ["W", "W", "W", "W", "D"], avgScored: 3.1, avgConceded: 0.9 },
    awayStats: { form: ["W", "L", "W", "D", "L"], avgScored: 2.0, avgConceded: 1.8 },
    h2h: { homeWins: 7, draws: 1, awayWins: 2 },
    markets: [
      {
        name: "Match Result",
        options: [
          { label: "Bayern Win", probability: 64, pick: true },
          { label: "Draw", probability: 21, pick: false },
          { label: "Dortmund Win", probability: 15, pick: false },
        ],
        bestOdds: 1.62,
        bestBookmaker: "Betfair",
      },
      {
        name: "Both Teams to Score",
        options: [
          { label: "Yes", probability: 65, pick: true },
          { label: "No", probability: 35, pick: false },
        ],
        bestOdds: 1.6,
        bestBookmaker: "Bet365",
      },
      {
        name: "Over 3.5 Goals",
        options: [
          { label: "Yes", probability: 60, pick: true },
          { label: "No", probability: 40, pick: false },
        ],
        bestOdds: 1.75,
        bestBookmaker: "Betfair",
      },
    ],
  },
  {
    id: "evt-014",
    sport: "football",
    league: "Ligue 1",
    homeTeam: "PSG",
    awayTeam: "Olympique Marseille",
    commenceTime: new Date(Date.now() + 32 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "Bet365", home: 1.55, draw: 3.9, away: 6.0 },
      { name: "William Hill", home: 1.52, draw: 3.95, away: 6.2 },
      { name: "Betfair", home: 1.57, draw: 3.88, away: 5.9 },
    ],
    homeStats: { form: ["W", "W", "W", "W", "W"], avgScored: 3.4, avgConceded: 0.8 },
    awayStats: { form: ["D", "W", "L", "W", "D"], avgScored: 1.6, avgConceded: 1.4 },
    h2h: { homeWins: 8, draws: 3, awayWins: 2 },
    markets: [
      {
        name: "Match Result",
        options: [
          { label: "PSG Win", probability: 68, pick: true },
          { label: "Draw", probability: 20, pick: false },
          { label: "Marseille Win", probability: 12, pick: false },
        ],
        bestOdds: 1.57,
        bestBookmaker: "Betfair",
      },
      {
        name: "Over 2.5 Goals",
        options: [
          { label: "Yes", probability: 70, pick: true },
          { label: "No", probability: 30, pick: false },
        ],
        bestOdds: 1.58,
        bestBookmaker: "Bet365",
      },
      {
        name: "PSG to Score First",
        options: [
          { label: "Yes", probability: 72, pick: true },
          { label: "No", probability: 28, pick: false },
        ],
        bestOdds: 1.4,
        bestBookmaker: "William Hill",
      },
    ],
  },
  {
    id: "evt-015",
    sport: "football",
    league: "Serie A",
    homeTeam: "Juventus",
    awayTeam: "Inter Milan",
    commenceTime: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "Bet365", home: 2.6, draw: 3.1, away: 2.7 },
      { name: "William Hill", home: 2.55, draw: 3.15, away: 2.75 },
      { name: "Betfair", home: 2.62, draw: 3.1, away: 2.68 },
    ],
    homeStats: { form: ["W", "D", "L", "W", "W"], avgScored: 1.6, avgConceded: 1.1 },
    awayStats: { form: ["W", "W", "W", "D", "W"], avgScored: 2.1, avgConceded: 0.8 },
    h2h: { homeWins: 3, draws: 4, awayWins: 3 },
    markets: [
      {
        name: "Match Result",
        options: [
          { label: "Juventus Win", probability: 36, pick: false },
          { label: "Draw", probability: 28, pick: false },
          { label: "Inter Win", probability: 36, pick: true },
        ],
        bestOdds: 2.68,
        bestBookmaker: "Betfair",
      },
      {
        name: "Both Teams to Score",
        options: [
          { label: "Yes", probability: 55, pick: true },
          { label: "No", probability: 45, pick: false },
        ],
        bestOdds: 1.75,
        bestBookmaker: "Bet365",
      },
      {
        name: "Under 2.5 Goals",
        options: [
          { label: "Yes", probability: 54, pick: true },
          { label: "No", probability: 46, pick: false },
        ],
        bestOdds: 1.82,
        bestBookmaker: "William Hill",
      },
    ],
  },

  // ── Extra Basketball ─────────────────────────────────────────────────────────
  {
    id: "evt-016",
    sport: "basketball",
    league: "NBA",
    featured: true,
    homeTeam: "Miami Heat",
    awayTeam: "New York Knicks",
    commenceTime: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "DraftKings", home: 1.85, away: 2.0 },
      { name: "FanDuel", home: 1.88, away: 1.96 },
      { name: "BetMGM", home: 1.83, away: 2.02 },
    ],
    homeStats: { form: ["W", "W", "L", "W", "W"], avgScored: 110.6, avgConceded: 106.4 },
    awayStats: { form: ["W", "L", "W", "W", "L"], avgScored: 108.2, avgConceded: 107.8 },
    h2h: { homeWins: 3, draws: 0, awayWins: 2 },
    markets: [
      {
        name: "Moneyline",
        options: [
          { label: "Heat Win", probability: 54, pick: true },
          { label: "Knicks Win", probability: 46, pick: false },
        ],
        bestOdds: 1.88,
        bestBookmaker: "FanDuel",
      },
      {
        name: "Total Points Over 215.5",
        options: [
          { label: "Over", probability: 50, pick: false },
          { label: "Under", probability: 50, pick: false },
        ],
        bestOdds: 1.91,
        bestBookmaker: "DraftKings",
      },
      {
        name: "Spread: Heat -2.5",
        options: [
          { label: "Heat Cover", probability: 52, pick: true },
          { label: "Knicks Cover", probability: 48, pick: false },
        ],
        bestOdds: 1.9,
        bestBookmaker: "BetMGM",
      },
    ],
  },
  {
    id: "evt-017",
    sport: "basketball",
    league: "NBA",
    homeTeam: "Denver Nuggets",
    awayTeam: "Phoenix Suns",
    commenceTime: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "DraftKings", home: 1.65, away: 2.35 },
      { name: "FanDuel", home: 1.68, away: 2.3 },
      { name: "BetMGM", home: 1.62, away: 2.38 },
    ],
    homeStats: { form: ["W", "W", "W", "L", "W"], avgScored: 117.8, avgConceded: 110.2 },
    awayStats: { form: ["L", "W", "L", "W", "L"], avgScored: 109.4, avgConceded: 115.6 },
    h2h: { homeWins: 4, draws: 0, awayWins: 1 },
    markets: [
      {
        name: "Moneyline",
        options: [
          { label: "Nuggets Win", probability: 62, pick: true },
          { label: "Suns Win", probability: 38, pick: false },
        ],
        bestOdds: 1.68,
        bestBookmaker: "FanDuel",
      },
      {
        name: "Total Points Over 228.5",
        options: [
          { label: "Over", probability: 55, pick: true },
          { label: "Under", probability: 45, pick: false },
        ],
        bestOdds: 1.88,
        bestBookmaker: "DraftKings",
      },
      {
        name: "Spread: Nuggets -6.5",
        options: [
          { label: "Nuggets Cover", probability: 56, pick: true },
          { label: "Suns Cover", probability: 44, pick: false },
        ],
        bestOdds: 1.9,
        bestBookmaker: "BetMGM",
      },
    ],
  },
  {
    id: "evt-018",
    sport: "basketball",
    league: "NBA",
    homeTeam: "LA Clippers",
    awayTeam: "Dallas Mavericks",
    commenceTime: new Date(Date.now() + 14 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "DraftKings", home: 2.1, away: 1.78 },
      { name: "FanDuel", home: 2.08, away: 1.8 },
      { name: "BetMGM", home: 2.12, away: 1.76 },
    ],
    homeStats: { form: ["L", "W", "L", "W", "W"], avgScored: 111.0, avgConceded: 112.4 },
    awayStats: { form: ["W", "W", "W", "L", "W"], avgScored: 116.2, avgConceded: 109.8 },
    h2h: { homeWins: 2, draws: 0, awayWins: 3 },
    markets: [
      {
        name: "Moneyline",
        options: [
          { label: "Clippers Win", probability: 44, pick: false },
          { label: "Mavericks Win", probability: 56, pick: true },
        ],
        bestOdds: 1.8,
        bestBookmaker: "FanDuel",
      },
      {
        name: "Total Points Over 220.5",
        options: [
          { label: "Over", probability: 53, pick: true },
          { label: "Under", probability: 47, pick: false },
        ],
        bestOdds: 1.92,
        bestBookmaker: "BetMGM",
      },
      {
        name: "Spread: Mavericks -4.5",
        options: [
          { label: "Mavericks Cover", probability: 54, pick: true },
          { label: "Clippers Cover", probability: 46, pick: false },
        ],
        bestOdds: 1.91,
        bestBookmaker: "DraftKings",
      },
    ],
  },
  {
    id: "evt-019",
    sport: "basketball",
    league: "NBA",
    homeTeam: "Philadelphia 76ers",
    awayTeam: "Atlanta Hawks",
    commenceTime: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "DraftKings", home: 1.55, away: 2.55 },
      { name: "FanDuel", home: 1.58, away: 2.5 },
      { name: "BetMGM", home: 1.52, away: 2.6 },
    ],
    homeStats: { form: ["W", "W", "D", "W", "W"], avgScored: 116.4, avgConceded: 108.6 },
    awayStats: { form: ["L", "L", "W", "L", "W"], avgScored: 111.2, avgConceded: 116.0 },
    h2h: { homeWins: 5, draws: 0, awayWins: 1 },
    markets: [
      {
        name: "Moneyline",
        options: [
          { label: "76ers Win", probability: 66, pick: true },
          { label: "Hawks Win", probability: 34, pick: false },
        ],
        bestOdds: 1.58,
        bestBookmaker: "FanDuel",
      },
      {
        name: "Total Points Over 226.5",
        options: [
          { label: "Over", probability: 58, pick: true },
          { label: "Under", probability: 42, pick: false },
        ],
        bestOdds: 1.87,
        bestBookmaker: "DraftKings",
      },
      {
        name: "Spread: 76ers -8.5",
        options: [
          { label: "76ers Cover", probability: 53, pick: true },
          { label: "Hawks Cover", probability: 47, pick: false },
        ],
        bestOdds: 1.9,
        bestBookmaker: "BetMGM",
      },
    ],
  },

  // ── Extra Tennis ─────────────────────────────────────────────────────────────
  {
    id: "evt-020",
    sport: "tennis",
    league: "ATP Masters",
    featured: true,
    homeTeam: "A. Zverev",
    awayTeam: "A. Rublev",
    commenceTime: new Date(Date.now() + 9 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "Bet365", home: 1.55, away: 2.5 },
      { name: "William Hill", home: 1.52, away: 2.55 },
      { name: "Betfair", home: 1.57, away: 2.48 },
    ],
    homeStats: { form: ["W", "W", "L", "W", "W"], avgScored: 1.85, avgConceded: 0.75 },
    awayStats: { form: ["W", "L", "W", "W", "L"], avgScored: 1.7, avgConceded: 1.0 },
    h2h: { homeWins: 5, draws: 0, awayWins: 2 },
    markets: [
      {
        name: "Match Winner",
        options: [
          { label: "Zverev", probability: 60, pick: true },
          { label: "Rublev", probability: 40, pick: false },
        ],
        bestOdds: 1.57,
        bestBookmaker: "Betfair",
      },
      {
        name: "Total Sets Over 3.5",
        options: [
          { label: "Over", probability: 48, pick: false },
          { label: "Under", probability: 52, pick: true },
        ],
        bestOdds: 1.8,
        bestBookmaker: "Bet365",
      },
      {
        name: "First Set Winner",
        options: [
          { label: "Zverev", probability: 58, pick: true },
          { label: "Rublev", probability: 42, pick: false },
        ],
        bestOdds: 1.6,
        bestBookmaker: "William Hill",
      },
    ],
  },
  {
    id: "evt-021",
    sport: "tennis",
    league: "ATP Masters",
    homeTeam: "T. Fritz",
    awayTeam: "C. Ruud",
    commenceTime: new Date(Date.now() + 11 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "Bet365", home: 1.8, away: 2.05 },
      { name: "William Hill", home: 1.78, away: 2.08 },
      { name: "Betfair", home: 1.82, away: 2.02 },
    ],
    homeStats: { form: ["W", "L", "W", "W", "W"], avgScored: 1.75, avgConceded: 0.85 },
    awayStats: { form: ["L", "W", "W", "L", "W"], avgScored: 1.65, avgConceded: 1.1 },
    h2h: { homeWins: 3, draws: 0, awayWins: 3 },
    markets: [
      {
        name: "Match Winner",
        options: [
          { label: "Fritz", probability: 52, pick: true },
          { label: "Ruud", probability: 48, pick: false },
        ],
        bestOdds: 1.82,
        bestBookmaker: "Betfair",
      },
      {
        name: "Total Sets Over 3.5",
        options: [
          { label: "Over", probability: 50, pick: false },
          { label: "Under", probability: 50, pick: false },
        ],
        bestOdds: 1.88,
        bestBookmaker: "Bet365",
      },
      {
        name: "First Set Winner",
        options: [
          { label: "Fritz", probability: 54, pick: true },
          { label: "Ruud", probability: 46, pick: false },
        ],
        bestOdds: 1.78,
        bestBookmaker: "William Hill",
      },
    ],
  },
  {
    id: "evt-022",
    sport: "tennis",
    league: "ATP Masters",
    homeTeam: "S. Tsitsipas",
    awayTeam: "H. Hurkacz",
    commenceTime: new Date(Date.now() + 13 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "Bet365", home: 1.7, away: 2.2 },
      { name: "William Hill", home: 1.68, away: 2.25 },
      { name: "Betfair", home: 1.72, away: 2.18 },
    ],
    homeStats: { form: ["L", "W", "W", "W", "L"], avgScored: 1.72, avgConceded: 0.95 },
    awayStats: { form: ["W", "W", "L", "W", "W"], avgScored: 1.8, avgConceded: 0.8 },
    h2h: { homeWins: 4, draws: 0, awayWins: 3 },
    markets: [
      {
        name: "Match Winner",
        options: [
          { label: "Tsitsipas", probability: 56, pick: true },
          { label: "Hurkacz", probability: 44, pick: false },
        ],
        bestOdds: 1.72,
        bestBookmaker: "Betfair",
      },
      {
        name: "Total Sets Over 3.5",
        options: [
          { label: "Over", probability: 52, pick: true },
          { label: "Under", probability: 48, pick: false },
        ],
        bestOdds: 1.85,
        bestBookmaker: "Bet365",
      },
      {
        name: "First Set Winner",
        options: [
          { label: "Tsitsipas", probability: 55, pick: true },
          { label: "Hurkacz", probability: 45, pick: false },
        ],
        bestOdds: 1.7,
        bestBookmaker: "William Hill",
      },
    ],
  },
  {
    id: "evt-023",
    sport: "tennis",
    league: "WTA Tour",
    homeTeam: "I. Swiatek",
    awayTeam: "A. Sabalenka",
    commenceTime: new Date(Date.now() + 15 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "Bet365", home: 1.5, away: 2.6 },
      { name: "William Hill", home: 1.48, away: 2.65 },
      { name: "Betfair", home: 1.52, away: 2.58 },
    ],
    homeStats: { form: ["W", "W", "W", "W", "L"], avgScored: 2.0, avgConceded: 0.5 },
    awayStats: { form: ["W", "L", "W", "W", "W"], avgScored: 1.9, avgConceded: 0.7 },
    h2h: { homeWins: 6, draws: 0, awayWins: 2 },
    markets: [
      {
        name: "Match Winner",
        options: [
          { label: "Swiatek", probability: 64, pick: true },
          { label: "Sabalenka", probability: 36, pick: false },
        ],
        bestOdds: 1.52,
        bestBookmaker: "Betfair",
      },
      {
        name: "Total Sets Over 2.5",
        options: [
          { label: "Over", probability: 45, pick: false },
          { label: "Under", probability: 55, pick: true },
        ],
        bestOdds: 1.75,
        bestBookmaker: "Bet365",
      },
      {
        name: "First Set Winner",
        options: [
          { label: "Swiatek", probability: 65, pick: true },
          { label: "Sabalenka", probability: 35, pick: false },
        ],
        bestOdds: 1.48,
        bestBookmaker: "William Hill",
      },
    ],
  },

  // ── Extra American Football ──────────────────────────────────────────────────
  {
    id: "evt-024",
    sport: "american_football",
    league: "NFL",
    featured: true,
    homeTeam: "Baltimore Ravens",
    awayTeam: "Cincinnati Bengals",
    commenceTime: new Date(Date.now() + 52 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "DraftKings", home: 1.62, away: 2.4 },
      { name: "FanDuel", home: 1.65, away: 2.35 },
      { name: "BetMGM", home: 1.6, away: 2.45 },
    ],
    homeStats: { form: ["W", "W", "W", "D", "W"], avgScored: 28.6, avgConceded: 17.4 },
    awayStats: { form: ["L", "W", "W", "L", "W"], avgScored: 24.2, avgConceded: 22.8 },
    h2h: { homeWins: 4, draws: 1, awayWins: 3 },
    markets: [
      {
        name: "Moneyline",
        options: [
          { label: "Ravens Win", probability: 62, pick: true },
          { label: "Bengals Win", probability: 38, pick: false },
        ],
        bestOdds: 1.65,
        bestBookmaker: "FanDuel",
      },
      {
        name: "Total Points Over 45.5",
        options: [
          { label: "Over", probability: 56, pick: true },
          { label: "Under", probability: 44, pick: false },
        ],
        bestOdds: 1.9,
        bestBookmaker: "DraftKings",
      },
      {
        name: "Spread: Ravens -5.5",
        options: [
          { label: "Ravens Cover", probability: 54, pick: true },
          { label: "Bengals Cover", probability: 46, pick: false },
        ],
        bestOdds: 1.92,
        bestBookmaker: "BetMGM",
      },
    ],
  },
  {
    id: "evt-025",
    sport: "american_football",
    league: "NFL",
    homeTeam: "Dallas Cowboys",
    awayTeam: "New York Giants",
    commenceTime: new Date(Date.now() + 54 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "DraftKings", home: 1.55, away: 2.55 },
      { name: "FanDuel", home: 1.58, away: 2.5 },
      { name: "BetMGM", home: 1.52, away: 2.6 },
    ],
    homeStats: { form: ["W", "W", "L", "W", "W"], avgScored: 27.4, avgConceded: 20.6 },
    awayStats: { form: ["L", "L", "W", "L", "D"], avgScored: 18.2, avgConceded: 26.4 },
    h2h: { homeWins: 7, draws: 0, awayWins: 3 },
    markets: [
      {
        name: "Moneyline",
        options: [
          { label: "Cowboys Win", probability: 66, pick: true },
          { label: "Giants Win", probability: 34, pick: false },
        ],
        bestOdds: 1.58,
        bestBookmaker: "FanDuel",
      },
      {
        name: "Total Points Over 41.5",
        options: [
          { label: "Over", probability: 54, pick: true },
          { label: "Under", probability: 46, pick: false },
        ],
        bestOdds: 1.88,
        bestBookmaker: "BetMGM",
      },
      {
        name: "Spread: Cowboys -9.5",
        options: [
          { label: "Cowboys Cover", probability: 52, pick: true },
          { label: "Giants Cover", probability: 48, pick: false },
        ],
        bestOdds: 1.91,
        bestBookmaker: "DraftKings",
      },
    ],
  },
  {
    id: "evt-026",
    sport: "american_football",
    league: "NFL",
    homeTeam: "Green Bay Packers",
    awayTeam: "Chicago Bears",
    commenceTime: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "DraftKings", home: 1.68, away: 2.28 },
      { name: "FanDuel", home: 1.7, away: 2.25 },
      { name: "BetMGM", home: 1.65, away: 2.32 },
    ],
    homeStats: { form: ["W", "D", "W", "W", "L"], avgScored: 23.8, avgConceded: 19.6 },
    awayStats: { form: ["L", "W", "L", "L", "W"], avgScored: 18.6, avgConceded: 24.2 },
    h2h: { homeWins: 8, draws: 2, awayWins: 4 },
    markets: [
      {
        name: "Moneyline",
        options: [
          { label: "Packers Win", probability: 60, pick: true },
          { label: "Bears Win", probability: 40, pick: false },
        ],
        bestOdds: 1.7,
        bestBookmaker: "FanDuel",
      },
      {
        name: "Total Points Over 43.5",
        options: [
          { label: "Over", probability: 52, pick: true },
          { label: "Under", probability: 48, pick: false },
        ],
        bestOdds: 1.92,
        bestBookmaker: "DraftKings",
      },
      {
        name: "Spread: Packers -5.5",
        options: [
          { label: "Packers Cover", probability: 55, pick: true },
          { label: "Bears Cover", probability: 45, pick: false },
        ],
        bestOdds: 1.9,
        bestBookmaker: "BetMGM",
      },
    ],
  },
  {
    id: "evt-027",
    sport: "american_football",
    league: "NFL",
    homeTeam: "Los Angeles Rams",
    awayTeam: "Seattle Seahawks",
    commenceTime: new Date(Date.now() + 74 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "DraftKings", home: 1.78, away: 2.1 },
      { name: "FanDuel", home: 1.75, away: 2.14 },
      { name: "BetMGM", home: 1.8, away: 2.07 },
    ],
    homeStats: { form: ["W", "W", "L", "W", "D"], avgScored: 25.2, avgConceded: 21.4 },
    awayStats: { form: ["D", "W", "W", "L", "W"], avgScored: 22.8, avgConceded: 22.0 },
    h2h: { homeWins: 3, draws: 1, awayWins: 4 },
    markets: [
      {
        name: "Moneyline",
        options: [
          { label: "Rams Win", probability: 54, pick: true },
          { label: "Seahawks Win", probability: 46, pick: false },
        ],
        bestOdds: 1.8,
        bestBookmaker: "BetMGM",
      },
      {
        name: "Total Points Over 46.5",
        options: [
          { label: "Over", probability: 50, pick: false },
          { label: "Under", probability: 50, pick: false },
        ],
        bestOdds: 1.91,
        bestBookmaker: "DraftKings",
      },
      {
        name: "Spread: Rams -3.5",
        options: [
          { label: "Rams Cover", probability: 51, pick: true },
          { label: "Seahawks Cover", probability: 49, pick: false },
        ],
        bestOdds: 1.9,
        bestBookmaker: "FanDuel",
      },
    ],
  },

  // ── Extra Cricket ─────────────────────────────────────────────────────────────
  {
    id: "evt-028",
    sport: "cricket",
    league: "IPL",
    featured: true,
    homeTeam: "Kolkata Knight Riders",
    awayTeam: "Delhi Capitals",
    commenceTime: new Date(Date.now() + 20 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "Bet365", home: 1.85, away: 2.0 },
      { name: "William Hill", home: 1.82, away: 2.05 },
      { name: "Betfair", home: 1.87, away: 1.98 },
    ],
    homeStats: { form: ["W", "W", "L", "W", "W"], avgScored: 9.0, avgConceded: 8.1 },
    awayStats: { form: ["L", "W", "W", "L", "W"], avgScored: 8.4, avgConceded: 8.8 },
    h2h: { homeWins: 5, draws: 0, awayWins: 3 },
    markets: [
      {
        name: "Match Winner",
        options: [
          { label: "Kolkata Knight Riders", probability: 55, pick: true },
          { label: "Delhi Capitals", probability: 45, pick: false },
        ],
        bestOdds: 1.87,
        bestBookmaker: "Betfair",
      },
      {
        name: "Total Runs Over 168.5",
        options: [
          { label: "Over", probability: 62, pick: true },
          { label: "Under", probability: 38, pick: false },
        ],
        bestOdds: 1.75,
        bestBookmaker: "Bet365",
      },
      {
        name: "First Innings Lead",
        options: [
          { label: "Kolkata Knight Riders", probability: 54, pick: true },
          { label: "Delhi Capitals", probability: 46, pick: false },
        ],
        bestOdds: 1.85,
        bestBookmaker: "William Hill",
      },
    ],
  },
  {
    id: "evt-029",
    sport: "cricket",
    league: "IPL",
    homeTeam: "Royal Challengers Bangalore",
    awayTeam: "Punjab Kings",
    commenceTime: new Date(Date.now() + 44 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "Bet365", home: 1.78, away: 2.1 },
      { name: "William Hill", home: 1.75, away: 2.15 },
      { name: "Betfair", home: 1.8, away: 2.08 },
    ],
    homeStats: { form: ["L", "W", "W", "W", "L"], avgScored: 8.6, avgConceded: 9.0 },
    awayStats: { form: ["W", "L", "L", "W", "W"], avgScored: 8.2, avgConceded: 8.5 },
    h2h: { homeWins: 6, draws: 0, awayWins: 4 },
    markets: [
      {
        name: "Match Winner",
        options: [
          { label: "Royal Challengers Bangalore", probability: 56, pick: true },
          { label: "Punjab Kings", probability: 44, pick: false },
        ],
        bestOdds: 1.8,
        bestBookmaker: "Betfair",
      },
      {
        name: "Total Runs Over 165.5",
        options: [
          { label: "Over", probability: 58, pick: true },
          { label: "Under", probability: 42, pick: false },
        ],
        bestOdds: 1.8,
        bestBookmaker: "Bet365",
      },
      {
        name: "First Innings Lead",
        options: [
          { label: "Royal Challengers Bangalore", probability: 53, pick: true },
          { label: "Punjab Kings", probability: 47, pick: false },
        ],
        bestOdds: 1.88,
        bestBookmaker: "William Hill",
      },
    ],
  },
  {
    id: "evt-030",
    sport: "cricket",
    league: "IPL",
    homeTeam: "Rajasthan Royals",
    awayTeam: "Sunrisers Hyderabad",
    commenceTime: new Date(Date.now() + 68 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "Bet365", home: 2.0, away: 1.88 },
      { name: "William Hill", home: 1.98, away: 1.9 },
      { name: "Betfair", home: 2.02, away: 1.86 },
    ],
    homeStats: { form: ["D", "W", "L", "W", "W"], avgScored: 8.4, avgConceded: 8.3 },
    awayStats: { form: ["W", "W", "W", "L", "W"], avgScored: 9.2, avgConceded: 8.0 },
    h2h: { homeWins: 3, draws: 0, awayWins: 5 },
    markets: [
      {
        name: "Match Winner",
        options: [
          { label: "Rajasthan Royals", probability: 46, pick: false },
          { label: "Sunrisers Hyderabad", probability: 54, pick: true },
        ],
        bestOdds: 1.9,
        bestBookmaker: "William Hill",
      },
      {
        name: "Total Runs Over 172.5",
        options: [
          { label: "Over", probability: 64, pick: true },
          { label: "Under", probability: 36, pick: false },
        ],
        bestOdds: 1.7,
        bestBookmaker: "Bet365",
      },
      {
        name: "First Innings Lead",
        options: [
          { label: "Rajasthan Royals", probability: 47, pick: false },
          { label: "Sunrisers Hyderabad", probability: 53, pick: true },
        ],
        bestOdds: 1.9,
        bestBookmaker: "Betfair",
      },
    ],
  },
  {
    id: "evt-031",
    sport: "cricket",
    league: "IPL",
    homeTeam: "Gujarat Titans",
    awayTeam: "Lucknow Super Giants",
    commenceTime: new Date(Date.now() + 92 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "Bet365", home: 1.95, away: 1.93 },
      { name: "William Hill", home: 1.92, away: 1.96 },
      { name: "Betfair", home: 1.97, away: 1.91 },
    ],
    homeStats: { form: ["W", "L", "W", "W", "D"], avgScored: 8.7, avgConceded: 8.4 },
    awayStats: { form: ["W", "W", "L", "W", "L"], avgScored: 8.5, avgConceded: 8.6 },
    h2h: { homeWins: 2, draws: 0, awayWins: 2 },
    markets: [
      {
        name: "Match Winner",
        options: [
          { label: "Gujarat Titans", probability: 52, pick: true },
          { label: "Lucknow Super Giants", probability: 48, pick: false },
        ],
        bestOdds: 1.97,
        bestBookmaker: "Betfair",
      },
      {
        name: "Total Runs Over 167.5",
        options: [
          { label: "Over", probability: 56, pick: true },
          { label: "Under", probability: 44, pick: false },
        ],
        bestOdds: 1.82,
        bestBookmaker: "Bet365",
      },
      {
        name: "First Innings Lead",
        options: [
          { label: "Gujarat Titans", probability: 51, pick: true },
          { label: "Lucknow Super Giants", probability: 49, pick: false },
        ],
        bestOdds: 1.94,
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
