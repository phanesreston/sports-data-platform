// /api/football/fixture-lineup — fetches the lineup and match events for the
// most recently completed fixture of a given team. Used by the Overview tab's
// "Last Starting 11" section.
//
// The endpoint does two sequential steps:
//   1. GET /fixtures?team={id}&last=1  → find the most recent finished fixture
//   2. GET /fixtures/lineups + /fixtures/events (parallel) for that fixture ID
//
// Returns: { fixture, lineups, events } or { fixture: null } if no data found.

import { NextRequest, NextResponse } from "next/server";
import { apiFetch, unwrap } from "@/lib/apifootball";
import type { ApiFixture } from "@/lib/types";

// ── types ─────────────────────────────────────────────────────────────────────

interface LineupPlayer {
  id: number;
  name: string;
  number: number;
  pos: string;
  grid: string | null; // "row:col" e.g. "2:3" — null for substitutes
}

interface ApiLineup {
  team: { id: number; name: string; logo: string; colors: unknown };
  coach: { id: number; name: string; photo: string };
  formation: string; // e.g. "4-3-3"
  startXI: { player: LineupPlayer }[];
  substitutes: { player: LineupPlayer }[];
}

interface ApiEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string; logo: string };
  player: { id: number | null; name: string };
  assist: { id: number | null; name: string | null };
  type: string;   // "Goal" | "Card" | "subst" | "Var"
  detail: string; // "Normal Goal" | "Yellow Card" | "Red Card" | "Own Goal" | "Penalty" etc.
  comments: string | null;
}

export async function GET(req: NextRequest) {
  const teamId = req.nextUrl.searchParams.get("team");
  if (!teamId) return NextResponse.json({ fixture: null }, { status: 400 });

  // Step 1: get the last completed fixture for this team.
  // `last: 1` returns the single most recently finished fixture.
  const fixtureRes = await apiFetch<ApiFixture>("/fixtures", { team: teamId, last: 1 }, 300);
  const fixtures = unwrap(fixtureRes);

  if (!fixtures?.length) {
    return NextResponse.json({ fixture: null });
  }

  const f = fixtures[0];

  // Only proceed if the fixture is actually finished (FT / AET / PEN).
  // "last" occasionally returns live or postponed matches if the team hasn't
  // played recently.
  if (!["FT", "AET", "PEN"].includes(f.fixture.status.short)) {
    return NextResponse.json({ fixture: null });
  }

  const fixtureId = f.fixture.id;

  // Step 2: fetch lineup and events in parallel — no dependency between them.
  const [lineupRes, eventsRes] = await Promise.all([
    apiFetch<ApiLineup>("/fixtures/lineups", { fixture: fixtureId }, 86400),
    apiFetch<ApiEvent>("/fixtures/events", { fixture: fixtureId }, 86400),
  ]);

  // Shape the fixture summary — includes venue from the nested fixture object
  const fixtureSummary = {
    id:    f.fixture.id,
    date:  f.fixture.date,
    round: f.league.round,
    venue: (f.fixture as ApiFixture["fixture"] & { venue?: { name: string } }).venue?.name ?? null,
    league: {
      id:   f.league.id,
      name: f.league.name,
      logo: f.league.logo,
    },
    teams: f.teams,
    goals: f.goals,
    score: f.score,
  };

  return NextResponse.json({
    fixture:  fixtureSummary,
    lineups:  unwrap(lineupRes)  ?? [],
    events:   unwrap(eventsRes)  ?? [],
  });
}
