import type { Sport } from "./sampleOdds";

export type Zone = "champions" | "europa" | "playoff" | "relegation" | null;

export interface StandingsRow {
  position: number;
  teamId?: string;
  playerId?: string;
  name: string;
  stats: (string | number)[];
  form?: ("W" | "D" | "L")[];
  zone?: Zone;
}

export interface StandingsGroup {
  label?: string;
  rows: StandingsRow[];
}

export interface TopPerformer {
  name: string;
  teamName: string;
  teamId?: string;
  playerId?: string;
  value: number | string;
  extra?: string;
}

export interface TopPerformerSection {
  label: string;
  unit: string;
  entries: TopPerformer[];
}

export interface OverviewStat {
  label: string;
  value: string | number;
  sub?: string;
}

export interface LeagueProfile {
  id: string;
  name: string;
  sport: Sport;
  country: string;
  season: string;
  columnHeaders: string[];
  groups: StandingsGroup[];
  topPerformers?: TopPerformerSection[];
  overview?: OverviewStat[];
}

// Maps league display names to API-Football numeric league IDs
export const LEAGUE_NAME_TO_ID: Record<string, number> = {
  "Premier League":           39,
  "La Liga":                  140,
  "Serie A":                  135,
  "Bundesliga":               78,
  "Ligue 1":                  61,
  "UEFA Champions League":    2,
  "UEFA Europa League":       3,
  "Championship":             40,
  "Eredivisie":               88,
  "Primeira Liga":            94,
};

export function getLeagueHref(name: string): string | null {
  const id = LEAGUE_NAME_TO_ID[name];
  return id ? `/leagues/${id}` : null;
}

