import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import type { CommunityGroupRead } from "@/lib/types";

import { CommunityView } from "./community-view";

export default async function CommunityPage() {
  const { getToken } = await auth();
  const token = await getToken();

  // See app/(app)/dashboard/page.tsx for why this redirect must resolve
  // before any Suspense boundary is returned.
  if (!token) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 sm:px-8">
      <Suspense fallback={<CommunitySkeleton />}>
        <CommunityContent token={token} />
      </Suspense>
    </div>
  );
}

async function CommunityContent({ token }: { token: string }) {
  let groups: CommunityGroupRead[] = [];
  let error: string | null = null;
  try {
    groups = await apiFetch<CommunityGroupRead[]>("/community/groups", { token });
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load communities";
  }

  return <CommunityView initialGroups={groups} error={error} />;
}

function CommunitySkeleton() {
  return (
    <>
      <Skeleton className="h-10 w-56 rounded-lg" />
      <div className="mt-6 space-y-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </>
  );
}
