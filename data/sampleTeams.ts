import type { Sport } from "./sampleOdds";

export interface TeamPlayer {
  id: string;
  name: string;
  position: string;
  positionFull: string;
  number: number;
  nationality: string;
  age: number;
  keyStats: { label: string; value: string | number }[];
}

export interface SquadGroup {
  label: string;
  players: TeamPlayer[];
}

export interface PastResult {
  opponent: string;
  result: "W" | "D" | "L";
  score: string;
  date: string;
  competition: string;
  home: boolean;
}

export interface TeamProfile {
  id: string;
  name: string;
  sport: Sport;
  league: string;
  country: string;
  founded: number;
  venue: string;
  manager: string;
  form: ("W" | "D" | "L")[];
  seasonStats: { label: string; value: string | number }[];
  squad: SquadGroup[];
  pastResults: PastResult[];
}

/** Maps the exact team/athlete names used in sampleOdds to entity pages */
export const ENTITY_MAP: Record<string, { id: string; type: "team" | "athlete" }> = {
  Arsenal: { id: "team-arsenal", type: "team" },
  Chelsea: { id: "team-chelsea", type: "team" },
  "Man City": { id: "team-man-city", type: "team" },
  Liverpool: { id: "team-liverpool", type: "team" },
  "Real Madrid": { id: "team-real-madrid", type: "team" },
  Barcelona: { id: "team-barcelona", type: "team" },
  "LA Lakers": { id: "team-lakers", type: "team" },
  "Golden State Warriors": { id: "team-warriors", type: "team" },
  "Boston Celtics": { id: "team-celtics", type: "team" },
  "Milwaukee Bucks": { id: "team-bucks", type: "team" },
  "Kansas City Chiefs": { id: "team-chiefs", type: "team" },
  "Buffalo Bills": { id: "team-bills", type: "team" },
  "San Francisco 49ers": { id: "team-49ers", type: "team" },
  "Philadelphia Eagles": { id: "team-eagles", type: "team" },
  "Mumbai Indians": { id: "team-mumbai", type: "team" },
  "Chennai Super Kings": { id: "team-csk", type: "team" },
  "N. Djokovic": { id: "athlete-djokovic", type: "athlete" },
  "C. Alcaraz": { id: "athlete-alcaraz", type: "athlete" },
  "J. Sinner": { id: "athlete-sinner", type: "athlete" },
  "D. Medvedev": { id: "athlete-medvedev", type: "athlete" },
};

export function getEntityHref(name: string): string | null {
  const entity = ENTITY_MAP[name];
  if (!entity) return null;
  return entity.type === "team" ? `/teams/${entity.id}` : `/athletes/${entity.id}`;
}

