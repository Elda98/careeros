import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import type { AccountTypeRead, CompanyProfileRead } from "@/lib/types";

import { CompanyOnboardingForm } from "./company-onboarding-form";

export default async function CompanyOnboardingPage() {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) {
    redirect("/sign-in");
  }

  let redirectTarget: string | null = null;
  try {
    const accountType = await apiFetch<AccountTypeRead>("/account/type", { token });
    if (accountType.account_type !== "company") {
      // Not a company account (role never chosen, or a different role) —
      // this onboarding form isn't theirs to fill out.
      redirectTarget = "/role-selection";
    } else {
      const profile = await apiFetch<CompanyProfileRead>("/account/company-profile", { token });
      if (profile.company_name) {
        redirectTarget = "/company";
      }
    }
  } catch {
    // Backend unreachable — fail open, let the form render; its own
    // submit handler surfaces a real error if the backend is still down.
  }
  if (redirectTarget) {
    redirect(redirectTarget);
  }

  return <CompanyOnboardingForm />;
}
