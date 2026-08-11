import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { careerSeekerRedirectTarget } from "@/lib/role-routing";
import type { CVFeedbackRoundRead } from "@/lib/types";

import { CVFeedbackView } from "./cv-feedback-view";

export default async function CVFeedbackPage() {
  const { getToken } = await auth();
  const token = await getToken();

  // See app/(app)/dashboard/page.tsx for why this redirect must resolve
  // before any Suspense boundary is returned.
  if (!token) {
    redirect("/sign-in");
  }

  // CV Feedback is Student/Graduate-only server-side now — see
  // skill-gap-analysis/page.tsx for the same guard and why it exists.
  const redirectTarget = await careerSeekerRedirectTarget(token);
  if (redirectTarget) {
    redirect(redirectTarget);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 sm:px-8">
      <Suspense fallback={<CVFeedbackSkeleton />}>
        <CVFeedbackContent token={token} />
      </Suspense>
    </div>
  );
}

async function CVFeedbackContent({ token }: { token: string }) {
  let rounds: CVFeedbackRoundRead[] | null = null;
  let error: string | null = null;
  try {
    // Unlike Skill-Gap Analysis/Roadmap's "current" endpoints, this is a
    // list — it 200s with an empty array for a brand-new user rather than
    // 404ing, so there's no notFound branch to handle here.
    rounds = await apiFetch<CVFeedbackRoundRead[]>("/ai-career-center/cv-feedback", { token });
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load feedback history";
  }

  return <CVFeedbackView initialRounds={rounds} error={error} />;
}

function CVFeedbackSkeleton() {
  return (
    <>
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="mt-8 space-y-3">
        <Skeleton className="mb-3 h-4 w-40" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </>
  );
}
