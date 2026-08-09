import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import type { AccountTypeRead, CompanyProfileRead } from "@/lib/types";

import { CompanyDashboardView } from "./company-dashboard-view";

export default async function CompanyDashboardPage() {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) {
    redirect("/sign-in");
  }

  let redirectTarget: string | null = null;
  let profile: CompanyProfileRead | null = null;
  try {
    const accountType = await apiFetch<AccountTypeRead>("/account/type", { token });
    if (accountType.account_type === null) {
      redirectTarget = "/role-selection";
    } else if (accountType.account_type !== "company") {
      redirectTarget = "/dashboard"; // student/graduate/provider — not this page's audience
    } else {
      profile = await apiFetch<CompanyProfileRead>("/account/company-profile", { token });
      if (!profile.company_name) {
        redirectTarget = "/company/onboarding";
      }
    }
  } catch {
    // handled by the null-profile render below
  }
  if (redirectTarget) {
    redirect(redirectTarget);
  }

  return <CompanyDashboardView profile={profile} />;
}