export const SAMPLE_LEAGUES: LeagueProfile[] = [
  // ─── PREMIER LEAGUE ──────────────────────────────────────────────────────
  {
    id: "league-pl",
    name: "Premier League",
    sport: "football",
    country: "England",
    season: "2023/24",
    columnHeaders: ["P", "W", "D", "L", "GF", "GA", "GD", "Pts"],
    groups: [
      {
        rows: [
          { position:  1, teamId: "team-man-city",    name: "Man City",         stats: [28,20, 5, 3,67,28,"+39",65], form: ["W","W","W","D","W"], zone: "champions" },
          { position:  2, teamId: "team-arsenal",     name: "Arsenal",          stats: [28,18, 6, 4,56,32,"+24",60], form: ["W","W","D","L","W"], zone: "champions" },
          { position:  3, teamId: "team-liverpool",   name: "Liverpool",        stats: [28,17, 6, 5,62,36,"+26",57], form: ["W","L","W","W","D"], zone: "champions" },
          { position:  4,                             name: "Aston Villa",      stats: [28,16, 4, 8,61,43,"+18",52], form: ["W","D","W","L","W"], zone: "champions" },
          { position:  5,                             name: "Tottenham",        stats: [28,14, 5, 9,61,55, "+6",47], form: ["L","W","D","W","W"], zone: "europa" },
          { position:  6, teamId: "team-chelsea",     name: "Chelsea",          stats: [28,12, 7, 9,44,40,  "+4",43], form: ["L","W","W","W","D"], zone: "europa" },
          { position:  7,                             name: "Newcastle",        stats: [28,12, 7, 9,43,38,  "+5",43], form: ["W","D","L","W","W"] },
          { position:  8,                             name: "Brighton",         stats: [28, 9, 5,14,48,57,  "-9",32], form: ["L","L","W","D","W"] },
          { position:  9,                             name: "West Ham",         stats: [28, 9, 5,14,34,52, "-18",32], form: ["L","D","W","L","W"] },
          { position: 10,                             name: "Crystal Palace",   stats: [28, 9, 3,16,35,52, "-17",30], form: ["W","L","D","L","D"] },
          { position: 11,                             name: "Brentford",        stats: [28, 8, 5,15,42,57, "-15",29], form: ["W","L","W","D","L"] },
          { position: 12,                             name: "Fulham",           stats: [28, 8, 4,16,38,56, "-18",28], form: ["D","W","L","L","W"] },
          { position: 13,                             name: "Wolves",           stats: [28, 7, 6,15,36,55, "-19",27], form: ["L","D","W","D","L"] },
          { position: 14,                             name: "Man Utd",          stats: [28, 7, 5,16,28,48, "-20",26], form: ["L","W","L","D","L"] },
          { position: 15,                             name: "Everton",          stats: [28, 7, 4,17,26,47, "-21",25], form: ["D","L","D","W","L"] },
          { position: 16,                             name: "Bournemouth",      stats: [28, 6, 6,16,32,53, "-21",24], form: ["W","L","D","L","D"] },
          { position: 17,                             name: "Nottm Forest",     stats: [28, 5, 8,15,27,48, "-21",23], form: ["D","D","L","W","D"] },
          { position: 18,                             name: "Luton Town",       stats: [28, 5, 3,20,34,69, "-35",18], form: ["L","L","W","L","L"], zone: "relegation" },
          { position: 19,                             name: "Burnley",          stats: [28, 3, 5,20,25,62, "-37",14], form: ["L","D","L","L","L"], zone: "relegation" },
          { position: 20,                             name: "Sheffield Utd",    stats: [28, 2, 3,23,18,73, "-55", 9], form: ["L","L","D","L","L"], zone: "relegation" },
        ],
      },
    ],
    topPerformers: [
      {
        label: "Top Scorers",
        unit: "Goals",
        entries: [
          { name: "Erling Haaland",    teamName: "Man City",  teamId: "team-man-city",  playerId: "p-haaland",     value: 27 },
          { name: "Cole Palmer",       teamName: "Chelsea",   teamId: "team-chelsea",   playerId: "p-palmer",      value: 18 },
          { name: "Mohamed Salah",     teamName: "Liverpool", teamId: "team-liverpool", playerId: "p-salah",       value: 18 },
          { name: "Phil Foden",        teamName: "Man City",  teamId: "team-man-city",  playerId: "p-foden",       value: 15 },
          { name: "Bukayo Saka",       teamName: "Arsenal",   teamId: "team-arsenal",   playerId: "p-saka",        value: 14 },
        ],
      },
      {
        label: "Top Assisters",
        unit: "Assists",
        entries: [
          { name: "Kevin De Bruyne",        teamName: "Man City",  teamId: "team-man-city",  playerId: "p-debruyne", value: 14 },
          { name: "Mohamed Salah",          teamName: "Liverpool", teamId: "team-liverpool", playerId: "p-salah",    value: 12 },
          { name: "Bukayo Saka",            teamName: "Arsenal",   teamId: "team-arsenal",   playerId: "p-saka",     value: 11 },
          { name: "Trent Alexander-Arnold", teamName: "Liverpool", teamId: "team-liverpool", playerId: "p-taa",      value: 10 },
          { name: "Declan Rice",            teamName: "Arsenal",   teamId: "team-arsenal",   playerId: "p-rice",     value: 8 },
        ],
      },
    ],
    overview: [
      { label: "Total Goals",      value: "1,082", sub: "280 games played" },
      { label: "Goals / Game",     value: "2.74" },
      { label: "Season Progress",  value: "74%",   sub: "28 of 38 matchdays" },
      { label: "Clean Sheets",     value: 84 },
      { label: "Yellow Cards",     value: 924 },
      { label: "Red Cards",        value: 42 },
      { label: "Penalties Awarded",value: 48 },
      { label: "Avg Attendance",   value: "40,214" },
    ],
  },

  // ─── LA LIGA ─────────────────────────────────────────────────────────────
  {
    id: "league-laliga",
    name: "La Liga",
    sport: "football",
    country: "Spain",
    season: "2023/24",
    columnHeaders: ["P", "W", "D", "L", "GF", "GA", "GD", "Pts"],
    groups: [
      {
        rows: [
          { position:  1, teamId: "team-real-madrid", name: "Real Madrid",      stats: [27,18, 4, 5,64,30,"+34",58], form: ["W","D","W","W","L"], zone: "champions" },
          { position:  2, teamId: "team-barcelona",   name: "Barcelona",        stats: [27,17, 4, 6,61,35,"+26",55], form: ["W","W","L","W","W"], zone: "champions" },
          { position:  3,                             name: "Atletico Madrid",  stats: [27,16, 5, 6,48,28,"+20",53], form: ["W","W","D","L","W"], zone: "champions" },
          { position:  4,                             name: "Athletic Bilbao",  stats: [27,13, 3,11,42,36, "+6",42], form: ["W","L","W","D","W"], zone: "champions" },
          { position:  5,                             name: "Real Sociedad",    stats: [27,11, 5,11,38,36, "+2",38], form: ["D","W","L","W","D"], zone: "europa" },
          { position:  6,                             name: "Real Betis",       stats: [27,10, 6,11,40,44,  "-4",36], form: ["L","W","W","D","W"], zone: "europa" },
          { position:  7,                             name: "Valencia",         stats: [27, 9, 6,12,34,42,  "-8",33], form: ["D","L","W","D","L"] },
          { position:  8,                             name: "Villarreal",       stats: [27, 9, 5,13,37,44,  "-7",32], form: ["W","L","D","L","W"] },
          { position:  9,                             name: "Getafe",           stats: [27, 8, 6,13,27,38, "-11",30], form: ["W","D","L","W","L"] },
          { position: 10,                             name: "Osasuna",          stats: [27, 8, 5,14,33,48, "-15",29], form: ["L","W","D","L","D"] },
          { position: 11,                             name: "Rayo Vallecano",   stats: [27, 7, 7,13,29,42, "-13",28], form: ["D","W","L","D","W"] },
          { position: 12,                             name: "Sevilla",          stats: [27, 7, 6,14,30,46, "-16",27], form: ["L","D","W","L","L"] },
          { position: 13,                             name: "Celta Vigo",       stats: [27, 7, 5,15,31,49, "-18",26], form: ["W","L","L","W","D"] },
          { position: 14,                             name: "Cadiz",            stats: [27, 6, 7,14,29,46, "-17",25], form: ["D","L","D","W","L"] },
          { position: 15,                             name: "Girona",           stats: [27,14, 5, 8,60,44, "+16",47], form: ["W","D","W","W","L"] },
          { position: 16,                             name: "Las Palmas",       stats: [27, 6, 5,16,24,47, "-23",23], form: ["L","D","L","L","W"] },
          { position: 17,                             name: "Mallorca",         stats: [27, 5, 7,15,22,44, "-22",22], form: ["D","D","L","W","D"] },
          { position: 18,                             name: "Granada",          stats: [27, 3, 5,19,24,60, "-36",14], form: ["L","L","D","L","L"], zone: "relegation" },
          { position: 19,                             name: "Almeria",          stats: [27, 3, 4,20,22,65, "-43",13], form: ["L","L","L","D","L"], zone: "relegation" },
          { position: 20,                             name: "Deportivo Alaves", stats: [27, 3, 3,21,21,62, "-41",12], form: ["L","D","L","L","L"], zone: "relegation" },
        ],
      },
    ],
    topPerformers: [
      {
        label: "Top Scorers",
        unit: "Goals",
        entries: [
          { name: "Robert Lewandowski", teamName: "Barcelona",   teamId: "team-barcelona",   playerId: "p-lewandowski", value: 20 },
          { name: "Jude Bellingham",    teamName: "Real Madrid",  teamId: "team-real-madrid", playerId: "p-bellingham",  value: 19 },
          { name: "Vinicius Jr.",       teamName: "Real Madrid",  teamId: "team-real-madrid", playerId: "p-vinicius",    value: 16 },
          { name: "Raphinha",           teamName: "Barcelona",    teamId: "team-barcelona",   playerId: "p-raphinha",    value: 14 },
          { name: "Lamine Yamal",       teamName: "Barcelona",    teamId: "team-barcelona",   playerId: "p-yamal",       value: 9 },
        ],
      },
    ],
    overview: [
      { label: "Total Goals",      value: "1,012", sub: "270 games played" },
      { label: "Goals / Game",     value: "2.82" },
      { label: "Season Progress",  value: "71%",   sub: "27 of 38 matchdays" },
      { label: "Clean Sheets",     value: 71 },
      { label: "Yellow Cards",     value: 1124 },
      { label: "Red Cards",        value: 68 },
      { label: "Penalties Awarded",value: 52 },
      { label: "Avg Attendance",   value: "36,580" },
    ],
  },

  // ─── NBA ─────────────────────────────────────────────────────────────────
  {
    id: "league-nba",
    name: "NBA",
    sport: "basketball",
    country: "USA",
    season: "2023/24",
    columnHeaders: ["W", "L", "PCT", "GB", "Home", "Away", "Streak"],
    groups: [
      {
        label: "Eastern Conference",
        rows: [
          { position: 1, teamId: "team-celtics",  name: "Boston Celtics",         stats: [35, 14, ".714",  "—",  "19-5", "16-9",  "W3"], zone: "champions" },
          { position: 2,                          name: "Cleveland Cavaliers",     stats: [34, 15, ".694",  "1",  "18-7", "16-8",  "W1"], zone: "champions" },
          { position: 3,                          name: "New York Knicks",         stats: [31, 17, ".646",  "3.5","18-7", "13-10", "L1"], zone: "champions" },
          { position: 4,                          name: "Orlando Magic",           stats: [29, 20, ".592",  "6",  "16-8", "13-12", "W2"], zone: "champions" },
          { position: 5,                          name: "Indiana Pacers",          stats: [27, 21, ".563",  "7.5","14-9", "13-12", "W1"], zone: "playoff" },
          { position: 6, teamId: "team-bucks",   name: "Milwaukee Bucks",         stats: [22, 27, ".449", "13",  "13-12","9-15",  "W2"], zone: "playoff" },
          { position: 7,                          name: "Miami Heat",              stats: [21, 28, ".429", "14",  "12-13","9-15",  "L2"], zone: "playoff" },
          { position: 8,                          name: "Philadelphia 76ers",      stats: [19, 30, ".388", "16",  "11-14","8-16",  "W1"], zone: "playoff" },
        ],
      },
      {
        label: "Western Conference",
        rows: [
          { position: 1,                           name: "OKC Thunder",            stats: [37, 10, ".787",  "—",  "21-4", "16-6",  "W4"], zone: "champions" },
          { position: 2,                           name: "Denver Nuggets",         stats: [34, 13, ".723",  "3",  "19-5", "15-8",  "W2"], zone: "champions" },
          { position: 3,                           name: "Minnesota Timberwolves", stats: [33, 14, ".702",  "4",  "18-6", "15-8",  "L1"], zone: "champions" },
          { position: 4,                           name: "LA Clippers",            stats: [30, 18, ".625",  "7.5","17-7", "13-11", "W1"], zone: "champions" },
          { position: 5, teamId: "team-lakers",   name: "LA Lakers",              stats: [28, 21, ".571",  "9.5","16-8", "12-13", "L2"], zone: "playoff" },
          { position: 6, teamId: "team-warriors", name: "Golden State Warriors",  stats: [26, 23, ".531", "11.5","15-10","11-13", "W2"], zone: "playoff" },
          { position: 7,                           name: "Phoenix Suns",           stats: [24, 24, ".500", "13.5","14-11","10-13", "L1"], zone: "playoff" },
          { position: 8,                           name: "Sacramento Kings",       stats: [22, 26, ".458", "15.5","13-11","9-15",  "W1"], zone: "playoff" },
        ],
      },
    ],
    topPerformers: [
      {
        label: "Points Per Game",
        unit: "PPG",
        entries: [
          { name: "Giannis Antetokounmpo", teamName: "Milwaukee Bucks",       teamId: "team-bucks",    playerId: "p-giannis", value: 30.4 },
          { name: "Jayson Tatum",          teamName: "Boston Celtics",        teamId: "team-celtics",  playerId: "p-jtatum",  value: 26.9 },
          { name: "Stephen Curry",         teamName: "Golden State Warriors", teamId: "team-warriors", playerId: "p-curry",   value: 26.8 },
          { name: "LeBron James",          teamName: "LA Lakers",             teamId: "team-lakers",   playerId: "p-lebron",  value: 25.7 },
          { name: "Jaylen Brown",          teamName: "Boston Celtics",        teamId: "team-celtics",  playerId: "p-jbrown",  value: 23.0 },
        ],
      },
    ],
    overview: [
      { label: "Games Played",    value: 815,     sub: "~47 per team" },
      { label: "Avg Pts / Game",  value: "114.2", sub: "combined" },
      { label: "Avg Margin",      value: "8.4 pts" },
      { label: "Overtime Games",  value: 38 },
      { label: "Triple-Doubles",  value: 142 },
      { label: "40-Point Games",  value: 87 },
      { label: "Best Win %",      value: ".787",  sub: "OKC Thunder" },
      { label: "Season Progress", value: "57%",   sub: "of 82 games" },
    ],
  },

  // ─── NFL ─────────────────────────────────────────────────────────────────
  {
    id: "league-nfl",
    name: "NFL",
    sport: "american_football",
    country: "USA",
    season: "2023/24",
    columnHeaders: ["W", "L", "T", "PCT", "PF", "PA", "Diff"],
    groups: [
      {
        label: "AFC",
        rows: [
          { position: 1, teamId: "team-chiefs", name: "Kansas City Chiefs",    stats: [10, 3, 0, ".769", 336, 228,"+108"], zone: "champions" },
          { position: 2,                        name: "Baltimore Ravens",       stats: [10, 3, 0, ".769", 334, 225,"+109"], zone: "champions" },
          { position: 3, teamId: "team-bills",  name: "Buffalo Bills",         stats: [ 9, 4, 0, ".692", 347, 248, "+99"], zone: "champions" },
          { position: 4,                        name: "Houston Texans",        stats: [ 8, 5, 0, ".615", 298, 278, "+20"], zone: "champions" },
          { position: 5,                        name: "Miami Dolphins",        stats: [ 7, 6, 0, ".538", 302, 282, "+20"], zone: "playoff" },
          { position: 6,                        name: "Indianapolis Colts",    stats: [ 6, 7, 0, ".462", 264, 271,  "-7"], zone: "playoff" },
          { position: 7,                        name: "Pittsburgh Steelers",   stats: [ 6, 7, 0, ".462", 228, 249, "-21"], zone: "playoff" },
          { position: 8,                        name: "Cleveland Browns",      stats: [ 5, 8, 0, ".385", 248, 276, "-28"] },
        ],
      },
      {
        label: "NFC",
        rows: [
          { position: 1, teamId: "team-49ers",  name: "San Francisco 49ers",   stats: [ 9, 4, 0, ".692", 318, 236, "+82"], zone: "champions" },
          { position: 2, teamId: "team-eagles", name: "Philadelphia Eagles",   stats: [ 9, 4, 0, ".692", 312, 258, "+54"], zone: "champions" },
          { position: 3,                        name: "Detroit Lions",         stats: [ 9, 4, 0, ".692", 336, 262, "+74"], zone: "champions" },
          { position: 4,                        name: "Green Bay Packers",     stats: [ 7, 6, 0, ".538", 282, 276,  "+6"], zone: "champions" },
          { position: 5,                        name: "Dallas Cowboys",        stats: [ 7, 5, 0, ".583", 300, 252, "+48"], zone: "playoff" },
          { position: 6,                        name: "LA Rams",               stats: [ 7, 6, 0, ".538", 278, 270,  "+8"], zone: "playoff" },
          { position: 7,                        name: "Washington Commanders", stats: [ 4, 9, 0, ".308", 248, 312, "-64"], zone: "playoff" },
          { position: 8,                        name: "Chicago Bears",         stats: [ 4, 9, 0, ".308", 228, 324, "-96"] },
        ],
      },
    ],
    topPerformers: [
      {
        label: "Passing Yards",
        unit: "Yds",
        entries: [
          { name: "Patrick Mahomes",     teamName: "Kansas City Chiefs",  teamId: "team-chiefs",  playerId: "p-mahomes",    value: 3724 },
          { name: "Josh Allen",          teamName: "Buffalo Bills",       teamId: "team-bills",   playerId: "p-jallen",     value: 3428 },
          { name: "Brock Purdy",         teamName: "San Francisco 49ers", teamId: "team-49ers",   playerId: "p-bpurdy",     value: 3156 },
          { name: "Jalen Hurts",         teamName: "Philadelphia Eagles", teamId: "team-eagles",  playerId: "p-jhurts",     value: 2974 },
        ],
      },
      {
        label: "Rushing Yards",
        unit: "Yds",
        entries: [
          { name: "Christian McCaffrey", teamName: "San Francisco 49ers", teamId: "team-49ers",  playerId: "p-cmccaffrey", value: 1062 },
          { name: "James Cook",          teamName: "Buffalo Bills",       teamId: "team-bills",  playerId: "p-jcook",      value: 904 },
          { name: "D'Andre Swift",       teamName: "Philadelphia Eagles", teamId: "team-eagles", playerId: "p-daswift",    value: 878 },
          { name: "Isiah Pacheco",       teamName: "Kansas City Chiefs",  teamId: "team-chiefs", playerId: "p-ipacheco",   value: 842 },
        ],
      },
    ],
    overview: [
      { label: "Games Played",     value: 208,    sub: "of 272 regular season" },
      { label: "Avg Pts / Game",   value: "24.1", sub: "per team" },
      { label: "Total Touchdowns", value: 1204 },
      { label: "Overtime Games",   value: 12 },
      { label: "Shutouts",         value: 8 },
      { label: "100-Yd Rushers",   value: 64 },
      { label: "300-Yd Passers",   value: 82 },
      { label: "Season Progress",  value: "76%",  sub: "13 of 17 weeks" },
    ],
  },

  // ─── IPL ─────────────────────────────────────────────────────────────────
  {
    id: "league-ipl",
    name: "IPL",
    sport: "cricket",
    country: "India",
    season: "2024",
    columnHeaders: ["M", "W", "L", "NR", "Pts", "NRR"],
    groups: [
      {
        rows: [
          { position: 1,                        name: "Rajasthan Royals",      stats: [12, 8, 4, 0, 16, "+0.845"], zone: "champions" },
          { position: 2,                        name: "Kolkata Knight Riders", stats: [12, 8, 4, 0, 16, "+0.611"], zone: "champions" },
          { position: 3, teamId: "team-mumbai", name: "Mumbai Indians",        stats: [12, 7, 5, 0, 14, "+0.432"], zone: "champions" },
          { position: 4,                        name: "Sunrisers Hyderabad",   stats: [12, 7, 5, 0, 14, "+0.212"], zone: "champions" },
          { position: 5, teamId: "team-csk",    name: "Chennai Super Kings",   stats: [12, 6, 6, 0, 12, "+0.098"] },
          { position: 6,                        name: "Delhi Capitals",        stats: [12, 5, 7, 0, 10, "-0.214"] },
          { position: 7,                        name: "Lucknow Super Giants",  stats: [12, 4, 8, 0,  8, "-0.345"] },
          { position: 8,                        name: "Punjab Kings",          stats: [12, 4, 8, 0,  8, "-0.432"] },
          { position: 9,                        name: "Gujarat Titans",        stats: [12, 4, 8, 0,  8, "-0.521"] },
          { position: 10,                       name: "Royal Challengers",     stats: [12, 3, 9, 0,  6, "-0.876"] },
        ],
      },
    ],
    topPerformers: [
      {
        label: "Leading Run Scorers",
        unit: "Runs",
        entries: [
          { name: "Suryakumar Yadav", teamName: "Mumbai Indians",     teamId: "team-mumbai", playerId: "p-sky",       value: 524 },
          { name: "Ruturaj Gaikwad",  teamName: "Chennai Super Kings",teamId: "team-csk",    playerId: "p-rgaikwad",  value: 484 },
          { name: "Rohit Sharma",     teamName: "Mumbai Indians",     teamId: "team-mumbai", playerId: "p-rohit",     value: 412 },
          { name: "Devon Conway",     teamName: "Chennai Super Kings",teamId: "team-csk",    playerId: "p-dconway",   value: 396 },
          { name: "Tilak Varma",      teamName: "Mumbai Indians",     teamId: "team-mumbai", playerId: "p-tvarma",    value: 304 },
        ],
      },
      {
        label: "Leading Wicket Takers",
        unit: "Wkts",
        entries: [
          { name: "Jasprit Bumrah",   teamName: "Mumbai Indians",     teamId: "team-mumbai", playerId: "p-bumrah",    value: 18 },
          { name: "Deepak Chahar",    teamName: "Chennai Super Kings",teamId: "team-csk",    playerId: "p-dchahar",   value: 14 },
          { name: "Tushar Deshpande", teamName: "Chennai Super Kings",teamId: "team-csk",    playerId: "p-tdeshpande",value: 11 },
          { name: "Ravindra Jadeja",  teamName: "Chennai Super Kings",teamId: "team-csk",    playerId: "p-rjadeja",   value: 12 },
          { name: "Hardik Pandya",    teamName: "Mumbai Indians",     teamId: "team-mumbai", playerId: "p-hpandya",   value: 9 },
        ],
      },
    ],
    overview: [
      { label: "Matches Played",  value: 60,       sub: "of 74 total" },
      { label: "Total Runs",      value: "16,284" },
      { label: "Sixes Hit",       value: 892 },
      { label: "Fours Hit",       value: 2148 },
      { label: "Wickets Taken",   value: 524 },
      { label: "Highest Score",   value: "277/3",  sub: "SRH vs MI" },
      { label: "Lowest Score",    value: "58 AO",  sub: "RCB vs KKR" },
      { label: "Avg Run Rate",    value: "9.2",    sub: "runs per over" },
    ],
  },

  // ─── ATP TOUR ─────────────────────────────────────────────────────────────
  {
    id: "league-atp",
    name: "ATP Masters",
    sport: "tennis",
    country: "International",
    season: "2024",
    columnHeaders: ["Ranking", "Points", "W", "L", "Win %"],
    groups: [
      {
        rows: [
          { position:  1, playerId: "athlete-sinner",   name: "Jannik Sinner",    stats: [1, 10740, 52,  9, "85%"], zone: "champions" },
          { position:  2, playerId: "athlete-alcaraz",  name: "Carlos Alcaraz",   stats: [2,  9255, 48, 11, "81%"], zone: "champions" },
          { position:  3, playerId: "athlete-djokovic", name: "Novak Djokovic",   stats: [3,  8780, 46, 10, "82%"] },
          { position:  4, playerId: "athlete-medvedev", name: "Daniil Medvedev",  stats: [4,  6545, 40, 14, "74%"] },
          { position:  5,                               name: "Alexander Zverev", stats: [5,  6320, 38, 14, "73%"] },
          { position:  6,                               name: "Andrey Rublev",    stats: [6,  4760, 36, 18, "67%"] },
          { position:  7,                               name: "Hubert Hurkacz",   stats: [7,  4610, 34, 17, "67%"] },
          { position:  8,                               name: "Casper Ruud",      stats: [8,  3840, 30, 18, "63%"] },
          { position:  9,                               name: "Grigor Dimitrov",  stats: [9,  3640, 28, 17, "62%"] },
          { position: 10,                               name: "Taylor Fritz",     stats: [10, 3480, 27, 18, "60%"] },
        ],
      },
    ],
    overview: [
      { label: "Season Tournaments", value: 18,       sub: "Masters + Grand Slams" },
      { label: "World No. 1",        value: "Sinner", sub: "10,740 pts" },
      { label: "Most Titles",        value: "Sinner", sub: "4 titles in 2024" },
      { label: "Best Win %",         value: "85%",    sub: "Sinner (52-9)" },
      { label: "Longest Streak",     value: "W16",    sub: "Alcaraz" },
      { label: "H2H Leader",         value: "5-4",    sub: "Sinner vs Alcaraz" },
    ],
  },
];
