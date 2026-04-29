import { NextRequest, NextResponse } from "next/server";
import { apiFetch, unwrap, currentSeason } from "@/lib/apifootball";

const SEASON = currentSeason();

export const TOP_LEAGUES = [
  { id: 39,  name: "Premier League",  country: "England",  flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: 140, name: "La Liga",          country: "Spain",    flag: "🇪🇸" },
  { id: 135, name: "Serie A",          country: "Italy",    flag: "🇮🇹" },
  { id: 78,  name: "Bundesliga",       country: "Germany",  flag: "🇩🇪" },
  { id: 61,  name: "Ligue 1",          country: "France",   flag: "🇫🇷" },
  { id: 2,   name: "Champions League", country: "Europe",   flag: "🏆" },
  { id: 3,   name: "Europa League",    country: "Europe",   flag: "🇪🇺" },
];

interface ApiLeagueInfo {
  league: { id: number; name: string; logo: string };
  country: { name: string; flag: string };
  seasons: { year: number; current: boolean }[];
}

async function fetchLeagueInfo(id: number) {
  const meta = TOP_LEAGUES.find((l) => l.id === id);
  const res = unwrap(await apiFetch<ApiLeagueInfo>("/leagues", { id, season: SEASON }, 86400));
  const info = res?.[0];
  return {
    id,
    name:    meta?.name    ?? info?.league.name    ?? String(id),
    country: meta?.country ?? info?.country.name   ?? "",
    flag:    meta?.flag    ?? "",
    logo:    info?.league.logo ?? "",
    season:  SEASON,
  };
}

export async function GET(req: NextRequest) {
  const idParam = req.nextUrl.searchParams.get("id");

  // Single league lookup
  if (idParam) {
    const league = await fetchLeagueInfo(Number(idParam));
    return NextResponse.json({ league });
  }

  // All top leagues
  const leagues = await Promise.all(TOP_LEAGUES.map((l) => fetchLeagueInfo(l.id)));
  return NextResponse.json({ leagues });
}
