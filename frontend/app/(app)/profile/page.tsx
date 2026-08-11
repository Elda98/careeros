import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { careerSeekerRedirectTarget } from "@/lib/role-routing";
import { fetchSection } from "@/lib/server-fetch";
import type { GoalRead, OnboardingStatusRead, ProfileRead } from "@/lib/types";

import { ProfileView } from "./profile-view";

export default async function ProfilePage() {
  const { getToken } = await auth();
  const token = await getToken();

  // See app/(app)/dashboard/page.tsx for why this redirect must resolve
  // before any Suspense boundary is returned.
  if (!token) {
    redirect("/sign-in");
  }

  // Profile & Goal is Student/Graduate-only server-side now — see
  // skill-gap-analysis/page.tsx for the same guard and why it exists.
  const redirectTarget = await careerSeekerRedirectTarget(token);
  if (redirectTarget) {
    redirect(redirectTarget);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 sm:px-8">
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent token={token} />
      </Suspense>
    </div>
  );
}

async function ProfileContent({ token }: { token: string }) {
  const [profile, goals, onboardingStatus] = await Promise.all([
    fetchSection<ProfileRead>("/profile", token),
    fetchSection<GoalRead[]>("/profile/goals", token),
    fetchSection<OnboardingStatusRead>("/profile/onboarding-status", token),
  ]);

  return <ProfileView profile={profile} goals={goals} onboardingStatus={onboardingStatus} />;
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-56 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}
