import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import type { AccountTypeRead, ServiceProviderProfileRead } from "@/lib/types";

import { ProviderOnboardingForm } from "./provider-onboarding-form";

export default async function ProviderOnboardingPage() {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) {
    redirect("/sign-in");
  }

  let redirectTarget: string | null = null;
  try {
    const accountType = await apiFetch<AccountTypeRead>("/account/type", { token });
    if (accountType.account_type !== "service_provider") {
      redirectTarget = "/role-selection";
    } else {
      const profile = await apiFetch<ServiceProviderProfileRead>("/account/service-provider-profile", { token });
      if (profile.professional_title) {
        redirectTarget = "/provider";
      }
    }
  } catch {
    // fail open — form renders, its own submit handler surfaces a real error
  }
  if (redirectTarget) {
    redirect(redirectTarget);
  }

  return <ProviderOnboardingForm />;
}
