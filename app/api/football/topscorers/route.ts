import { NextRequest, NextResponse } from "next/server";
import { apiFetch, unwrap, currentSeason } from "@/lib/apifootball";

const SEASON = currentSeason();

export interface ApiTopScorer {
  player: {
    id: number;
    name: string;
    photo: string;
    nationality: string;
    age: number;
  };
  statistics: {
    team:   { id: number; name: string; logo: string };
    league: { id: number; name: string };
    games:  { appearences: number | null; minutes: number | null };
    goals:  { total: number | null; assists: number | null };
    shots:  { total: number | null; on: number | null };
  }[];
}

export async function GET(req: NextRequest) {
  const league = req.nextUrl.searchParams.get("league") ?? "39";
  const season = req.nextUrl.searchParams.get("season") ?? String(SEASON);

  const [scorers, assisters] = await Promise.all([
    unwrap(await apiFetch<ApiTopScorer>("/players/topscorers",  { league, season }, 3600)),
    unwrap(await apiFetch<ApiTopScorer>("/players/topassists",  { league, season }, 3600)),
  ]);

  return NextResponse.json({
    topScorers:  scorers  ?? [],
    topAssists:  assisters ?? [],
  });
}
