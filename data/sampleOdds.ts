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

export interface OddsEvent {
  id: string;
  sport: Sport;
  league: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string; // ISO string
  bookmakers: Bookmaker[];
}

export const SAMPLE_ODDS: OddsEvent[] = [
  {
    id: "evt-001",
    sport: "football",
    league: "Premier League",
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    commenceTime: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "Bet365", home: 2.1, draw: 3.4, away: 3.2 },
      { name: "William Hill", home: 2.05, draw: 3.5, away: 3.3 },
      { name: "Betfair", home: 2.14, draw: 3.45, away: 3.25 },
    ],
  },
  {
    id: "evt-002",
    sport: "football",
    league: "Premier League",
    homeTeam: "Man City",
    awayTeam: "Liverpool",
    commenceTime: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "Bet365", home: 1.85, draw: 3.6, away: 4.5 },
      { name: "William Hill", home: 1.9, draw: 3.55, away: 4.4 },
      { name: "Betfair", home: 1.87, draw: 3.6, away: 4.6 },
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
  },
  {
    id: "evt-004",
    sport: "basketball",
    league: "NBA",
    homeTeam: "LA Lakers",
    awayTeam: "Golden State Warriors",
    commenceTime: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "DraftKings", home: 1.95, away: 1.85 },
      { name: "FanDuel", home: 1.9, away: 1.9 },
      { name: "BetMGM", home: 1.95, away: 1.87 },
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
  },
  {
    id: "evt-006",
    sport: "tennis",
    league: "ATP Masters",
    homeTeam: "N. Djokovic",
    awayTeam: "C. Alcaraz",
    commenceTime: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "Bet365", home: 1.45, away: 2.75 },
      { name: "William Hill", home: 1.42, away: 2.8 },
      { name: "Betfair", home: 1.47, away: 2.78 },
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
  },
  {
    id: "evt-008",
    sport: "american_football",
    league: "NFL",
    homeTeam: "Kansas City Chiefs",
    awayTeam: "Buffalo Bills",
    commenceTime: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "DraftKings", home: 1.7, away: 2.2 },
      { name: "FanDuel", home: 1.72, away: 2.18 },
      { name: "BetMGM", home: 1.68, away: 2.25 },
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
  },
  {
    id: "evt-010",
    sport: "cricket",
    league: "IPL",
    homeTeam: "Mumbai Indians",
    awayTeam: "Chennai Super Kings",
    commenceTime: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
    bookmakers: [
      { name: "Bet365", home: 1.9, away: 1.95 },
      { name: "William Hill", home: 1.88, away: 1.98 },
      { name: "Betfair", home: 1.92, away: 1.93 },
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
