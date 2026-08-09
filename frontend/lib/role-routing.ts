import type { AccountType } from "@/lib/types";

/** Where a signed-in user with this account_type belongs. Shared by
 * role-selection/page.tsx (redirects away once a role is already set) and
 * (app)/dashboard/page.tsx (redirects a company/provider account away from
 * the student/graduate dashboard) — one place, so the two can't drift. */
export function destinationForAccountType(accountType: AccountType): string {
  switch (accountType) {
    case "company":
      return "/company";
    case "service_provider":
      return "/provider";
    case "student":
    case "graduate":
      return "/dashboard";
  }
}
