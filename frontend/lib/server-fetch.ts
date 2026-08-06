import { ApiError, apiFetch } from "@/lib/api";

/**
 * Server Component data-fetch helpers — extracted from Settings (its first
 * caller) when Progress needed the same "fetch several independent
 * resources, let each fail on its own" shape a second time. Never used from
 * a Client Component: these exist so a page with multiple unrelated
 * backend calls (Settings' seven, Progress' four) can render every section
 * that succeeded even if one fails, instead of one failure blanking the
 * whole page.
 */
export interface Fetched<T> {
  data: T | null;
  error: string | null;
}

/** One section's fetch failing must never block the rest of the page. */
export async function fetchSection<T>(path: string, token: string): Promise<Fetched<T>> {
  try {
    return { data: await apiFetch<T>(path, { token }), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Failed to load" };
  }
}

/** Like fetchSection, but a 404 means "nothing set yet" (a real, valid state), not a load failure. */
export async function fetchOptionalSection<T>(path: string, token: string): Promise<Fetched<T>> {
  try {
    return { data: await apiFetch<T>(path, { token }), error: null };
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return { data: null, error: null };
    return { data: null, error: e instanceof Error ? e.message : "Failed to load" };
  }
}
