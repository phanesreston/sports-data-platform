import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://api.the-odds-api.com/v4";

// Returns in-season sports from The Odds API.
// This endpoint does NOT count against the usage quota.
// Use it to check which sports are currently active before fetching odds.
export async function GET(req: NextRequest) {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ sports: [], error: "ODDS_API_KEY not configured" });
  }

  const all = req.nextUrl.searchParams.get("all") === "true";

  try {
    const url = new URL(`${BASE_URL}/sports`);
    url.searchParams.set("apiKey", apiKey);
    if (all) url.searchParams.set("all", "true");

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 }, // cache 1 hour — list rarely changes
    });

    if (!res.ok) {
      return NextResponse.json({ sports: [], error: `status_${res.status}` });
    }

    const sports = await res.json();
    return NextResponse.json({ sports });
  } catch (err) {
    console.error("[Odds API /sports] fetch error:", err);
    return NextResponse.json({ sports: [], error: "fetch_failed" });
  }
}
