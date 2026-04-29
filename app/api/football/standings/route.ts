import { NextRequest, NextResponse } from "next/server";
import { apiFetch, unwrap, currentSeason } from "@/lib/apifootball";

const SEASON = currentSeason();

export interface ApiStanding {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  form: string;
  description: string | null;
  all:  { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  home: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  away: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
}

interface ApiStandingsResponse {
  league: {
    id: number;
    name: string;
    logo: string;
    country: string;
    flag: string;
    season: number;
    standings: ApiStanding[][];
  };
}

export async function GET(req: NextRequest) {
  const league = req.nextUrl.searchParams.get("league") ?? "39";
  const season = req.nextUrl.searchParams.get("season") ?? String(SEASON);

  const res = unwrap(
    await apiFetch<ApiStandingsResponse>("/standings", { league, season }, 3600)
  );

  if (!res?.length) {
    return NextResponse.json({ error: "Standings not found" }, { status: 404 });
  }

  const { league: leagueData } = res[0];
  return NextResponse.json({
    league: {
      id:      leagueData.id,
      name:    leagueData.name,
      logo:    leagueData.logo,
      country: leagueData.country,
      season:  leagueData.season,
    },
    standings: leagueData.standings[0] ?? [], // standings[0] = main table
  });
}
