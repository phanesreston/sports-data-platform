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

const FINISHED = ["FT", "AET", "PEN"];
const UPCOMING  = ["NS", "TBD"];

export async function GET(req: NextRequest) {
  const league = req.nextUrl.searchParams.get("league");
  const season = Number(req.nextUrl.searchParams.get("season") ?? SEASON);
  const round  = req.nextUrl.searchParams.get("round");

  if (!league) return NextResponse.json({ error: "league required" }, { status: 400 });

  if (round) {
    const res = await apiFetch<ApiFixture>("/fixtures", { league, season, round }, 300);
    const all = (unwrap(res) ?? []).sort(
      (a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
    );
    return NextResponse.json({
      all,
      upcoming: all.filter((f) => UPCOMING.includes(f.fixture.status.short)),
      recent:   all.filter((f) => FINISHED.includes(f.fixture.status.short)),
      live:     all.filter((f) => !UPCOMING.includes(f.fixture.status.short) && !FINISHED.includes(f.fixture.status.short) && !["PST", "CANC", "SUSP"].includes(f.fixture.status.short)),
    });
  }

  const [upcomingRes, recentRes] = await Promise.all([
    apiFetch<ApiFixture>("/fixtures", { league, season, next: 20 }, 300),
    apiFetch<ApiFixture>("/fixtures", { league, season, last: 10 }, 300),
  ]);

  return NextResponse.json({
    upcoming: (unwrap(upcomingRes) ?? []).filter((f) => UPCOMING.includes(f.fixture.status.short)),
    recent:   (unwrap(recentRes)   ?? []).filter((f) => FINISHED.includes(f.fixture.status.short)),
  });
}
