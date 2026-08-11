import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { careerSeekerRedirectTarget } from "@/lib/role-routing";
import type { OnboardingStatusRead } from "@/lib/types";

import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage() {
  const { getToken } = await auth();
  const token = await getToken();

  // Same defense-in-depth reasoning as every other authenticated page.
  if (!token) {
    redirect("/sign-in");
  }

  // This is the Student/Graduate onboarding wizard specifically (About You
  // -> Goal -> Skills -> Analysis -> Roadmap) — every step calls an
  // endpoint now gated to STUDENT/GRADUATE. A Company/Service Provider
  // account (their own onboarding lives at /company/onboarding,
  // /provider/onboarding) must never land here, whether from a stale link
  // or a direct URL.
  const redirectTarget = await careerSeekerRedirectTarget(token);
  if (redirectTarget) {
    redirect(redirectTarget);
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
