import { integer, real, text, sqliteTable, primaryKey, index } from "drizzle-orm/sqlite-core";

// ── leagues ────────────────────────────────────────────────────────────────────
// One row per API-Football league we track (39=EPL, 140=La Liga, etc.)

export const leagues = sqliteTable("leagues", {
  id:        integer("id").primaryKey(),   // API-Football league id
  name:      text("name").notNull(),
  country:   text("country").notNull(),
  logo:      text("logo").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// ── teams ──────────────────────────────────────────────────────────────────────

export const teams = sqliteTable("teams", {
  id:        integer("id").primaryKey(),   // API-Football team id
  name:      text("name").notNull(),
  country:   text("country").notNull(),
  logo:      text("logo").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// ── league_teams ───────────────────────────────────────────────────────────────
// Which teams play in which league in a given season.

export const leagueTeams = sqliteTable("league_teams", {
  leagueId: integer("league_id").notNull().references(() => leagues.id),
  teamId:   integer("team_id").notNull().references(() => teams.id),
  season:   integer("season").notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.leagueId, t.teamId, t.season] }),
}));

// ── players ────────────────────────────────────────────────────────────────────

export const players = sqliteTable("players", {
  id:          integer("id").primaryKey(),  // API-Football player id
  name:        text("name").notNull(),
  nationality: text("nationality"),
  photo:       text("photo"),
  updatedAt:   integer("updated_at").notNull(),
}, (t) => ({
  nameIdx: index("players_name_idx").on(t.name),
}));

// ── squads ─────────────────────────────────────────────────────────────────────
// A player's squad membership: which team, which season, shirt number, position.

export const squads = sqliteTable("squads", {
  teamId:   integer("team_id").notNull().references(() => teams.id),
  playerId: integer("player_id").notNull().references(() => players.id),
  season:   integer("season").notNull(),
  number:   integer("number"),
  position: text("position"),
}, (t) => ({
  pk:       primaryKey({ columns: [t.teamId, t.playerId, t.season] }),
  teamIdx:  index("squads_team_idx").on(t.teamId, t.season),
}));

// ── fixtures ───────────────────────────────────────────────────────────────────

export const fixtures = sqliteTable("fixtures", {
  id:         integer("id").primaryKey(),   // API-Football fixture id
  leagueId:   integer("league_id").notNull().references(() => leagues.id),
  season:     integer("season").notNull(),
  round:      text("round"),
  date:       text("date").notNull(),       // ISO 8601
  timestamp:  integer("timestamp").notNull(),
  status:     text("status").notNull(),     // NS, 1H, HT, FT, AET, PEN, PST, CANC …
  homeTeamId: integer("home_team_id").notNull().references(() => teams.id),
  awayTeamId: integer("away_team_id").notNull().references(() => teams.id),
  homeGoals:  integer("home_goals"),
  awayGoals:  integer("away_goals"),
  updatedAt:  integer("updated_at").notNull(),
}, (t) => ({
  leagueSeasonIdx: index("fixtures_league_season_idx").on(t.leagueId, t.season),
  teamsIdx:        index("fixtures_teams_idx").on(t.homeTeamId, t.awayTeamId),
  timestampIdx:    index("fixtures_timestamp_idx").on(t.timestamp),
}));

// ── fixture_player_stats ───────────────────────────────────────────────────────
// Per-player per-fixture statistics fetched from /fixtures/players.

export const fixturePlayerStats = sqliteTable("fixture_player_stats", {
  fixtureId:  integer("fixture_id").notNull().references(() => fixtures.id),
  playerId:   integer("player_id").notNull().references(() => players.id),
  teamId:     integer("team_id").notNull().references(() => teams.id),
  minutes:    integer("minutes").notNull().default(0),
  rating:     real("rating"),
  goals:      integer("goals").notNull().default(0),
  assists:    integer("assists").notNull().default(0),
  shotsOn:    integer("shots_on").notNull().default(0),
  shotsTotal: integer("shots_total").notNull().default(0),
  keyPasses:  integer("key_passes").notNull().default(0),
  yellowCards: integer("yellow_cards").notNull().default(0),
  redCards:   integer("red_cards").notNull().default(0),
}, (t) => ({
  pk:         primaryKey({ columns: [t.fixtureId, t.playerId] }),
  playerIdx:  index("fps_player_idx").on(t.playerId),
  fixtureIdx: index("fps_fixture_idx").on(t.fixtureId),
}));

// ── TypeScript inferred types ──────────────────────────────────────────────────

export type League            = typeof leagues.$inferSelect;
export type Team              = typeof teams.$inferSelect;
export type Player            = typeof players.$inferSelect;
export type Squad             = typeof squads.$inferSelect;
export type Fixture           = typeof fixtures.$inferSelect;
export type FixturePlayerStat = typeof fixturePlayerStats.$inferSelect;
