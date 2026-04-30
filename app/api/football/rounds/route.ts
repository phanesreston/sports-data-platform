import { NextRequest, NextResponse } from "next/server";
import { apiFetch, unwrap, currentSeason } from "@/lib/apifootball";

const SEASON = currentSeason();

export async function GET(req: NextRequest) {
  const league = req.nextUrl.searchParams.get("league");
  const season = Number(req.nextUrl.searchParams.get("season") ?? SEASON);

  if (!league) return NextResponse.json({ rounds: [], current: null });

  const [allRes, currentRes] = await Promise.all([
    apiFetch<string>("/fixtures/rounds", { league, season }, 3600),
    apiFetch<string>("/fixtures/rounds", { league, season, current: "true" }, 300),
  ]);

  const rounds = unwrap(allRes) ?? [];
  const current = (unwrap(currentRes) ?? [])[0] ?? rounds[rounds.length - 1] ?? null;

  return NextResponse.json({ rounds, current });
}
