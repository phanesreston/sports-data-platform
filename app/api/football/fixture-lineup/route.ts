// /api/football/fixture-lineup — last starting lineup for a team.
//
// Lineup and match event data are not stored in the database.
// Returns an empty response so the team page shows "No recent lineup data available"
// rather than making live API calls for historical data.
//
// Usage: GET /api/football/fixture-lineup?team={id}

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ fixture: null, lineups: [], events: [] });
}
