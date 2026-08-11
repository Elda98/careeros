import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/shell/app-shell";
import { COMPANY_NAV_GROUPS } from "@/components/shell/nav-config";
import { apiFetch } from "@/lib/api";
import type { AccountTypeRead, CompanyProfileRead, JobOpportunityRead } from "@/lib/types";

import { CompanyDashboardView } from "./company-dashboard-view";

export default async function CompanyDashboardPage() {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) {
    redirect("/sign-in");
  }

  let redirectTarget: string | null = null;
  let profile: CompanyProfileRead | null = null;
  let opportunities: JobOpportunityRead[] = [];
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
      } else {
        opportunities = await apiFetch<JobOpportunityRead[]>("/company/opportunities", { token });
      }
    }
  } catch {
    // handled by the null-profile render below
  }
  if (redirectTarget) {
    redirect(redirectTarget);
  }

  return (
    <AppShell navGroups={COMPANY_NAV_GROUPS} homeHref="/company">
      <CompanyDashboardView profile={profile} opportunities={opportunities} />
    </AppShell>
  );
}
