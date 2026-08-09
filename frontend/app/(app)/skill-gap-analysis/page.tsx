import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, apiFetch } from "@/lib/api";
import type { ServiceListingWithProviderRead, SkillGapAnalysisRead } from "@/lib/types";

import { SkillGapAnalysisView } from "./skill-gap-analysis-view";

export default async function SkillGapAnalysisPage() {
  const { getToken } = await auth();
  const token = await getToken();

  // See app/(app)/dashboard/page.tsx for why this redirect must resolve
  // before any Suspense boundary is returned, and why the loading state
  // below is an inline Suspense rather than a route-level loading.tsx.
  if (!token) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 sm:px-8">
      <Suspense fallback={<AnalysisSkeleton />}>
        <AnalysisContent token={token} />
      </Suspense>
    </div>
  );
}

async function AnalysisContent({ token }: { token: string }) {
  let analysis: SkillGapAnalysisRead | null = null;
  let notFound = false;
  let error: string | null = null;
  try {
    analysis = await apiFetch<SkillGapAnalysisRead>("/ai-career-center/skill-gap-analysis/current", { token });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      notFound = true;
    } else {
      error = e instanceof Error ? e.message : "Failed to load analysis";
    }
  }

  // Best-effort: the "get support" ecosystem connection (Phase 7) is a
  // nice-to-have addition to this page, not core to it — a failure here
  // should never block rendering the actual analysis.
  let recommendedServices: ServiceListingWithProviderRead[] = [];
  if (analysis) {
    try {
      recommendedServices = await apiFetch<ServiceListingWithProviderRead[]>("/services/recommended", { token });
    } catch {
      recommendedServices = [];
    }
  }

  return (
    <SkillGapAnalysisView analysis={analysis} notFound={notFound} error={error} recommendedServices={recommendedServices} />
  );
}

function AnalysisSkeleton() {
  return (
    <>
      <Skeleton className="h-56 w-full rounded-xl" />
      <div className="mt-4 space-y-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </>
  );
}
