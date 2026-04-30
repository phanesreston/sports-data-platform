import { NextRequest, NextResponse } from "next/server";
import { apiFetch, unwrap, currentSeason } from "@/lib/apifootball";
import type { ApiFixture } from "@/lib/types";

const SEASON = currentSeason();

export async function GET(req: NextRequest) {
  const team   = req.nextUrl.searchParams.get("team");
  const season = Number(req.nextUrl.searchParams.get("season") ?? SEASON);

  if (!team) return NextResponse.json({ upcoming: [], recent: [] });

  const [upcomingRes, recentRes] = await Promise.all([
    apiFetch<ApiFixture>("/fixtures", { team, season, next: 10 }, 300),
    apiFetch<ApiFixture>("/fixtures", { team, season, last: 15 }, 300),
  ]);

  const upcoming = (unwrap(upcomingRes) ?? []).filter(
    (f) => f.fixture.status.short === "NS" || f.fixture.status.short === "TBD"
  );
  const recent = (unwrap(recentRes) ?? []).filter(
    (f) => ["FT", "AET", "PEN"].includes(f.fixture.status.short)
  );

  return NextResponse.json({ upcoming, recent });
}
