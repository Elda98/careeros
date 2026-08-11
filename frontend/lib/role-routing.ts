import { apiFetch } from "@/lib/api";
import type { AccountType, AccountTypeRead } from "@/lib/types";

/** Where a signed-in user with this account_type belongs — their Home.
 * Shared by role-selection/page.tsx (redirects away once a role is
 * already set), every career-seeker-only page (redirects a Company/
 * Service Provider account back to *their* Home instead of a raw 403),
 * and the Sidebar/AppShell (the logo's link target) — one place, so none
 * of them can drift out of sync with each other.
 *
 * Accepts null (a signed-in user who hasn't picked a role yet) so callers
 * that already have a possibly-null account_type don't need their own
 * separate branch — treated the same as Student/Graduate here since
 * role-selection itself is what actually handles the null case (its own
 * page.tsx checks account_type === null before ever reaching this). */
export function destinationForAccountType(accountType: AccountType | null): string {
  switch (accountType) {
    case "company":
      return "/company";
    case "service_provider":
      return "/provider";
    case "student":
    case "graduate":
    case null:
      return "/dashboard";
  }
}

/**
 * The redirect guard for every Student/Graduate-only page (Skill Gap
 * Analysis, Roadmap, CV Feedback, Interview Prep, Progress, Profile &
 * Goals) — the backend now rejects a Company/Service Provider account on
 * every one of those endpoints (ai_career_center.py, profiles.py), so
 * without this the page would render its own generic "failed to load"
 * error card around a raw 403 instead of simply sending them to the
 * dashboard they actually belong on. Mirrors (app)/dashboard/page.tsx's
 * own inline check (which does the reverse: sends Company/Provider away
 * from the *Student* dashboard) — same shape, kept here once other pages
 * needed the identical check.
 *
 * Returns null when no redirect is needed, so callers can keep `redirect()`
 * itself outside any try/catch (see dashboard/page.tsx's own comment on
 * why: it throws internally to interrupt rendering).
 */
export async function careerSeekerRedirectTarget(token: string): Promise<string | null> {
  try {
    const accountType = await apiFetch<AccountTypeRead>("/account/type", { token });
    if (accountType.account_type === null) {
      return "/role-selection";
    }
    if (accountType.account_type === "company" || accountType.account_type === "service_provider") {
      return destinationForAccountType(accountType.account_type);
    }
    return null;
  } catch {
    // Backend unreachable/erroring — let the page's own fetch report the
    // same failure normally, same fallback as dashboard/page.tsx's
    // equivalent check.
    return null;
  }
}
