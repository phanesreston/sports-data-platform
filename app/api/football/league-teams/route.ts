import { NextRequest, NextResponse } from "next/server";
import { apiFetch, unwrap, currentSeason } from "@/lib/apifootball";

const SEASON = currentSeason();

interface ApiTeamEntry {
  team: { id: number; name: string; code: string; country: string; founded: number | null; logo: string };
  venue: { id: number; name: string; address: string; city: string; capacity: number | null; surface: string };
}

export async function GET(req: NextRequest) {
  const league = req.nextUrl.searchParams.get("league");
  const season = Number(req.nextUrl.searchParams.get("season") ?? SEASON);

  if (!league) return NextResponse.json({ error: "league required" }, { status: 400 });

  const res = await apiFetch<ApiTeamEntry>("/teams", { league, season }, 3600);
  const teams = (unwrap(res) ?? []).sort((a, b) =>
    a.team.name.localeCompare(b.team.name)
  );

  return NextResponse.json({ teams });
}
