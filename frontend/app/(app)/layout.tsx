import { auth } from "@clerk/nextjs/server";

import { AppShell } from "@/components/shell/app-shell";
import { navGroupsForAccountType } from "@/components/shell/nav-config";
import { apiFetch } from "@/lib/api";
import { destinationForAccountType } from "@/lib/role-routing";
import type { AccountTypeRead } from "@/lib/types";

/**
 * Shared chrome for every page under this route group. Most of these
 * routes are Student/Graduate-only and already redirect a Company/Service
 * Provider account away before ever reaching this layout (see
 * lib/role-routing.ts's careerSeekerRedirectTarget) — but a few are
 * genuinely shared across every persona (Notifications, Community,
 * Opportunities, Services, Settings), and those render for whichever
 * account actually requested them. The nav must match the *visiting*
 * account, not assume Student/Graduate just because the route happens to
 * live in this group — otherwise a Company account opening /notifications
 * directly would see the Student sidebar (Skill-Gap Analysis, Roadmap,
 * etc.), none of which apply to them.
 *
 * Company and Service Provider dashboards themselves (app/company,
 * app/provider) live outside this route group and wrap their own content
 * in AppShell directly with the same nav-config helper — they don't need
 * this fetch since they already know their own role from the page-level
 * check that got them there.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { getToken } = await auth();
  const token = await getToken();

  let accountType: AccountTypeRead["account_type"] = null;
  if (token) {
    try {
      const result = await apiFetch<AccountTypeRead>("/account/type", { token });
      accountType = result.account_type;
    } catch {
      // Backend unreachable/erroring — fall back to the Student/Graduate
      // default nav; the page itself still runs its own check and reports
      // the real failure normally.
    }
  }

  return (
    <AppShell navGroups={navGroupsForAccountType(accountType)} homeHref={destinationForAccountType(accountType)}>
      {children}
    </AppShell>
  );
}
