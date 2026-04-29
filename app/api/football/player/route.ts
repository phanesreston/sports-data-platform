import { NextRequest, NextResponse } from "next/server";
import { apiFetch, unwrap, isRateLimited, currentSeason } from "@/lib/apifootball";

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

const SEASONS = [currentSeason(), 2024, 2023];

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  for (const season of SEASONS) {
    // Short revalidate (60s) so rate-limit errors are never cached for long
    const raw = await apiFetch<ApiPlayerFull>("/players", { id, season }, 60);

    if (isRateLimited(raw)) {
      console.warn(`[player] rate limited fetching player ${id} season ${season}`);
      return NextResponse.json({ error: "Rate limited — try again in a moment" }, { status: 429 });
    }

    const res = unwrap(raw);
    if (res?.length) {
      console.log(`[player] found player ${id} in season ${season}`);
      return NextResponse.json({ player: res[0] });
    }

    console.log(`[player] no data for player ${id} season ${season}, trying next`);
  }

  console.warn(`[player] player ${id} not found in any season`);
  return NextResponse.json({ error: "Player not found" }, { status: 404 });
}
