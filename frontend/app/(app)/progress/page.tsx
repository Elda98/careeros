import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { careerSeekerRedirectTarget } from "@/lib/role-routing";
import { fetchOptionalSection, fetchSection } from "@/lib/server-fetch";
import type { InterviewSessionRead, NotificationRead, RenewalRecapRead, SkillGapAnalysisRead } from "@/lib/types";

import { ProgressView } from "./progress-view";

export default async function ProgressPage() {
  const { getToken } = await auth();
  const token = await getToken();

  // See app/(app)/dashboard/page.tsx for why this redirect must resolve
  // before any Suspense boundary is returned.
  if (!token) {
    redirect("/sign-in");
  }

  // Progress aggregates the Skill-Gap Analysis/Roadmap/CV Feedback
  // history — all Student/Graduate-only server-side now. See
  // skill-gap-analysis/page.tsx for the same guard and why it exists.
  const redirectTarget = await careerSeekerRedirectTarget(token);
  if (redirectTarget) {
    redirect(redirectTarget);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 sm:px-8">
      <Suspense fallback={<ProgressSkeleton />}>
        <ProgressContent token={token} />
      </Suspense>
    </div>
  );
}

async function ProgressContent({ token }: { token: string }) {
  // Progress is a read-only aggregation over four resources that already
  // exist independently — no new backend endpoint. See
  // frontend/README.md's Progress section for exactly what this page can
  // and can't show given that constraint (most notably: no
  // GET /roadmap/history exists, so there is no per-version roadmap
  // timeline here, only what notifications reveal about when it changed).
  const [recap, currentAnalysis, analysisHistory, notifications, interviewSessions] = await Promise.all([
    fetchSection<RenewalRecapRead>("/settings/renewal-recap", token),
    fetchOptionalSection<SkillGapAnalysisRead>("/ai-career-center/skill-gap-analysis/current", token),
    fetchSection<SkillGapAnalysisRead[]>("/ai-career-center/skill-gap-analysis/history", token),
    fetchSection<NotificationRead[]>("/notifications", token),
    fetchSection<InterviewSessionRead[]>("/interview/sessions", token),
  ]);

  return (
    <ProgressView
      recap={recap}
      currentAnalysis={currentAnalysis}
      analysisHistory={analysisHistory}
      notifications={notifications}
      interviewSessions={interviewSessions}
    />
  );
}

function ProgressSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-56 w-full rounded-xl" />
    </div>
  );
}
