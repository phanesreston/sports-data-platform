// Re-export core types from sampleOdds so the rest of the app
// can import from a single place as we migrate to live data.
export type {
  Sport,
  OddsEvent,
  Bookmaker,
  TeamStats,
  H2HStats,
  Market,
  MarketOption,
} from "@/data/sampleOdds";

// ─── API-Sports raw response shapes ───────────────────────────────────────────

export interface ApiSportsFixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string };
  };
  league: {
    id: number;
    name: string;
    country: string;
  };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
}

export interface ApiSportsTeamStats {
  team: { id: number; name: string };
  form: string; // e.g. "WWDLW"
  goals: {
    for: { average: { total: string } };
    against: { average: { total: string } };
  };
}

export interface ApiSportsH2H {
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

// ─── The Odds API raw response shapes ─────────────────────────────────────────

export interface OddsApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsApiBookmaker[];
}

export interface OddsApiBookmaker {
  key: string;
  title: string;
  markets: OddsApiMarket[];
}

export interface OddsApiMarket {
  key: string; // "h2h", "spreads", "totals"
  outcomes: OddsApiOutcome[];
}

export interface OddsApiOutcome {
  name: string;
  price: number;
  point?: number;
}
