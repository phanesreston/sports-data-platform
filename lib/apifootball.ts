import type { ApiFootballResponse } from "./types";

const BASE_URL = "https://v3.football.api-sports.io";

// Maps Odds API / user-facing team names to the name API-Football stores them
// under when no substring overlap exists. Add entries as mismatches appear in logs.
export const TEAM_NAME_ALIASES: Record<string, string> = {
  "Wolverhampton Wanderers": "Wolves",
};

/**
 * From a list of API-Football team results, pick the best match for `query`.
 * Filters out youth/reserve teams when the query is for a senior club.
 * Prefers exact name match, then first remaining result.
 */
export function pickBestTeam<T extends { team: { name: string } }>(
  results: T[],
  query: string
): T | null {
  if (!results.length) return null;
  const q = query.toLowerCase();
  const queryIsYouth =
    /\b(u\d{2}|u-\d{2}|youth|reserve|junior|ii\b|b\s?team)\b/i.test(query);
  let pool = results;
  if (!queryIsYouth) {
    const seniors = results.filter(
      (r) =>
        !/\b(u\d{2}|u-\d{2}|youth|reserves?|juniors?|\bii\b|b\s?team)\b/i.test(
          r.team.name
        )
    );
    // If ALL results are youth teams and we're not querying for youth → no match
    if (!seniors.length) return null;
    pool = seniors;
  }
  return pool.find((r) => r.team.name.toLowerCase() === q) ?? pool[0];
}

/**
 * Generate progressive search variants for a team name.
 *
 * Uses three tiers — most-specific first — and stops at the first API hit:
 *   1. Exact name:           "Brighton & Hove Albion"
 *   2. &-stripped form:      "Brighton Hove Albion"
 *   3. First word only:      "Brighton"
 *
 * Deliberately avoids trailing generic words like "Albion", "Wanderers",
 * "City" etc. that would match the wrong club.
 */
export function getTeamSearchVariants(name: string): string[] {
  const seen = new Set<string>();
  const add = (v: string) => { const t = v.trim(); if (t.length >= 3) seen.add(t); };

  // Tier 1: exact
  add(name);

  // Tier 2: strip & — "Brighton & Hove Albion" → "Brighton Hove Albion"
  const stripped = name.replace(/\s*&\s*/g, " ").replace(/\s+/g, " ").trim();
  if (stripped !== name) add(stripped);

  // Tier 3: first two words — "West Ham United" → "West Ham", "Tottenham Hotspur" → "Tottenham Hotspur" (unchanged, only 2 words)
  const words = name.split(/[\s&]+/).filter(Boolean);
  if (words.length >= 3) {
    const twoWords = words.slice(0, 2).join(" ");
    if (twoWords !== name) add(twoWords);
  }

  // Tier 4: first word only (most specific single-word identifier for the club)
  const firstWord = words[0];
  if (firstWord && firstWord !== name && firstWord.length >= 4) add(firstWord);

  return Array.from(seen);
}

export async function apiFetch<T>(
  path: string,
  params: Record<string, string | number>,
  revalidate = 300
): Promise<ApiFootballResponse<T> | null> {
  const key = process.env.API_SPORTS_KEY;
  if (!key) return null;

  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  try {
    const res = await fetch(url.toString(), {
      headers: { "x-apisports-key": key },
      next: { revalidate },
    });

    if (!res.ok) {
      console.error(`[API-Football] ${path} ${res.status}`);
      return null;
    }

    const remaining = res.headers.get("x-ratelimit-requests-remaining");
    if (remaining !== null && parseInt(remaining) < 10) {
      console.warn(`[API-Football] ⚠ Low quota: ${remaining} remaining`);
    }

    return res.json() as Promise<ApiFootballResponse<T>>;
  } catch (err) {
    console.error(`[API-Football] ${path} error:`, err);
    return null;
  }
}

export function unwrap<T>(res: ApiFootballResponse<T> | null): T[] | null {
  if (!res) return null;
  const errors = res.errors;
  const hasErrors = Array.isArray(errors) ? errors.length > 0 : Object.keys(errors ?? {}).length > 0;
  if (hasErrors) {
    console.warn("[API-Football] errors:", errors);
    return null;
  }
  return res.response?.length ? res.response : null;
}

export function isRateLimited(res: ApiFootballResponse<unknown> | null): boolean {
  if (!res?.errors) return false;
  const s = JSON.stringify(res.errors).toLowerCase();
  return s.includes("ratelimit") || s.includes("rate limit") || s.includes("too many");
}
