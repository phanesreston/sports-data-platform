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

// ─── API-Football standard response wrapper ────────────────────────────────────
// Every endpoint returns this exact shape. response[] contains the actual data.

export interface ApiFootballResponse<T> {
  get: string;
  parameters: Record<string, string | number>;
  errors: string[] | Record<string, string>;
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: T[];
}

// ─── /fixtures response shape ─────────────────────────────────────────────────

export interface ApiFixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;         // ISO 8601 with offset
    timestamp: number;    // UTC unix timestamp
    status: {
      long: string;
      short: string;      // NS, 1H, HT, 2H, ET, P, FT, AET, PEN, PST, CANC, SUSP
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    round: string;
  };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score: {
    halftime:  { home: number | null; away: number | null };
    fulltime:  { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty:   { home: number | null; away: number | null };
  };
}

// ─── /teams/statistics response shape ─────────────────────────────────────────
// NOTE: this endpoint returns a SINGLE object (not an array) in response[0].

export interface ApiTeamStatistics {
  team: { id: number; name: string; logo: string };
  league: { id: number; name: string; country: string; logo: string; season: number };
  form: string; // e.g. "WWDLW" — most recent results, right = most recent
  fixtures: {
    played: { home: number; away: number; total: number };
    wins:   { home: number; away: number; total: number };
    draws:  { home: number; away: number; total: number };
    loses:  { home: number; away: number; total: number };
  };
  goals: {
    for: {
      total:   { home: number; away: number; total: number };
      average: { home: string; away: string; total: string }; // string e.g. "1.6"
    };
    against: {
      total:   { home: number; away: number; total: number };
      average: { home: string; away: string; total: string };
    };
  };
  biggest: {
    wins:  { home: string | null; away: string | null }; // e.g. "3-0"
    loses: { home: string | null; away: string | null };
    goals: {
      for:     { home: number; away: number };
      against: { home: number; away: number };
    };
  };
  clean_sheet:    { home: number; away: number; total: number };
  failed_to_score: { home: number; away: number; total: number };
}

// ─── /predictions response shape ──────────────────────────────────────────────

export interface ApiPrediction {
  predictions: {
    winner: { id: number | null; name: string | null; comment: string } | null;
    win_or_draw: boolean;
    under_over: string | null; // e.g. "Under 2.5"
    goals: { home: string; away: string }; // string floats e.g. "1.5"
    advice: string;
    percent: { home: string; draw: string; away: string }; // e.g. "65%"
  };
  comparison: {
    form:        { home: string; away: string };
    att:         { home: string; away: string };
    def:         { home: string; away: string };
    poisson_distribution: { home: string; away: string };
    h2h:         { home: string; away: string };
    goals:       { home: string; away: string };
    total:       { home: string; away: string };
  };
  h2h: ApiFixture[]; // last few H2H fixtures bundled in the response
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
