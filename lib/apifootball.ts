import type { ApiFootballResponse } from "./types";

const BASE_URL = "https://v3.football.api-sports.io";

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
