import { NextRequest, NextResponse } from "next/server";
import { apiFetch, unwrap } from "@/lib/apifootball";
import type { ApiFixture } from "@/lib/types";

export interface H2HMatch {
  date: string;
  homeTeamId: number;
  homeTeam: string;
  homeLogo: string;
  homeScore: number | null;
  awayTeamId: number;
  awayTeam: string;
  awayLogo: string;
  awayScore: number | null;
  winner: "home" | "away" | "draw" | null;
  league: string;
  leagueLogo: string;
}

export async function GET(req: NextRequest) {
  const home = req.nextUrl.searchParams.get("home");
  const away = req.nextUrl.searchParams.get("away");
  const last = req.nextUrl.searchParams.get("last") ?? "5";

  if (!home || !away) {
    return NextResponse.json({ matches: [] });
  }

  const raw = await apiFetch<ApiFixture>(
    "/fixtures/headtohead",
    { h2h: `${home}-${away}`, last: parseInt(last, 10) },
    3600
  );

  const fixtures = unwrap(raw);
  if (!fixtures) {
    return NextResponse.json({ matches: [] });
  }

  // Only completed matches (FT, AET, PEN)
  const finished = fixtures.filter((f) =>
    ["FT", "AET", "PEN"].includes(f.fixture.status.short)
  );

  const matches: H2HMatch[] = finished
    .sort((a, b) => b.fixture.timestamp - a.fixture.timestamp)
    .map((f) => {
      const hg = f.goals.home;
      const ag = f.goals.away;
      let winner: H2HMatch["winner"] = null;
      if (hg !== null && ag !== null) {
        winner = hg > ag ? "home" : ag > hg ? "away" : "draw";
      }
      return {
        date:       f.fixture.date,
        homeTeamId: f.teams.home.id,
        homeTeam:   f.teams.home.name,
        homeLogo:   f.teams.home.logo,
        homeScore:  hg,
        awayTeamId: f.teams.away.id,
        awayTeam:   f.teams.away.name,
        awayLogo:   f.teams.away.logo,
        awayScore:  ag,
        winner,
        league:     f.league.name,
        leagueLogo: f.league.logo,
      };
    });

  return NextResponse.json({ matches });
}
