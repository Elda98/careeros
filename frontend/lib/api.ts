/**
 * Thin client for the backend's Presentation <-> Interaction contract
 * surface (SAS Part II §9). Every call here is either a `Render` read or a
 * `Request` write per that contract's operation vocabulary — this file
 * never contains business logic, only transport (SAS §6.10: Presentation
 * never computes or decides, only expresses).
 */

/**
 * Two different base URLs, not one, because this file runs in two different
 * network contexts:
 * - Server Components (e.g. app/dashboard/page.tsx) execute inside the
 *   frontend's own process/container — `localhost` there refers to that
 *   container, not the backend's. Under Docker Compose, the backend is
 *   only reachable at the service-name address (`http://backend:8000`).
 * - Client Components (e.g. app/onboarding/page.tsx) execute in the
 *   browser on the host machine, where the backend's published port really
 *   is reachable at `localhost:8000`.
 *
 * `API_URL` (server-only, never sent to the browser since it isn't
 * `NEXT_PUBLIC_*`) and `NEXT_PUBLIC_API_URL` (inlined into the client
 * bundle) are set independently in docker-compose.yml for exactly this
 * reason. Discovered by actually running the app in Docker: a Server
 * Component call to `/dashboard` failed with ECONNREFUSED against
 * `localhost:8000` before this fix.
 */
const SERVER_API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const CLIENT_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function resolveApiUrl(): string {
  return typeof window === "undefined" ? SERVER_API_URL : CLIENT_API_URL;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * FastAPI wraps every `HTTPException(detail=...)` in `{"detail": ...}`, and
 * `detail` itself is sometimes a plain string (e.g. cv-feedback's "Set an
 * active goal...") and sometimes a structured object (e.g. skill-gap's
 * BR-GAP-1 hard-bar rejection, `{"message": ..., "missing_hard_bar_fields":
 * [...]}`). `apiFetch` only hands back the raw response body text, so this
 * pulls the human-readable message back out for display (a toast, an inline
 * error) instead of showing raw JSON. Used by every client-side mutation
 * (Skill-Gap Analysis refresh, Roadmap status changes, CV Feedback submit).
 */
export function extractApiErrorMessage(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as { detail?: string | { message?: string } };
    const detail = parsed?.detail;
    if (typeof detail === "string") return detail;
    if (detail && typeof detail.message === "string") return detail.message;
  } catch {
    // Not JSON — the raw text is already the message.
  }
  return raw;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, ...init } = options;
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${resolveApiUrl()}${path}`, { ...init, headers });
  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(response.status, body || response.statusText);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
