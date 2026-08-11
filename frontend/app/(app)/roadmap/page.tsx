import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, apiFetch } from "@/lib/api";
import { careerSeekerRedirectTarget } from "@/lib/role-routing";
import type { RoadmapRead } from "@/lib/types";

import { RoadmapView } from "./roadmap-view";

export default async function RoadmapPage() {
  const { getToken } = await auth();
  const token = await getToken();

  // See app/(app)/dashboard/page.tsx for why this redirect must resolve
  // before any Suspense boundary is returned.
  if (!token) {
    redirect("/sign-in");
  }

  // Roadmap is Student/Graduate-only server-side now — see
  // skill-gap-analysis/page.tsx for the same guard and why it exists.
  const redirectTarget = await careerSeekerRedirectTarget(token);
  if (redirectTarget) {
    redirect(redirectTarget);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 sm:px-8">
      <Suspense fallback={<RoadmapSkeleton />}>
        <RoadmapContent token={token} />
      </Suspense>
    </div>
  );
}

async function RoadmapContent({ token }: { token: string }) {
  let roadmap: RoadmapRead | null = null;
  let notFound = false;
  let error: string | null = null;
  try {
    roadmap = await apiFetch<RoadmapRead>("/ai-career-center/roadmap/current", { token });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      notFound = true;
    } else {
      error = e instanceof Error ? e.message : "Failed to load roadmap";
    }
  }

  return <RoadmapView roadmap={roadmap} notFound={notFound} error={error} />;
}

function RoadmapSkeleton() {
  return (
    <>
      <Skeleton className="h-36 w-full rounded-xl" />
      <div className="mt-6 space-y-5">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </>
  );
}
