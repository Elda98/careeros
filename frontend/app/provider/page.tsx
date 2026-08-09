import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import type { AccountTypeRead, ServiceListingRead, ServiceProviderProfileRead } from "@/lib/types";

import { ProviderDashboardView } from "./provider-dashboard-view";

export default async function ProviderDashboardPage() {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) {
    redirect("/sign-in");
  }

  let redirectTarget: string | null = null;
  let profile: ServiceProviderProfileRead | null = null;
  let services: ServiceListingRead[] = [];
  try {
    const accountType = await apiFetch<AccountTypeRead>("/account/type", { token });
    if (accountType.account_type === null) {
      redirectTarget = "/role-selection";
    } else if (accountType.account_type !== "service_provider") {
      redirectTarget = "/dashboard";
    } else {
      profile = await apiFetch<ServiceProviderProfileRead>("/account/service-provider-profile", { token });
      if (!profile.professional_title) {
        redirectTarget = "/provider/onboarding";
      } else {
        services = await apiFetch<ServiceListingRead[]>("/provider/services", { token });
      }
    }
  } catch {
    // handled by the null-profile render below
  }
  if (redirectTarget) {
    redirect(redirectTarget);
  }

  return <ProviderDashboardView profile={profile} services={services} />;
}
