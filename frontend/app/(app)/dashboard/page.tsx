import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { destinationForAccountType } from "@/lib/role-routing";
import type { AccountTypeRead, DashboardRead, OnboardingStatusRead } from "@/lib/types";

import { DashboardView } from "./dashboard-view";

export default async function DashboardPage() {
  const { getToken } = await auth();
  const token = await getToken();

  // Defense in depth: middleware.ts already gates this route on
  // auth.protect(), but this page must never assume that held — an
  // unauthenticated request must redirect to sign-in here too, rather than
  // call the backend without a token and surface its 401 as an unhandled
  // server-component crash (found by actually running the app in Docker).
  //
  // This redirect (and the onboarding one below) must resolve BEFORE this
  // component returns any JSX containing a Suspense boundary — once a
  // Suspense boundary starts streaming, Next.js can no longer send a real
  // HTTP 3xx and silently falls back to a slower client-side meta-refresh
  // redirect instead (verified by actually testing both ways against the
  // running app: a route-level `loading.tsx` here reproduced exactly that
  // degradation). So the loading state below is a Suspense boundary placed
  // *inside* this function, wrapping only the dashboard data fetch — never
  // a route-level `loading.tsx`, which would wrap this entire component.
  if (!token) {
    redirect("/sign-in");
  }

  // Role-based ecosystem: this dashboard is the Student/Graduate
  // experience specifically, not a generic post-auth landing point
  // anymore. A user with no role chosen yet is sent to pick one; a
  // Company/Service Provider account is sent to *their* dashboard instead
  // (this route never renders career-seeker content for them).
  //
  // redirect() stays outside the try block, same reasoning as the
  // onboarding-status check below — it throws internally to interrupt
  // rendering, and a bare `catch` here would silently swallow that throw
  // instead of actually redirecting.
  let redirectTarget: string | null = null;
  try {
    const accountType = await apiFetch<AccountTypeRead>("/account/type", { token });
    if (accountType.account_type === null) {
      redirectTarget = "/role-selection";
    } else if (accountType.account_type === "company" || accountType.account_type === "service_provider") {
      redirectTarget = destinationForAccountType(accountType.account_type);
    }
  } catch {
    // Backend unreachable — fall through and let the existing
    // onboarding-status check (and DashboardContent) handle/report it.
  }
  if (redirectTarget) {
    redirect(redirectTarget);
  }

  // FR-ONBOARD-1: Dashboard is the post-auth landing point (sign-in/sign-up
  // both redirect here); it is the one place that decides whether a user
  // still needs onboarding, so that decision is never duplicated.
  //
  // Wrapped in try/catch for the same reason as DashboardContent's fetch
  // below: an unreachable/erroring backend must not crash this Server
  // Component with an unhandled exception (production evidence: Vercel
  // digest 3227098399, ECONNREFUSED against an undeployed backend). On
  // failure, skip this redirect decision and fall through to
  // DashboardContent, whose own try/catch renders the same failure as a
  // normal error state instead of a hard crash. redirect() itself stays
  // outside the try block so its render-interrupt isn't swallowed as a
  // caught exception.
  let onboardingCompleted = true;
  try {
    const onboardingStatus = await apiFetch<OnboardingStatusRead>("/profile/onboarding-status", { token });
    onboardingCompleted = onboardingStatus.onboarding_completed;
  } catch {
    // Backend unreachable or erroring — handled above.
  }
  if (!onboardingCompleted) {
    redirect("/onboarding");
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 sm:px-8">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent token={token} />
      </Suspense>
    </div>
  );
}

async function DashboardContent({ token }: { token: string }) {
  let dashboard: DashboardRead | null = null;
  let error: string | null = null;
  try {
    dashboard = await apiFetch<DashboardRead>("/dashboard", { token });
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load dashboard";
  }

  return <DashboardView dashboard={dashboard} error={error} />;
}

function DashboardSkeleton() {
  return (
    <>
      <Skeleton className="h-44 w-full rounded-xl" />
      <div className="mt-8">
        <Skeleton className="mb-3 h-4 w-40" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      </div>
    </>
  );
}
