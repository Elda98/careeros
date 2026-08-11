import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { careerSeekerRedirectTarget } from "@/lib/role-routing";
import { fetchOptionalSection, fetchSection } from "@/lib/server-fetch";
import type {
  CommunityGroupRead,
  DashboardRead,
  GoalRead,
  InterviewSessionRead,
  JobOpportunityWithCompanyRead,
  NotificationRead,
  OnboardingStatusRead,
  RenewalRecapRead,
  SkillGapAnalysisRead,
} from "@/lib/types";

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
  // (this route never renders career-seeker content for them) — the same
  // check every other career-seeker-only page uses (lib/role-routing.ts).
  //
  // redirect() stays outside the try block, same reasoning as the
  // onboarding-status check below — it throws internally to interrupt
  // rendering, and a bare `catch` here would silently swallow that throw
  // instead of actually redirecting.
  const redirectTarget = await careerSeekerRedirectTarget(token);
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

  // Everything below is best-effort context that turns Home into an
  // actual summary of where the user stands — not the one required
  // next-action fetch above, which alone still renders. Each section
  // fails independently (same pattern as Progress), and every value
  // comes from an endpoint that already existed for a different page —
  // no new backend logic, no duplicated data collection.
  const [goal, analysis, recap, notifications, interviewSessions, communityGroups, opportunities] = await Promise.all([
    fetchOptionalSection<GoalRead>("/profile/goals/active", token),
    fetchOptionalSection<SkillGapAnalysisRead>("/ai-career-center/skill-gap-analysis/current", token),
    fetchSection<RenewalRecapRead>("/settings/renewal-recap", token),
    fetchSection<NotificationRead[]>("/notifications", token),
    fetchSection<InterviewSessionRead[]>("/interview/sessions", token),
    fetchSection<CommunityGroupRead[]>("/community/groups", token),
    fetchSection<JobOpportunityWithCompanyRead[]>("/opportunities", token),
  ]);

  return (
    <DashboardView
      dashboard={dashboard}
      error={error}
      goal={goal.data}
      analysis={analysis.data}
      recap={recap.data}
      recentNotifications={(notifications.data ?? []).slice(0, 3)}
      interviewSessions={interviewSessions.data ?? []}
      myCommunityGroups={(communityGroups.data ?? []).filter((g) => g.is_member)}
      openOpportunitiesCount={(opportunities.data ?? []).length}
    />
  );
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