export const SAMPLE_TEAMS: TeamProfile[] = [
  // ─── PREMIER LEAGUE ──────────────────────────────────────────────────────
  {
    id: "team-arsenal",
    name: "Arsenal",
    sport: "football",
    league: "Premier League",
    country: "England",
    founded: 1886,
    venue: "Emirates Stadium",
    manager: "Mikel Arteta",
    form: ["W", "W", "D", "L", "W"],
    seasonStats: [
      { label: "Played", value: 28 },
      { label: "Won", value: 18 },
      { label: "Drawn", value: 6 },
      { label: "Lost", value: 4 },
      { label: "Goals For", value: 56 },
      { label: "Goals Against", value: 32 },
      { label: "Points", value: 60 },
      { label: "Position", value: "2nd" },
    ],
    squad: [
      {
        label: "Goalkeepers",
        players: [
          { id: "p-raya", name: "David Raya", position: "GK", positionFull: "Goalkeeper", number: 22, nationality: "Spain", age: 28, keyStats: [{ label: "Clean Sheets", value: 9 }, { label: "Save %", value: "78%" }] },
          { id: "p-hein", name: "Karl Hein", position: "GK", positionFull: "Goalkeeper", number: 32, nationality: "Estonia", age: 22, keyStats: [{ label: "Clean Sheets", value: 1 }, { label: "Save %", value: "71%" }] },
        ],
      },
      {
        label: "Defenders",
        players: [
          { id: "p-white", name: "Ben White", position: "DEF", positionFull: "Right Back", number: 4, nationality: "England", age: 26, keyStats: [{ label: "Appearances", value: 20 }, { label: "Tackles/G", value: 2.1 }] },
          { id: "p-saliba", name: "William Saliba", position: "DEF", positionFull: "Centre Back", number: 12, nationality: "France", age: 23, keyStats: [{ label: "Appearances", value: 28 }, { label: "Clearances/G", value: 3.4 }] },
          { id: "p-gabriel", name: "Gabriel Magalhães", position: "DEF", positionFull: "Centre Back", number: 6, nationality: "Brazil", age: 26, keyStats: [{ label: "Goals", value: 5 }, { label: "Appearances", value: 27 }] },
          { id: "p-zinchenko", name: "Oleksandr Zinchenko", position: "DEF", positionFull: "Left Back", number: 35, nationality: "Ukraine", age: 27, keyStats: [{ label: "Appearances", value: 14 }, { label: "Assists", value: 2 }] },
        ],
      },
      {
        label: "Midfielders",
        players: [
          { id: "p-partey", name: "Thomas Partey", position: "MID", positionFull: "Defensive Mid", number: 5, nationality: "Ghana", age: 30, keyStats: [{ label: "Appearances", value: 16 }, { label: "Tackles/G", value: 2.8 }] },
          { id: "p-rice", name: "Declan Rice", position: "MID", positionFull: "Central Mid", number: 41, nationality: "England", age: 25, keyStats: [{ label: "Goals", value: 7 }, { label: "Assists", value: 8 }] },
          { id: "p-odegaard", name: "Martin Ødegaard", position: "MID", positionFull: "Attacking Mid", number: 8, nationality: "Norway", age: 25, keyStats: [{ label: "Goals", value: 10 }, { label: "Assists", value: 9 }, { label: "Rating", value: 8.0 }] },
        ],
      },
      {
        label: "Forwards",
        players: [
          { id: "p-saka", name: "Bukayo Saka", position: "FWD", positionFull: "Right Wing", number: 7, nationality: "England", age: 22, keyStats: [{ label: "Goals", value: 14 }, { label: "Assists", value: 11 }, { label: "Rating", value: 8.2 }] },
          { id: "p-martinelli", name: "Gabriel Martinelli", position: "FWD", positionFull: "Left Wing", number: 11, nationality: "Brazil", age: 22, keyStats: [{ label: "Goals", value: 9 }, { label: "Assists", value: 6 }] },
          { id: "p-havertz", name: "Kai Havertz", position: "FWD", positionFull: "Striker", number: 29, nationality: "Germany", age: 24, keyStats: [{ label: "Goals", value: 11 }, { label: "Assists", value: 4 }] },
        ],
      },
    ],
    pastResults: [
      { opponent: "Burnley", result: "W", score: "3-0", date: "2024-12-02", competition: "Premier League", home: true },
      { opponent: "Luton Town", result: "W", score: "4-1", date: "2024-11-25", competition: "Premier League", home: false },
      { opponent: "Brentford", result: "D", score: "1-1", date: "2024-11-11", competition: "Premier League", home: true },
      { opponent: "West Ham", result: "L", score: "0-1", date: "2024-11-04", competition: "Premier League", home: false },
      { opponent: "Sheffield Utd", result: "W", score: "2-0", date: "2024-10-28", competition: "Premier League", home: true },
    ],
  },
  {
    id: "team-chelsea",
    name: "Chelsea",
    sport: "football",
    league: "Premier League",
    country: "England",
    founded: 1905,
    venue: "Stamford Bridge",
    manager: "Mauricio Pochettino",
    form: ["L", "W", "W", "W", "D"],
    seasonStats: [
      { label: "Played", value: 28 },
      { label: "Won", value: 12 },
      { label: "Drawn", value: 7 },
      { label: "Lost", value: 9 },
      { label: "Goals For", value: 44 },
      { label: "Goals Against", value: 40 },
      { label: "Points", value: 43 },
      { label: "Position", value: "9th" },
    ],
    squad: [
      {
        label: "Goalkeepers",
        players: [
          { id: "p-sanchez", name: "Robert Sánchez", position: "GK", positionFull: "Goalkeeper", number: 1, nationality: "Spain", age: 26, keyStats: [{ label: "Clean Sheets", value: 7 }, { label: "Save %", value: "74%" }] },
        ],
      },
      {
        label: "Defenders",
        players: [
          { id: "p-gusto", name: "Malo Gusto", position: "DEF", positionFull: "Right Back", number: 27, nationality: "France", age: 21, keyStats: [{ label: "Appearances", value: 22 }, { label: "Assists", value: 3 }] },
          { id: "p-colwill", name: "Levi Colwill", position: "DEF", positionFull: "Centre Back", number: 26, nationality: "England", age: 21, keyStats: [{ label: "Appearances", value: 20 }, { label: "Clearances/G", value: 2.8 }] },
          { id: "p-chilwell", name: "Ben Chilwell", position: "DEF", positionFull: "Left Back", number: 21, nationality: "England", age: 27, keyStats: [{ label: "Appearances", value: 10 }, { label: "Assists", value: 2 }] },
        ],
      },
      {
        label: "Midfielders",
        players: [
          { id: "p-caicedo", name: "Moisés Caicedo", position: "MID", positionFull: "Defensive Mid", number: 25, nationality: "Ecuador", age: 22, keyStats: [{ label: "Appearances", value: 25 }, { label: "Tackles/G", value: 3.2 }] },
          { id: "p-enzo", name: "Enzo Fernández", position: "MID", positionFull: "Central Mid", number: 8, nationality: "Argentina", age: 23, keyStats: [{ label: "Goals", value: 3 }, { label: "Assists", value: 7 }] },
          { id: "p-palmer", name: "Cole Palmer", position: "MID", positionFull: "Attacking Mid", number: 20, nationality: "England", age: 22, keyStats: [{ label: "Goals", value: 18 }, { label: "Assists", value: 10 }, { label: "Rating", value: 8.4 }] },
        ],
      },
      {
        label: "Forwards",
        players: [
          { id: "p-sterling", name: "Raheem Sterling", position: "FWD", positionFull: "Left Wing", number: 17, nationality: "England", age: 29, keyStats: [{ label: "Goals", value: 4 }, { label: "Assists", value: 3 }] },
          { id: "p-jackson", name: "Nicolas Jackson", position: "FWD", positionFull: "Striker", number: 15, nationality: "Senegal", age: 23, keyStats: [{ label: "Goals", value: 12 }, { label: "Assists", value: 5 }] },
          { id: "p-nkunku", name: "Christopher Nkunku", position: "FWD", positionFull: "Forward", number: 18, nationality: "France", age: 26, keyStats: [{ label: "Goals", value: 6 }, { label: "Assists", value: 3 }] },
        ],
      },
    ],
    pastResults: [
      { opponent: "Crystal Palace", result: "L", score: "1-2", date: "2024-12-01", competition: "Premier League", home: false },
      { opponent: "Brighton", result: "W", score: "3-2", date: "2024-11-23", competition: "Premier League", home: true },
      { opponent: "Man Utd", result: "W", score: "4-3", date: "2024-11-12", competition: "Premier League", home: false },
      { opponent: "Tottenham", result: "W", score: "4-4", date: "2024-11-06", competition: "Premier League", home: true },
      { opponent: "Newcastle", result: "D", score: "1-1", date: "2024-10-27", competition: "Premier League", home: false },
    ],
  },
  {
    id: "team-man-city",
    name: "Man City",
    sport: "football",
    league: "Premier League",
    country: "England",
    founded: 1880,
    venue: "Etihad Stadium",
    manager: "Pep Guardiola",
    form: ["W", "W", "W", "D", "W"],
    seasonStats: [
      { label: "Played", value: 28 },
      { label: "Won", value: 20 },
      { label: "Drawn", value: 5 },
      { label: "Lost", value: 3 },
      { label: "Goals For", value: 67 },
      { label: "Goals Against", value: 28 },
      { label: "Points", value: 65 },
      { label: "Position", value: "1st" },
    ],
    squad: [
      {
        label: "Goalkeepers",
        players: [
          { id: "p-ederson", name: "Ederson", position: "GK", positionFull: "Goalkeeper", number: 31, nationality: "Brazil", age: 30, keyStats: [{ label: "Clean Sheets", value: 12 }, { label: "Save %", value: "81%" }] },
        ],
      },
      {
        label: "Defenders",
        players: [
          { id: "p-walker", name: "Kyle Walker", position: "DEF", positionFull: "Right Back", number: 2, nationality: "England", age: 33, keyStats: [{ label: "Appearances", value: 24 }, { label: "Assists", value: 2 }] },
          { id: "p-dias", name: "Rúben Dias", position: "DEF", positionFull: "Centre Back", number: 3, nationality: "Portugal", age: 26, keyStats: [{ label: "Appearances", value: 27 }, { label: "Clearances/G", value: 3.1 }] },
          { id: "p-gvardiol", name: "Joško Gvardiol", position: "DEF", positionFull: "Left Back", number: 24, nationality: "Croatia", age: 22, keyStats: [{ label: "Goals", value: 7 }, { label: "Assists", value: 4 }] },
        ],
      },
      {
        label: "Midfielders",
        players: [
          { id: "p-rodri", name: "Rodri", position: "MID", positionFull: "Defensive Mid", number: 16, nationality: "Spain", age: 27, keyStats: [{ label: "Goals", value: 8 }, { label: "Assists", value: 10 }, { label: "Rating", value: 8.6 }] },
          { id: "p-debruyne", name: "Kevin De Bruyne", position: "MID", positionFull: "Attacking Mid", number: 17, nationality: "Belgium", age: 32, keyStats: [{ label: "Goals", value: 5 }, { label: "Assists", value: 14 }] },
          { id: "p-bernardo", name: "Bernardo Silva", position: "MID", positionFull: "Central Mid", number: 20, nationality: "Portugal", age: 29, keyStats: [{ label: "Goals", value: 6 }, { label: "Assists", value: 7 }] },
        ],
      },
      {
        label: "Forwards",
        players: [
          { id: "p-haaland", name: "Erling Haaland", position: "FWD", positionFull: "Striker", number: 9, nationality: "Norway", age: 23, keyStats: [{ label: "Goals", value: 27 }, { label: "Assists", value: 5 }, { label: "Rating", value: 8.7 }] },
          { id: "p-foden", name: "Phil Foden", position: "FWD", positionFull: "Left Wing", number: 47, nationality: "England", age: 23, keyStats: [{ label: "Goals", value: 15 }, { label: "Assists", value: 9 }] },
          { id: "p-doku", name: "Jérémy Doku", position: "FWD", positionFull: "Right Wing", number: 11, nationality: "Belgium", age: 21, keyStats: [{ label: "Goals", value: 4 }, { label: "Assists", value: 8 }] },
        ],
      },
    ],
    pastResults: [
      { opponent: "Aston Villa", result: "W", score: "4-1", date: "2024-12-03", competition: "Premier League", home: true },
      { opponent: "Tottenham", result: "W", score: "3-3", date: "2024-11-26", competition: "Premier League", home: false },
      { opponent: "Brighton", result: "W", score: "2-0", date: "2024-11-09", competition: "Premier League", home: true },
      { opponent: "Bournemouth", result: "D", score: "2-2", date: "2024-11-02", competition: "Premier League", home: false },
      { opponent: "Southampton", result: "W", score: "3-1", date: "2024-10-26", competition: "Premier League", home: true },
    ],
  },
  {
    id: "team-liverpool",
    name: "Liverpool",
    sport: "football",
    league: "Premier League",
    country: "England",
    founded: 1892,
    venue: "Anfield",
    manager: "Jürgen Klopp",
    form: ["W", "L", "W", "W", "D"],
    seasonStats: [
      { label: "Played", value: 28 },
      { label: "Won", value: 17 },
      { label: "Drawn", value: 6 },
      { label: "Lost", value: 5 },
      { label: "Goals For", value: 62 },
      { label: "Goals Against", value: 36 },
      { label: "Points", value: 57 },
      { label: "Position", value: "3rd" },
    ],
    squad: [
      {
        label: "Goalkeepers",
        players: [
          { id: "p-alisson", name: "Alisson Becker", position: "GK", positionFull: "Goalkeeper", number: 1, nationality: "Brazil", age: 31, keyStats: [{ label: "Clean Sheets", value: 10 }, { label: "Save %", value: "79%" }] },
        ],
      },
      {
        label: "Defenders",
        players: [
          { id: "p-taa", name: "Trent Alexander-Arnold", position: "DEF", positionFull: "Right Back", number: 66, nationality: "England", age: 25, keyStats: [{ label: "Goals", value: 3 }, { label: "Assists", value: 10 }] },
          { id: "p-vandijk", name: "Virgil van Dijk", position: "DEF", positionFull: "Centre Back", number: 4, nationality: "Netherlands", age: 32, keyStats: [{ label: "Appearances", value: 28 }, { label: "Clearances/G", value: 3.6 }] },
          { id: "p-robertson", name: "Andy Robertson", position: "DEF", positionFull: "Left Back", number: 26, nationality: "Scotland", age: 29, keyStats: [{ label: "Appearances", value: 22 }, { label: "Assists", value: 6 }] },
        ],
      },
      {
        label: "Midfielders",
        players: [
          { id: "p-macallister", name: "Alexis Mac Allister", position: "MID", positionFull: "Central Mid", number: 10, nationality: "Argentina", age: 25, keyStats: [{ label: "Goals", value: 5 }, { label: "Assists", value: 8 }] },
          { id: "p-szoboszlai", name: "Dominik Szoboszlai", position: "MID", positionFull: "Attacking Mid", number: 8, nationality: "Hungary", age: 23, keyStats: [{ label: "Goals", value: 6 }, { label: "Assists", value: 7 }] },
          { id: "p-gravenberch", name: "Ryan Gravenberch", position: "MID", positionFull: "Defensive Mid", number: 38, nationality: "Netherlands", age: 22, keyStats: [{ label: "Appearances", value: 26 }, { label: "Rating", value: 7.7 }] },
        ],
      },
      {
        label: "Forwards",
        players: [
          { id: "p-salah", name: "Mohamed Salah", position: "FWD", positionFull: "Right Wing", number: 11, nationality: "Egypt", age: 31, keyStats: [{ label: "Goals", value: 18 }, { label: "Assists", value: 12 }, { label: "Rating", value: 8.5 }] },
          { id: "p-diaz", name: "Luis Díaz", position: "FWD", positionFull: "Left Wing", number: 7, nationality: "Colombia", age: 27, keyStats: [{ label: "Goals", value: 10 }, { label: "Assists", value: 5 }] },
          { id: "p-gakpo", name: "Cody Gakpo", position: "FWD", positionFull: "Forward", number: 18, nationality: "Netherlands", age: 24, keyStats: [{ label: "Goals", value: 11 }, { label: "Assists", value: 4 }] },
        ],
      },
    ],
    pastResults: [
      { opponent: "Fulham", result: "W", score: "4-3", date: "2024-12-03", competition: "Premier League", home: true },
      { opponent: "Man City", result: "L", score: "1-1", date: "2024-11-25", competition: "Premier League", home: false },
      { opponent: "Brighton", result: "W", score: "3-2", date: "2024-11-10", competition: "Premier League", home: true },
      { opponent: "Aston Villa", result: "W", score: "3-0", date: "2024-11-03", competition: "Premier League", home: false },
      { opponent: "Chelsea", result: "D", score: "2-2", date: "2024-10-27", competition: "Premier League", home: true },
    ],
  },
  // ─── LA LIGA ─────────────────────────────────────────────────────────────
  {
    id: "team-real-madrid",
    name: "Real Madrid",
    sport: "football",
    league: "La Liga",
    country: "Spain",
    founded: 1902,
    venue: "Santiago Bernabéu",
    manager: "Carlo Ancelotti",
    form: ["W", "D", "W", "W", "L"],
    seasonStats: [
      { label: "Played", value: 27 },
      { label: "Won", value: 18 },
      { label: "Drawn", value: 4 },
      { label: "Lost", value: 5 },
      { label: "Goals For", value: 64 },
      { label: "Goals Against", value: 30 },
      { label: "Points", value: 58 },
      { label: "Position", value: "1st" },
    ],
    squad: [
      {
        label: "Goalkeepers",
        players: [
          { id: "p-courtois", name: "Thibaut Courtois", position: "GK", positionFull: "Goalkeeper", number: 1, nationality: "Belgium", age: 32, keyStats: [{ label: "Clean Sheets", value: 11 }, { label: "Save %", value: "80%" }] },
        ],
      },
      {
        label: "Defenders",
        players: [
          { id: "p-carvajal", name: "Dani Carvajal", position: "DEF", positionFull: "Right Back", number: 2, nationality: "Spain", age: 32, keyStats: [{ label: "Appearances", value: 21 }, { label: "Assists", value: 3 }] },
          { id: "p-rudiger", name: "Antonio Rüdiger", position: "DEF", positionFull: "Centre Back", number: 22, nationality: "Germany", age: 31, keyStats: [{ label: "Appearances", value: 26 }, { label: "Goals", value: 2 }] },
          { id: "p-mendy", name: "Ferland Mendy", position: "DEF", positionFull: "Left Back", number: 23, nationality: "France", age: 29, keyStats: [{ label: "Appearances", value: 20 }, { label: "Assists", value: 2 }] },
        ],
      },
      {
        label: "Midfielders",
        players: [
          { id: "p-tchouameni", name: "Aurélien Tchouaméni", position: "MID", positionFull: "Defensive Mid", number: 18, nationality: "France", age: 24, keyStats: [{ label: "Appearances", value: 22 }, { label: "Goals", value: 3 }] },
          { id: "p-kroos", name: "Toni Kroos", position: "MID", positionFull: "Central Mid", number: 8, nationality: "Germany", age: 34, keyStats: [{ label: "Assists", value: 9 }, { label: "Rating", value: 7.9 }] },
          { id: "p-bellingham", name: "Jude Bellingham", position: "MID", positionFull: "Attacking Mid", number: 5, nationality: "England", age: 20, keyStats: [{ label: "Goals", value: 19 }, { label: "Assists", value: 8 }, { label: "Rating", value: 8.8 }] },
        ],
      },
      {
        label: "Forwards",
        players: [
          { id: "p-vinicius", name: "Vinicius Jr.", position: "FWD", positionFull: "Left Wing", number: 7, nationality: "Brazil", age: 23, keyStats: [{ label: "Goals", value: 16 }, { label: "Assists", value: 9 }] },
          { id: "p-rodrygo", name: "Rodrygo", position: "FWD", positionFull: "Right Wing", number: 11, nationality: "Brazil", age: 23, keyStats: [{ label: "Goals", value: 10 }, { label: "Assists", value: 6 }] },
          { id: "p-joselu", name: "Joselu", position: "FWD", positionFull: "Striker", number: 14, nationality: "Spain", age: 34, keyStats: [{ label: "Goals", value: 8 }, { label: "Assists", value: 3 }] },
        ],
      },
    ],
    pastResults: [
      { opponent: "Atletico Madrid", result: "W", score: "3-1", date: "2024-12-01", competition: "La Liga", home: true },
      { opponent: "Girona", result: "D", score: "4-4", date: "2024-11-24", competition: "La Liga", home: false },
      { opponent: "Valencia", result: "W", score: "4-1", date: "2024-11-10", competition: "La Liga", home: true },
      { opponent: "Sevilla", result: "W", score: "1-0", date: "2024-11-03", competition: "La Liga", home: false },
      { opponent: "Getafe", result: "L", score: "0-1", date: "2024-10-26", competition: "La Liga", home: true },
    ],
  },
  {
    id: "team-barcelona",
    name: "Barcelona",
    sport: "football",
    league: "La Liga",
    country: "Spain",
    founded: 1899,
    venue: "Estadio Olímpico",
    manager: "Xavi Hernández",
    form: ["W", "W", "L", "W", "W"],
    seasonStats: [
      { label: "Played", value: 27 },
      { label: "Won", value: 17 },
      { label: "Drawn", value: 4 },
      { label: "Lost", value: 6 },
      { label: "Goals For", value: 61 },
      { label: "Goals Against", value: 35 },
      { label: "Points", value: 55 },
      { label: "Position", value: "2nd" },
    ],
    squad: [
      {
        label: "Goalkeepers",
        players: [
          { id: "p-terstegen", name: "Marc-André ter Stegen", position: "GK", positionFull: "Goalkeeper", number: 1, nationality: "Germany", age: 32, keyStats: [{ label: "Clean Sheets", value: 9 }, { label: "Save %", value: "76%" }] },
        ],
      },
      {
        label: "Defenders",
        players: [
          { id: "p-cancelo", name: "João Cancelo", position: "DEF", positionFull: "Right Back", number: 23, nationality: "Portugal", age: 30, keyStats: [{ label: "Appearances", value: 23 }, { label: "Assists", value: 5 }] },
          { id: "p-araujo", name: "Ronald Araújo", position: "DEF", positionFull: "Centre Back", number: 4, nationality: "Uruguay", age: 25, keyStats: [{ label: "Appearances", value: 18 }, { label: "Goals", value: 2 }] },
          { id: "p-balde", name: "Alejandro Balde", position: "DEF", positionFull: "Left Back", number: 3, nationality: "Spain", age: 20, keyStats: [{ label: "Appearances", value: 24 }, { label: "Assists", value: 4 }] },
        ],
      },
      {
        label: "Midfielders",
        players: [
          { id: "p-pedri", name: "Pedri", position: "MID", positionFull: "Central Mid", number: 8, nationality: "Spain", age: 21, keyStats: [{ label: "Goals", value: 5 }, { label: "Assists", value: 8 }, { label: "Rating", value: 7.9 }] },
          { id: "p-gavi", name: "Gavi", position: "MID", positionFull: "Central Mid", number: 6, nationality: "Spain", age: 19, keyStats: [{ label: "Goals", value: 3 }, { label: "Assists", value: 5 }] },
          { id: "p-dejoong", name: "Frenkie de Jong", position: "MID", positionFull: "Defensive Mid", number: 21, nationality: "Netherlands", age: 26, keyStats: [{ label: "Appearances", value: 20 }, { label: "Assists", value: 4 }] },
        ],
      },
      {
        label: "Forwards",
        players: [
          { id: "p-yamal", name: "Lamine Yamal", position: "FWD", positionFull: "Right Wing", number: 27, nationality: "Spain", age: 16, keyStats: [{ label: "Goals", value: 9 }, { label: "Assists", value: 11 }, { label: "Rating", value: 8.3 }] },
          { id: "p-lewandowski", name: "Robert Lewandowski", position: "FWD", positionFull: "Striker", number: 9, nationality: "Poland", age: 35, keyStats: [{ label: "Goals", value: 20 }, { label: "Assists", value: 6 }] },
          { id: "p-raphinha", name: "Raphinha", position: "FWD", positionFull: "Left Wing", number: 11, nationality: "Brazil", age: 27, keyStats: [{ label: "Goals", value: 14 }, { label: "Assists", value: 7 }] },
        ],
      },
    ],
    pastResults: [
      { opponent: "Athletic Bilbao", result: "W", score: "3-2", date: "2024-12-03", competition: "La Liga", home: false },
      { opponent: "Real Betis", result: "W", score: "5-1", date: "2024-11-23", competition: "La Liga", home: true },
      { opponent: "Real Madrid", result: "L", score: "2-3", date: "2024-11-09", competition: "La Liga", home: false },
      { opponent: "Celta Vigo", result: "W", score: "2-1", date: "2024-11-02", competition: "La Liga", home: true },
      { opponent: "Rayo Vallecano", result: "W", score: "3-0", date: "2024-10-26", competition: "La Liga", home: false },
    ],
  },
  // ─── NBA ─────────────────────────────────────────────────────────────────
  {
    id: "team-lakers",
    name: "LA Lakers",
    sport: "basketball",
    league: "NBA",
    country: "USA",
    founded: 1947,
    venue: "Crypto.com Arena",
    manager: "Darvin Ham",
    form: ["W", "L", "W", "W", "L"],
    seasonStats: [
      { label: "Wins", value: 28 },
      { label: "Losses", value: 21 },
      { label: "Avg Pts", value: 114.2 },
      { label: "Opp Pts", value: 112.8 },
      { label: "Home W/L", value: "16-8" },
      { label: "Away W/L", value: "12-13" },
      { label: "Streak", value: "L2" },
    ],
    squad: [
      {
        label: "Guards",
        players: [
          { id: "p-drussell", name: "D'Angelo Russell", position: "PG", positionFull: "Point Guard", number: 1, nationality: "USA", age: 28, keyStats: [{ label: "PPG", value: 18.0 }, { label: "APG", value: 6.3 }, { label: "FG%", value: "43%" }] },
          { id: "p-reaves", name: "Austin Reaves", position: "SG", positionFull: "Shooting Guard", number: 15, nationality: "USA", age: 25, keyStats: [{ label: "PPG", value: 15.4 }, { label: "APG", value: 4.1 }, { label: "3P%", value: "39%" }] },
        ],
      },
      {
        label: "Forwards",
        players: [
          { id: "p-lebron", name: "LeBron James", position: "SF", positionFull: "Small Forward", number: 23, nationality: "USA", age: 39, keyStats: [{ label: "PPG", value: 25.7 }, { label: "APG", value: 8.3 }, { label: "RPG", value: 7.3 }] },
          { id: "p-hachimura", name: "Rui Hachimura", position: "PF", positionFull: "Power Forward", number: 28, nationality: "Japan", age: 26, keyStats: [{ label: "PPG", value: 13.7 }, { label: "RPG", value: 4.6 }] },
          { id: "p-tprince", name: "Taurean Prince", position: "SF", positionFull: "Small Forward", number: 12, nationality: "USA", age: 30, keyStats: [{ label: "PPG", value: 9.2 }, { label: "3P%", value: "37%" }] },
        ],
      },
      {
        label: "Centers",
        players: [
          { id: "p-adavis", name: "Anthony Davis", position: "C", positionFull: "Center", number: 3, nationality: "USA", age: 31, keyStats: [{ label: "PPG", value: 24.1 }, { label: "RPG", value: 12.7 }, { label: "BPG", value: 2.3 }] },
          { id: "p-cwood", name: "Christian Wood", position: "C", positionFull: "Center", number: 35, nationality: "USA", age: 28, keyStats: [{ label: "PPG", value: 8.4 }, { label: "RPG", value: 5.8 }] },
        ],
      },
    ],
    pastResults: [
      { opponent: "Phoenix Suns", result: "W", score: "123-118", date: "2024-12-03", competition: "NBA", home: true },
      { opponent: "Denver Nuggets", result: "L", score: "108-117", date: "2024-11-30", competition: "NBA", home: false },
      { opponent: "Oklahoma City", result: "W", score: "131-127", date: "2024-11-27", competition: "NBA", home: true },
      { opponent: "Sacramento Kings", result: "W", score: "119-114", date: "2024-11-24", competition: "NBA", home: false },
      { opponent: "Dallas Mavericks", result: "L", score: "105-114", date: "2024-11-21", competition: "NBA", home: true },
    ],
  },
  {
    id: "team-warriors",
    name: "Golden State Warriors",
    sport: "basketball",
    league: "NBA",
    country: "USA",
    founded: 1946,
    venue: "Chase Center",
    manager: "Steve Kerr",
    form: ["W", "W", "L", "W", "W"],
    seasonStats: [
      { label: "Wins", value: 26 },
      { label: "Losses", value: 23 },
      { label: "Avg Pts", value: 116.4 },
      { label: "Opp Pts", value: 113.2 },
      { label: "Home W/L", value: "15-10" },
      { label: "Away W/L", value: "11-13" },
      { label: "Streak", value: "W2" },
    ],
    squad: [
      {
        label: "Guards",
        players: [
          { id: "p-curry", name: "Stephen Curry", position: "PG", positionFull: "Point Guard", number: 30, nationality: "USA", age: 36, keyStats: [{ label: "PPG", value: 26.8 }, { label: "APG", value: 5.1 }, { label: "3PM", value: 4.6 }] },
          { id: "p-kthompson", name: "Klay Thompson", position: "SG", positionFull: "Shooting Guard", number: 11, nationality: "USA", age: 34, keyStats: [{ label: "PPG", value: 17.9 }, { label: "3P%", value: "38%" }] },
        ],
      },
      {
        label: "Forwards",
        players: [
          { id: "p-dgreen", name: "Draymond Green", position: "PF", positionFull: "Power Forward", number: 23, nationality: "USA", age: 34, keyStats: [{ label: "APG", value: 5.8 }, { label: "RPG", value: 7.1 }, { label: "BPG", value: 0.9 }] },
          { id: "p-wiggins", name: "Andrew Wiggins", position: "SF", positionFull: "Small Forward", number: 22, nationality: "Canada", age: 29, keyStats: [{ label: "PPG", value: 16.2 }, { label: "RPG", value: 4.8 }] },
          { id: "p-kuminga", name: "Jonathan Kuminga", position: "SF", positionFull: "Small Forward", number: 00, nationality: "DRC", age: 21, keyStats: [{ label: "PPG", value: 16.7 }, { label: "RPG", value: 4.6 }] },
        ],
      },
      {
        label: "Centers",
        players: [
          { id: "p-looney", name: "Kevon Looney", position: "C", positionFull: "Center", number: 5, nationality: "USA", age: 28, keyStats: [{ label: "RPG", value: 7.2 }, { label: "APG", value: 2.1 }] },
        ],
      },
    ],
    pastResults: [
      { opponent: "Portland Trail Blazers", result: "W", score: "128-112", date: "2024-12-04", competition: "NBA", home: true },
      { opponent: "Orlando Magic", result: "W", score: "114-108", date: "2024-12-01", competition: "NBA", home: false },
      { opponent: "Indiana Pacers", result: "L", score: "118-127", date: "2024-11-28", competition: "NBA", home: true },
      { opponent: "Toronto Raptors", result: "W", score: "122-104", date: "2024-11-25", competition: "NBA", home: false },
      { opponent: "LA Clippers", result: "W", score: "119-108", date: "2024-11-22", competition: "NBA", home: true },
    ],
  },
  {
    id: "team-celtics",
    name: "Boston Celtics",
    sport: "basketball",
    league: "NBA",
    country: "USA",
    founded: 1946,
    venue: "TD Garden",
    manager: "Joe Mazzulla",
    form: ["W", "W", "W", "L", "W"],
    seasonStats: [
      { label: "Wins", value: 35 },
      { label: "Losses", value: 14 },
      { label: "Avg Pts", value: 120.1 },
      { label: "Opp Pts", value: 111.3 },
      { label: "Home W/L", value: "19-5" },
      { label: "Away W/L", value: "16-9" },
      { label: "Streak", value: "W3" },
    ],
    squad: [
      {
        label: "Guards",
        players: [
          { id: "p-jholiday", name: "Jrue Holiday", position: "PG", positionFull: "Point Guard", number: 4, nationality: "USA", age: 33, keyStats: [{ label: "PPG", value: 12.8 }, { label: "APG", value: 4.9 }, { label: "SPG", value: 1.5 }] },
          { id: "p-ppritchard", name: "Payton Pritchard", position: "PG", positionFull: "Guard", number: 11, nationality: "USA", age: 26, keyStats: [{ label: "PPG", value: 11.4 }, { label: "3P%", value: "42%" }] },
        ],
      },
      {
        label: "Forwards",
        players: [
          { id: "p-jtatum", name: "Jayson Tatum", position: "SF", positionFull: "Small Forward", number: 0, nationality: "USA", age: 26, keyStats: [{ label: "PPG", value: 26.9 }, { label: "RPG", value: 8.1 }, { label: "APG", value: 4.7 }] },
          { id: "p-jbrown", name: "Jaylen Brown", position: "SG", positionFull: "Guard / Forward", number: 7, nationality: "USA", age: 27, keyStats: [{ label: "PPG", value: 23.0 }, { label: "RPG", value: 5.6 }] },
          { id: "p-shauser", name: "Sam Hauser", position: "SF", positionFull: "Small Forward", number: 30, nationality: "USA", age: 26, keyStats: [{ label: "PPG", value: 9.8 }, { label: "3P%", value: "44%" }] },
        ],
      },
      {
        label: "Centers",
        players: [
          { id: "p-kporzingis", name: "Kristaps Porzingis", position: "C", positionFull: "Center", number: 8, nationality: "Latvia", age: 28, keyStats: [{ label: "PPG", value: 19.5 }, { label: "RPG", value: 6.9 }, { label: "BPG", value: 1.9 }] },
          { id: "p-ahorford", name: "Al Horford", position: "C", positionFull: "Center", number: 42, nationality: "Dominican Rep.", age: 37, keyStats: [{ label: "PPG", value: 8.5 }, { label: "RPG", value: 6.0 }] },
        ],
      },
    ],
    pastResults: [
      { opponent: "Cleveland Cavaliers", result: "W", score: "132-123", date: "2024-12-05", competition: "NBA", home: true },
      { opponent: "New York Knicks", result: "W", score: "117-110", date: "2024-12-02", competition: "NBA", home: false },
      { opponent: "Charlotte Hornets", result: "W", score: "141-107", date: "2024-11-29", competition: "NBA", home: true },
      { opponent: "Chicago Bulls", result: "L", score: "108-114", date: "2024-11-26", competition: "NBA", home: false },
      { opponent: "Washington Wizards", result: "W", score: "126-98", date: "2024-11-23", competition: "NBA", home: true },
    ],
  },
  {
    id: "team-bucks",
    name: "Milwaukee Bucks",
    sport: "basketball",
    league: "NBA",
    country: "USA",
    founded: 1968,
    venue: "Fiserv Forum",
    manager: "Doc Rivers",
    form: ["L", "W", "L", "W", "W"],
    seasonStats: [
      { label: "Wins", value: 22 },
      { label: "Losses", value: 27 },
      { label: "Avg Pts", value: 111.2 },
      { label: "Opp Pts", value: 114.6 },
      { label: "Home W/L", value: "13-12" },
      { label: "Away W/L", value: "9-15" },
      { label: "Streak", value: "W2" },
    ],
    squad: [
      {
        label: "Guards",
        players: [
          { id: "p-dlillard", name: "Damian Lillard", position: "PG", positionFull: "Point Guard", number: 0, nationality: "USA", age: 33, keyStats: [{ label: "PPG", value: 24.3 }, { label: "APG", value: 7.4 }, { label: "3PM", value: 3.8 }] },
          { id: "p-pbeverley", name: "Patrick Beverley", position: "PG", positionFull: "Guard", number: 21, nationality: "USA", age: 35, keyStats: [{ label: "PPG", value: 6.8 }, { label: "SPG", value: 1.2 }] },
        ],
      },
      {
        label: "Forwards",
        players: [
          { id: "p-giannis", name: "Giannis Antetokounmpo", position: "PF", positionFull: "Power Forward", number: 34, nationality: "Greece", age: 29, keyStats: [{ label: "PPG", value: 30.4 }, { label: "RPG", value: 11.8 }, { label: "APG", value: 6.5 }] },
          { id: "p-kmiddleton", name: "Khris Middleton", position: "SF", positionFull: "Small Forward", number: 22, nationality: "USA", age: 32, keyStats: [{ label: "PPG", value: 14.1 }, { label: "APG", value: 3.9 }] },
          { id: "p-mbeauchamp", name: "MarJon Beauchamp", position: "SF", positionFull: "Small Forward", number: 0, nationality: "USA", age: 23, keyStats: [{ label: "PPG", value: 6.4 }, { label: "RPG", value: 3.1 }] },
        ],
      },
      {
        label: "Centers",
        players: [
          { id: "p-blopez", name: "Brook Lopez", position: "C", positionFull: "Center", number: 11, nationality: "USA", age: 36, keyStats: [{ label: "PPG", value: 13.9 }, { label: "BPG", value: 2.4 }] },
          { id: "p-bportis", name: "Bobby Portis", position: "PF", positionFull: "Power Forward", number: 9, nationality: "USA", age: 29, keyStats: [{ label: "PPG", value: 14.2 }, { label: "RPG", value: 8.3 }] },
        ],
      },
    ],
    pastResults: [
      { opponent: "Miami Heat", result: "L", score: "108-116", date: "2024-12-04", competition: "NBA", home: false },
      { opponent: "Detroit Pistons", result: "W", score: "127-113", date: "2024-12-01", competition: "NBA", home: true },
      { opponent: "Atlanta Hawks", result: "L", score: "110-121", date: "2024-11-28", competition: "NBA", home: false },
      { opponent: "San Antonio Spurs", result: "W", score: "118-104", date: "2024-11-25", competition: "NBA", home: true },
      { opponent: "Utah Jazz", result: "W", score: "123-110", date: "2024-11-22", competition: "NBA", home: false },
    ],
  },
  // ─── NFL ─────────────────────────────────────────────────────────────────
  {
    id: "team-chiefs",
    name: "Kansas City Chiefs",
    sport: "american_football",
    league: "NFL",
    country: "USA",
    founded: 1960,
    venue: "Arrowhead Stadium",
    manager: "Andy Reid",
    form: ["W", "W", "L", "W", "W"],
    seasonStats: [
      { label: "Wins", value: 10 },
      { label: "Losses", value: 3 },
      { label: "Pts Scored", value: 336 },
      { label: "Pts Allowed", value: 228 },
      { label: "Div Record", value: "4-1" },
      { label: "Conf Record", value: "7-3" },
      { label: "Streak", value: "W4" },
    ],
    squad: [
      {
        label: "Offense",
        players: [
          { id: "p-mahomes", name: "Patrick Mahomes", position: "QB", positionFull: "Quarterback", number: 15, nationality: "USA", age: 28, keyStats: [{ label: "Pass Yds", value: 3724 }, { label: "TDs", value: 28 }, { label: "INTs", value: 9 }] },
          { id: "p-kelce", name: "Travis Kelce", position: "TE", positionFull: "Tight End", number: 87, nationality: "USA", age: 34, keyStats: [{ label: "Rec Yds", value: 934 }, { label: "TDs", value: 6 }, { label: "Receptions", value: 78 }] },
          { id: "p-rrice", name: "Rashee Rice", position: "WR", positionFull: "Wide Receiver", number: 4, nationality: "USA", age: 24, keyStats: [{ label: "Rec Yds", value: 786 }, { label: "TDs", value: 7 }] },
          { id: "p-ipacheco", name: "Isiah Pacheco", position: "RB", positionFull: "Running Back", number: 10, nationality: "USA", age: 24, keyStats: [{ label: "Rush Yds", value: 842 }, { label: "TDs", value: 8 }] },
        ],
      },
      {
        label: "Defense",
        players: [
          { id: "p-cjones", name: "Chris Jones", position: "DT", positionFull: "Defensive Tackle", number: 95, nationality: "USA", age: 29, keyStats: [{ label: "Sacks", value: 10.5 }, { label: "TFL", value: 14 }] },
          { id: "p-nbbolton", name: "Nick Bolton", position: "LB", positionFull: "Linebacker", number: 32, nationality: "USA", age: 24, keyStats: [{ label: "Tackles", value: 98 }, { label: "INTs", value: 2 }] },
          { id: "p-lsneed", name: "L'Jarius Sneed", position: "CB", positionFull: "Cornerback", number: 38, nationality: "USA", age: 27, keyStats: [{ label: "INTs", value: 3 }, { label: "PDs", value: 12 }] },
        ],
      },
    ],
    pastResults: [
      { opponent: "Las Vegas Raiders", result: "W", score: "31-17", date: "2024-12-01", competition: "NFL", home: true },
      { opponent: "Green Bay Packers", result: "W", score: "27-19", date: "2024-11-24", competition: "NFL", home: false },
      { opponent: "Philadelphia Eagles", result: "L", score: "17-21", date: "2024-11-17", competition: "NFL", home: true },
      { opponent: "Tampa Bay Buccaneers", result: "W", score: "30-24", date: "2024-11-10", competition: "NFL", home: false },
      { opponent: "Los Angeles Chargers", result: "W", score: "28-14", date: "2024-11-03", competition: "NFL", home: true },
    ],
  },
  {
    id: "team-bills",
    name: "Buffalo Bills",
    sport: "american_football",
    league: "NFL",
    country: "USA",
    founded: 1960,
    venue: "Highmark Stadium",
    manager: "Sean McDermott",
    form: ["W", "W", "W", "L", "W"],
    seasonStats: [
      { label: "Wins", value: 9 },
      { label: "Losses", value: 4 },
      { label: "Pts Scored", value: 347 },
      { label: "Pts Allowed", value: 248 },
      { label: "Div Record", value: "4-0" },
      { label: "Conf Record", value: "6-3" },
      { label: "Streak", value: "W3" },
    ],
    squad: [
      {
        label: "Offense",
        players: [
          { id: "p-jallen", name: "Josh Allen", position: "QB", positionFull: "Quarterback", number: 17, nationality: "USA", age: 28, keyStats: [{ label: "Pass Yds", value: 3428 }, { label: "TDs", value: 31 }, { label: "Rush Yds", value: 612 }] },
          { id: "p-sdiggs", name: "Stefon Diggs", position: "WR", positionFull: "Wide Receiver", number: 14, nationality: "USA", age: 30, keyStats: [{ label: "Rec Yds", value: 812 }, { label: "TDs", value: 5 }] },
          { id: "p-dknox", name: "Dawson Knox", position: "TE", positionFull: "Tight End", number: 88, nationality: "USA", age: 27, keyStats: [{ label: "Rec Yds", value: 412 }, { label: "TDs", value: 4 }] },
          { id: "p-jcook", name: "James Cook", position: "RB", positionFull: "Running Back", number: 4, nationality: "USA", age: 24, keyStats: [{ label: "Rush Yds", value: 904 }, { label: "TDs", value: 9 }] },
        ],
      },
      {
        label: "Defense",
        players: [
          { id: "p-vmiller", name: "Von Miller", position: "LB", positionFull: "Linebacker", number: 40, nationality: "USA", age: 35, keyStats: [{ label: "Sacks", value: 8.0 }, { label: "TFL", value: 11 }] },
          { id: "p-tdwhite", name: "Tre'Davious White", position: "CB", positionFull: "Cornerback", number: 27, nationality: "USA", age: 28, keyStats: [{ label: "INTs", value: 3 }, { label: "PDs", value: 10 }] },
        ],
      },
    ],
    pastResults: [
      { opponent: "Los Angeles Chargers", result: "W", score: "24-22", date: "2024-12-01", competition: "NFL", home: true },
      { opponent: "San Francisco 49ers", result: "W", score: "35-10", date: "2024-11-25", competition: "NFL", home: false },
      { opponent: "Indianapolis Colts", result: "W", score: "30-20", date: "2024-11-17", competition: "NFL", home: true },
      { opponent: "Kansas City Chiefs", result: "L", score: "20-27", date: "2024-11-10", competition: "NFL", home: false },
      { opponent: "Seattle Seahawks", result: "W", score: "31-10", date: "2024-11-03", competition: "NFL", home: true },
    ],
  },
  {
    id: "team-49ers",
    name: "San Francisco 49ers",
    sport: "american_football",
    league: "NFL",
    country: "USA",
    founded: 1944,
    venue: "Levi's Stadium",
    manager: "Kyle Shanahan",
    form: ["W", "L", "W", "W", "W"],
    seasonStats: [
      { label: "Wins", value: 9 },
      { label: "Losses", value: 4 },
      { label: "Pts Scored", value: 318 },
      { label: "Pts Allowed", value: 236 },
      { label: "Div Record", value: "2-3" },
      { label: "Conf Record", value: "7-2" },
      { label: "Streak", value: "W3" },
    ],
    squad: [
      {
        label: "Offense",
        players: [
          { id: "p-bpurdy", name: "Brock Purdy", position: "QB", positionFull: "Quarterback", number: 13, nationality: "USA", age: 24, keyStats: [{ label: "Pass Yds", value: 3156 }, { label: "TDs", value: 24 }, { label: "INTs", value: 7 }] },
          { id: "p-cmccaffrey", name: "Christian McCaffrey", position: "RB", positionFull: "Running Back", number: 23, nationality: "USA", age: 27, keyStats: [{ label: "Rush Yds", value: 1062 }, { label: "Rec Yds", value: 486 }, { label: "TDs", value: 16 }] },
          { id: "p-gkittle", name: "George Kittle", position: "TE", positionFull: "Tight End", number: 85, nationality: "USA", age: 30, keyStats: [{ label: "Rec Yds", value: 810 }, { label: "TDs", value: 6 }] },
          { id: "p-dsamuel", name: "Deebo Samuel", position: "WR", positionFull: "Wide Receiver", number: 19, nationality: "USA", age: 28, keyStats: [{ label: "Rec Yds", value: 562 }, { label: "Rush Yds", value: 204 }, { label: "TDs", value: 7 }] },
        ],
      },
      {
        label: "Defense",
        players: [
          { id: "p-nbosa", name: "Nick Bosa", position: "DE", positionFull: "Defensive End", number: 97, nationality: "USA", age: 26, keyStats: [{ label: "Sacks", value: 10.0 }, { label: "TFL", value: 16 }] },
          { id: "p-fwarner", name: "Fred Warner", position: "LB", positionFull: "Linebacker", number: 54, nationality: "USA", age: 27, keyStats: [{ label: "Tackles", value: 102 }, { label: "INTs", value: 2 }] },
        ],
      },
    ],
    pastResults: [
      { opponent: "Arizona Cardinals", result: "W", score: "27-14", date: "2024-12-01", competition: "NFL", home: true },
      { opponent: "Buffalo Bills", result: "L", score: "10-35", date: "2024-11-25", competition: "NFL", home: true },
      { opponent: "Seattle Seahawks", result: "W", score: "20-17", date: "2024-11-17", competition: "NFL", home: false },
      { opponent: "Dallas Cowboys", result: "W", score: "42-10", date: "2024-11-10", competition: "NFL", home: true },
      { opponent: "Los Angeles Rams", result: "W", score: "24-21", date: "2024-11-03", competition: "NFL", home: false },
    ],
  },
  {
    id: "team-eagles",
    name: "Philadelphia Eagles",
    sport: "american_football",
    league: "NFL",
    country: "USA",
    founded: 1933,
    venue: "Lincoln Financial Field",
    manager: "Nick Sirianni",
    form: ["W", "W", "L", "W", "L"],
    seasonStats: [
      { label: "Wins", value: 9 },
      { label: "Losses", value: 4 },
      { label: "Pts Scored", value: 312 },
      { label: "Pts Allowed", value: 258 },
      { label: "Div Record", value: "2-2" },
      { label: "Conf Record", value: "5-4" },
      { label: "Streak", value: "L1" },
    ],
    squad: [
      {
        label: "Offense",
        players: [
          { id: "p-jhurts", name: "Jalen Hurts", position: "QB", positionFull: "Quarterback", number: 1, nationality: "USA", age: 25, keyStats: [{ label: "Pass Yds", value: 2974 }, { label: "TDs", value: 22 }, { label: "Rush Yds", value: 742 }] },
          { id: "p-ajbrown", name: "A.J. Brown", position: "WR", positionFull: "Wide Receiver", number: 11, nationality: "USA", age: 27, keyStats: [{ label: "Rec Yds", value: 996 }, { label: "TDs", value: 7 }] },
          { id: "p-dvsmith", name: "DeVonta Smith", position: "WR", positionFull: "Wide Receiver", number: 6, nationality: "USA", age: 27, keyStats: [{ label: "Rec Yds", value: 764 }, { label: "TDs", value: 5 }] },
          { id: "p-daswift", name: "D'Andre Swift", position: "RB", positionFull: "Running Back", number: 0, nationality: "USA", age: 25, keyStats: [{ label: "Rush Yds", value: 878 }, { label: "TDs", value: 7 }] },
        ],
      },
      {
        label: "Defense",
        players: [
          { id: "p-hreddick", name: "Haason Reddick", position: "LB", positionFull: "Linebacker", number: 7, nationality: "USA", age: 29, keyStats: [{ label: "Sacks", value: 7.5 }, { label: "TFL", value: 9 }] },
          { id: "p-dslay", name: "Darius Slay", position: "CB", positionFull: "Cornerback", number: 2, nationality: "USA", age: 33, keyStats: [{ label: "INTs", value: 3 }, { label: "PDs", value: 14 }] },
        ],
      },
    ],
    pastResults: [
      { opponent: "Tennessee Titans", result: "W", score: "35-10", date: "2024-12-04", competition: "NFL", home: true },
      { opponent: "Los Angeles Rams", result: "W", score: "37-34", date: "2024-11-25", competition: "NFL", home: false },
      { opponent: "Kansas City Chiefs", result: "L", score: "21-17", date: "2024-11-17", competition: "NFL", home: false },
      { opponent: "Jacksonville Jaguars", result: "W", score: "28-23", date: "2024-11-10", competition: "NFL", home: true },
      { opponent: "Dallas Cowboys", result: "L", score: "28-34", date: "2024-11-03", competition: "NFL", home: false },
    ],
  },
  // ─── IPL / CRICKET ───────────────────────────────────────────────────────
  {
    id: "team-mumbai",
    name: "Mumbai Indians",
    sport: "cricket",
    league: "IPL",
    country: "India",
    founded: 2008,
    venue: "Wankhede Stadium",
    manager: "Mark Boucher",
    form: ["W", "L", "W", "W", "W"],
    seasonStats: [
      { label: "Matches", value: 12 },
      { label: "Won", value: 7 },
      { label: "Lost", value: 5 },
      { label: "NRR", value: "+0.432" },
      { label: "Pts", value: 14 },
      { label: "Position", value: "3rd" },
    ],
    squad: [
      {
        label: "Batters",
        players: [
          { id: "p-rohit", name: "Rohit Sharma", position: "BAT", positionFull: "Opener / Captain", number: 45, nationality: "India", age: 36, keyStats: [{ label: "Runs", value: 412 }, { label: "Average", value: 34.3 }, { label: "SR", value: "138.5" }] },
          { id: "p-sky", name: "Suryakumar Yadav", position: "BAT", positionFull: "Middle Order", number: 63, nationality: "India", age: 33, keyStats: [{ label: "Runs", value: 524 }, { label: "Average", value: 47.6 }, { label: "SR", value: "172.3" }] },
          { id: "p-ikishan", name: "Ishan Kishan", position: "WK", positionFull: "Wicket-keeper Batter", number: 32, nationality: "India", age: 25, keyStats: [{ label: "Runs", value: 388 }, { label: "Average", value: 32.3 }] },
          { id: "p-tvarma", name: "Tilak Varma", position: "BAT", positionFull: "Middle Order", number: 8, nationality: "India", age: 21, keyStats: [{ label: "Runs", value: 304 }, { label: "SR", value: "148.0" }] },
        ],
      },
      {
        label: "All-rounders",
        players: [
          { id: "p-hpandya", name: "Hardik Pandya", position: "AR", positionFull: "All-rounder / Vice-Captain", number: 33, nationality: "India", age: 30, keyStats: [{ label: "Runs", value: 282 }, { label: "Wickets", value: 9 }, { label: "Economy", value: 8.4 }] },
          { id: "p-tdavid", name: "Tim David", position: "BAT", positionFull: "Finisher", number: 8, nationality: "Singapore", age: 28, keyStats: [{ label: "Runs", value: 264 }, { label: "SR", value: "162.9" }] },
        ],
      },
      {
        label: "Bowlers",
        players: [
          { id: "p-bumrah", name: "Jasprit Bumrah", position: "BOWL", positionFull: "Fast Bowler", number: 93, nationality: "India", age: 30, keyStats: [{ label: "Wickets", value: 18 }, { label: "Economy", value: 6.8 }, { label: "Average", value: 14.2 }] },
          { id: "p-pchawla", name: "Piyush Chawla", position: "BOWL", positionFull: "Leg Spin Bowler", number: 23, nationality: "India", age: 35, keyStats: [{ label: "Wickets", value: 11 }, { label: "Economy", value: 7.9 }] },
        ],
      },
    ],
    pastResults: [
      { opponent: "Delhi Capitals", result: "W", score: "186/5 def 174/8", date: "2024-11-28", competition: "IPL", home: true },
      { opponent: "Rajasthan Royals", result: "L", score: "162/8 lost to 183/4", date: "2024-11-21", competition: "IPL", home: false },
      { opponent: "Sunrisers Hyderabad", result: "W", score: "201/5 def 192/7", date: "2024-11-14", competition: "IPL", home: true },
      { opponent: "Kolkata Knight Riders", result: "W", score: "177/6 def 165/9", date: "2024-11-07", competition: "IPL", home: false },
      { opponent: "Royal Challengers", result: "W", score: "194/4 def 182/6", date: "2024-10-31", competition: "IPL", home: true },
    ],
  },
  {
    id: "team-csk",
    name: "Chennai Super Kings",
    sport: "cricket",
    league: "IPL",
    country: "India",
    founded: 2008,
    venue: "M. A. Chidambaram Stadium",
    manager: "Stephen Fleming",
    form: ["W", "W", "L", "W", "L"],
    seasonStats: [
      { label: "Matches", value: 12 },
      { label: "Won", value: 6 },
      { label: "Lost", value: 6 },
      { label: "NRR", value: "+0.098" },
      { label: "Pts", value: 12 },
      { label: "Position", value: "5th" },
    ],
    squad: [
      {
        label: "Batters",
        players: [
          { id: "p-rgaikwad", name: "Ruturaj Gaikwad", position: "BAT", positionFull: "Opener / Captain", number: 31, nationality: "India", age: 27, keyStats: [{ label: "Runs", value: 484 }, { label: "Average", value: 44.0 }, { label: "SR", value: "141.5" }] },
          { id: "p-dconway", name: "Devon Conway", position: "WK", positionFull: "Wicket-keeper Batter", number: 6, nationality: "New Zealand", age: 32, keyStats: [{ label: "Runs", value: 396 }, { label: "Average", value: 36.0 }] },
          { id: "p-mdhoni", name: "MS Dhoni", position: "WK", positionFull: "Finisher / Legend", number: 7, nationality: "India", age: 42, keyStats: [{ label: "Runs", value: 198 }, { label: "SR", value: "168.6" }] },
        ],
      },
      {
        label: "All-rounders",
        players: [
          { id: "p-rjadeja", name: "Ravindra Jadeja", position: "AR", positionFull: "All-rounder", number: 8, nationality: "India", age: 35, keyStats: [{ label: "Runs", value: 228 }, { label: "Wickets", value: 12 }, { label: "Economy", value: 7.4 }] },
          { id: "p-moeen", name: "Moeen Ali", position: "AR", positionFull: "All-rounder", number: 26, nationality: "England", age: 36, keyStats: [{ label: "Runs", value: 162 }, { label: "Wickets", value: 8 }] },
        ],
      },
      {
        label: "Bowlers",
        players: [
          { id: "p-dchahar", name: "Deepak Chahar", position: "BOWL", positionFull: "Medium Fast", number: 90, nationality: "India", age: 31, keyStats: [{ label: "Wickets", value: 14 }, { label: "Economy", value: 7.6 }, { label: "Average", value: 18.1 }] },
          { id: "p-tdeshpande", name: "Tushar Deshpande", position: "BOWL", positionFull: "Fast Bowler", number: 28, nationality: "India", age: 27, keyStats: [{ label: "Wickets", value: 11 }, { label: "Economy", value: 9.1 }] },
        ],
      },
    ],
    pastResults: [
      { opponent: "Punjab Kings", result: "W", score: "192/4 def 179/7", date: "2024-11-29", competition: "IPL", home: true },
      { opponent: "Mumbai Indians", result: "W", score: "168/5 def 162/8", date: "2024-11-22", competition: "IPL", home: false },
      { opponent: "Lucknow Super Giants", result: "L", score: "158/7 lost to 159/4", date: "2024-11-15", competition: "IPL", home: true },
      { opponent: "Delhi Capitals", result: "W", score: "187/3 def 175/6", date: "2024-11-08", competition: "IPL", home: false },
      { opponent: "Gujarat Titans", result: "L", score: "164/8 lost to 172/5", date: "2024-11-01", competition: "IPL", home: true },
    ],
  },
];
