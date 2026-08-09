import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import type { InterviewSessionRead } from "@/lib/types";

import { InterviewListView } from "./interview-list-view";

export default async function InterviewPage() {
  const { getToken } = await auth();
  const token = await getToken();

  // See app/(app)/dashboard/page.tsx for why this redirect must resolve
  // before any Suspense boundary is returned.
  if (!token) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 sm:px-8">
      <Suspense fallback={<InterviewSkeleton />}>
        <InterviewContent token={token} />
      </Suspense>
    </div>
  );
}

async function InterviewContent({ token }: { token: string }) {
  let sessions: InterviewSessionRead[] = [];
  let error: string | null = null;
  try {
    sessions = await apiFetch<InterviewSessionRead[]>("/interview/sessions", { token });
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load interview sessions";
  }

  return <InterviewListView initialSessions={sessions} error={error} />;
}

function InterviewSkeleton() {
  return (
    <>
      <Skeleton className="h-10 w-64 rounded-lg" />
      <div className="mt-6 space-y-3">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </>
  );
}
