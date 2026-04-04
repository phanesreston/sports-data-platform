import { NextRequest, NextResponse } from "next/server";
import { apiFetch, unwrap } from "@/lib/apifootball";

const SEASON = 2024;

export interface ApiPlayerFull {
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    nationality: string;
    height: string | null;
    weight: string | null;
    photo: string;
    injured: boolean;
  };
  statistics: {
    team:   { id: number; name: string; logo: string };
    league: { id: number; name: string; logo: string; country: string; season: number };
    games: {
      appearences: number | null;
      lineups:     number | null;
      minutes:     number | null;
      position:    string;
      rating:      string | null;
    };
    goals:   { total: number | null; assists: number | null; conceded: number | null; saves: number | null };
    shots:   { total: number | null; on: number | null };
    passes:  { total: number | null; key: number | null; accuracy: string | null };
    tackles: { total: number | null; blocks: number | null; interceptions: number | null };
    duels:   { total: number | null; won: number | null };
    dribbles:{ attempts: number | null; success: number | null };
    cards:   { yellow: number; red: number };
  }[];
}

export async function GET(req: NextRequest) {
  const id     = req.nextUrl.searchParams.get("id");
  const season = req.nextUrl.searchParams.get("season") ?? String(SEASON);

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const res = unwrap(await apiFetch<ApiPlayerFull>("/players", { id, season }, 3600));
  if (!res?.length) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  return NextResponse.json({ player: res[0] });
}
