import { NextRequest, NextResponse } from "next/server";
import { apiFetch, unwrap, currentSeason } from "@/lib/apifootball";

const SEASON = currentSeason();

interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string; long: string; elapsed: number | null };
  };
  league: { id: number; name: string; logo: string; round: string };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
}

export async function GET(req: NextRequest) {
  const league = req.nextUrl.searchParams.get("league");
  const season = Number(req.nextUrl.searchParams.get("season") ?? SEASON);

  if (!league) return NextResponse.json({ error: "league required" }, { status: 400 });

  const [upcomingRes, recentRes] = await Promise.all([
    apiFetch<ApiFixture>("/fixtures", { league, season, next: 20 }, 300),
    apiFetch<ApiFixture>("/fixtures", { league, season, last: 10 }, 300),
  ]);

  const upcoming = (unwrap(upcomingRes) ?? []).filter(
    (f) => f.fixture.status.short === "NS" || f.fixture.status.short === "TBD"
  );
  const recent = (unwrap(recentRes) ?? []).filter(
    (f) => f.fixture.status.short === "FT" || f.fixture.status.short === "AET" || f.fixture.status.short === "PEN"
  );

  return NextResponse.json({ upcoming, recent });
}
