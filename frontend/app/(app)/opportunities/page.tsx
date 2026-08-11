import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { careerSeekerRedirectTarget } from "@/lib/role-routing";
import type { JobOpportunityWithCompanyRead, MyApplicationRead } from "@/lib/types";

import { OpportunitiesView } from "./opportunities-view";

export default async function OpportunitiesPage() {
  const { getToken } = await auth();
  const token = await getToken();

  // See app/(app)/dashboard/page.tsx for why this redirect must resolve
  // before any Suspense boundary is returned.
  if (!token) {
    redirect("/sign-in");
  }

  // Browsing/applying is a Student/Graduate action (a Company posts and
  // reviews applicants from their own dashboard, not here) — send a
  // Company/Service Provider account to their own Home instead of a page
  // whose one real action (Apply) would just 403 for them.
  const redirectTarget = await careerSeekerRedirectTarget(token);
  if (redirectTarget) {
    redirect(redirectTarget);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 sm:px-8">
      <Suspense fallback={<OpportunitiesSkeleton />}>
        <OpportunitiesContent token={token} />
      </Suspense>
    </div>
  );
}

async function OpportunitiesContent({ token }: { token: string }) {
  let opportunities: JobOpportunityWithCompanyRead[] = [];
  let myApplications: MyApplicationRead[] = [];
  let error: string | null = null;
  try {
    [opportunities, myApplications] = await Promise.all([
      apiFetch<JobOpportunityWithCompanyRead[]>("/opportunities", { token }),
      apiFetch<MyApplicationRead[]>("/opportunities/mine/applications", { token }),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load opportunities";
  }

  return <OpportunitiesView initialOpportunities={opportunities} initialApplications={myApplications} error={error} />;
}

function OpportunitiesSkeleton() {
  return (
    <>
      <Skeleton className="h-10 w-48 rounded-lg" />
      <div className="mt-6 space-y-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </>
  );
}
