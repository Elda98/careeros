import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import type { OnboardingStatusRead } from "@/lib/types";

import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage() {
  const { getToken } = await auth();
  const token = await getToken();

  // Same defense-in-depth reasoning as every other authenticated page.
  if (!token) {
    redirect("/sign-in");
  }

  // A user who has already completed onboarding shouldn't be able to land
  // back on the wizard via a stale link or the back button — send them to
  // the dashboard instead. `redirect()` throws internally, so this check
  // must stay outside any try/catch that could swallow that throw; if the
  // status check itself fails, fail open and let the wizard render (its
  // own per-step error handling covers a real backend outage).
  let onboardingCompleted = false;
  try {
    const status = await apiFetch<OnboardingStatusRead>("/profile/onboarding-status", { token });
    onboardingCompleted = status.onboarding_completed;
  } catch {
    onboardingCompleted = false;
  }
  if (onboardingCompleted) {
    redirect("/dashboard");
  }

  return <OnboardingWizard />;
}
