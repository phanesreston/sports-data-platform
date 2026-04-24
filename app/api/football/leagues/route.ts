import { NextResponse } from "next/server";
import { apiFetch, unwrap } from "@/lib/apifootball";

const SEASON = 2024;

const TOP_LEAGUES = [
  { id: 39,  name: "Premier League", country: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: 140, name: "La Liga",         country: "Spain",   flag: "🇪🇸" },
  { id: 135, name: "Serie A",         country: "Italy",   flag: "🇮🇹" },
  { id: 78,  name: "Bundesliga",      country: "Germany", flag: "🇩🇪" },
  { id: 61,  name: "Ligue 1",         country: "France",  flag: "🇫🇷" },
];

interface ApiLeagueInfo {
  league: { id: number; name: string; logo: string };
  country: { name: string; flag: string };
  seasons: { year: number; current: boolean }[];
}

export async function GET() {
  const results = await Promise.all(
    TOP_LEAGUES.map(({ id }) =>
      apiFetch<ApiLeagueInfo>("/leagues", { id, season: SEASON }, 86400)
    )
  );

  const leagues = TOP_LEAGUES.map((meta, i) => {
    const info = unwrap(results[i])?.[0];
    return {
      id:      meta.id,
      name:    meta.name,
      country: meta.country,
      flag:    meta.flag,
      logo:    info?.league.logo ?? "",
      season:  SEASON,
    };
  });

  return NextResponse.json({ leagues });
}
