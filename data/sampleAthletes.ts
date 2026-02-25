import type { Sport } from "./sampleOdds";
import { SAMPLE_TEAMS, type TeamPlayer } from "./sampleTeams";

export interface AthleteProfile {
  id: string;
  name: string;
  fullName: string;
  sport: Sport;
  league: string;
  nationality: string;
  flag: string;
  age: number;
  ranking: number;
  bio: string;
  keyStats: { label: string; value: string | number }[];
  form: ("W" | "L")[];
  pastResults: {
    opponent: string;
    result: "W" | "L";
    score: string;
    date: string;
    competition: string;
  }[];
}

/** Individual (non-team) athletes — tennis players etc. */
export const SAMPLE_ATHLETES: AthleteProfile[] = [
  {
    id: "athlete-djokovic",
    name: "N. Djokovic",
    fullName: "Novak Djokovic",
    sport: "tennis",
    league: "ATP Tour",
    nationality: "Serbia",
    flag: "🇷🇸",
    age: 37,
    ranking: 3,
    bio: "24-time Grand Slam champion and former world No. 1. One of the greatest tennis players of all time, known for his exceptional return game and mental strength.",
    keyStats: [
      { label: "Grand Slams", value: 24 },
      { label: "Win Rate", value: "83%" },
      { label: "Career Wins", value: 1098 },
      { label: "Aces/Match", value: 7.2 },
      { label: "1st Serve %", value: "61%" },
      { label: "Break %", value: "48%" },
    ],
    form: ["W", "W", "L", "W", "W"],
    pastResults: [
      { opponent: "C. Alcaraz", result: "W", score: "7-6(3) 6-4", date: "2024-11-15", competition: "ATP Finals" },
      { opponent: "J. Sinner", result: "L", score: "2-6 5-7", date: "2024-11-12", competition: "ATP Finals" },
      { opponent: "D. Medvedev", result: "W", score: "6-3 6-4", date: "2024-11-06", competition: "ATP Finals" },
      { opponent: "T. Fritz", result: "W", score: "6-4 7-5", date: "2024-10-30", competition: "Paris Masters" },
      { opponent: "H. Rune", result: "W", score: "6-3 7-6(4)", date: "2024-10-24", competition: "Paris Masters" },
    ],
  },
  {
    id: "athlete-alcaraz",
    name: "C. Alcaraz",
    fullName: "Carlos Alcaraz",
    sport: "tennis",
    league: "ATP Tour",
    nationality: "Spain",
    flag: "🇪🇸",
    age: 21,
    ranking: 2,
    bio: "Two-time Grand Slam champion who became the youngest world No. 1 in ATP history at just 19. Known for his explosive game and court coverage.",
    keyStats: [
      { label: "Grand Slams", value: 3 },
      { label: "Win Rate", value: "79%" },
      { label: "Career Wins", value: 186 },
      { label: "Aces/Match", value: 6.4 },
      { label: "1st Serve %", value: "63%" },
      { label: "Break %", value: "44%" },
    ],
    form: ["W", "W", "W", "L", "W"],
    pastResults: [
      { opponent: "N. Djokovic", result: "L", score: "6-7(3) 4-6", date: "2024-11-15", competition: "ATP Finals" },
      { opponent: "A. Zverev", result: "W", score: "6-4 6-3", date: "2024-11-10", competition: "ATP Finals" },
      { opponent: "H. Hurkacz", result: "W", score: "6-4 7-5", date: "2024-11-07", competition: "ATP Finals" },
      { opponent: "T. Fritz", result: "W", score: "6-3 6-4", date: "2024-10-28", competition: "Paris Masters" },
      { opponent: "J. Sinner", result: "W", score: "7-5 6-3", date: "2024-10-20", competition: "Vienna Open" },
    ],
  },
  {
    id: "athlete-sinner",
    name: "J. Sinner",
    fullName: "Jannik Sinner",
    sport: "tennis",
    league: "ATP Tour",
    nationality: "Italy",
    flag: "🇮🇹",
    age: 23,
    ranking: 1,
    bio: "Current world No. 1 and 2024 Australian Open champion. The Italian phenom has risen rapidly through the ranks with his powerful baseline game.",
    keyStats: [
      { label: "Grand Slams", value: 2 },
      { label: "Win Rate", value: "80%" },
      { label: "Career Wins", value: 214 },
      { label: "Aces/Match", value: 5.8 },
      { label: "1st Serve %", value: "65%" },
      { label: "Break %", value: "43%" },
    ],
    form: ["W", "W", "W", "L", "W"],
    pastResults: [
      { opponent: "N. Djokovic", result: "W", score: "6-2 7-5", date: "2024-11-12", competition: "ATP Finals" },
      { opponent: "C. Alcaraz", result: "L", score: "5-7 3-6", date: "2024-10-20", competition: "Vienna Open" },
      { opponent: "A. Zverev", result: "W", score: "6-3 6-4", date: "2024-11-03", competition: "Vienna Open" },
      { opponent: "D. Medvedev", result: "W", score: "7-6(4) 6-3", date: "2024-10-14", competition: "Shanghai Masters" },
      { opponent: "C. Alcaraz", result: "W", score: "6-1 6-2", date: "2024-10-07", competition: "Shanghai Masters" },
    ],
  },
  {
    id: "athlete-medvedev",
    name: "D. Medvedev",
    fullName: "Daniil Medvedev",
    sport: "tennis",
    league: "ATP Tour",
    nationality: "Russia",
    flag: "🇷🇺",
    age: 28,
    ranking: 4,
    bio: "Former world No. 1 and 2021 US Open champion. Known for his unorthodox playing style, incredible court coverage, and ability to win from seemingly impossible positions.",
    keyStats: [
      { label: "Grand Slams", value: 1 },
      { label: "Win Rate", value: "76%" },
      { label: "Career Wins", value: 418 },
      { label: "Aces/Match", value: 8.1 },
      { label: "1st Serve %", value: "60%" },
      { label: "Break %", value: "40%" },
    ],
    form: ["L", "W", "W", "W", "W"],
    pastResults: [
      { opponent: "N. Djokovic", result: "L", score: "3-6 4-6", date: "2024-11-06", competition: "ATP Finals" },
      { opponent: "A. Zverev", result: "W", score: "6-4 4-6 6-3", date: "2024-11-02", competition: "ATP Finals" },
      { opponent: "H. Hurkacz", result: "W", score: "6-3 6-4", date: "2024-10-30", competition: "Paris Masters" },
      { opponent: "S. Tsitsipas", result: "W", score: "7-5 6-4", date: "2024-10-24", competition: "Paris Masters" },
      { opponent: "C. Norrie", result: "W", score: "6-2 6-1", date: "2024-10-19", competition: "Stockholm Open" },
    ],
  },
];

/** Look up a player from any team squad by their ID */
export function findTeamPlayer(
  playerId: string
): (TeamPlayer & { teamId: string; teamName: string; sport: Sport; league: string }) | null {
  for (const team of SAMPLE_TEAMS) {
    for (const group of team.squad) {
      const player = group.players.find((p) => p.id === playerId);
      if (player) {
        return {
          ...player,
          teamId: team.id,
          teamName: team.name,
          sport: team.sport,
          league: team.league,
        };
      }
    }
  }
  return null;
}

/** Unified lookup: individual athlete or team player */
export function findAthlete(id: string): AthleteProfile | null {
  return SAMPLE_ATHLETES.find((a) => a.id === id) ?? null;
}
