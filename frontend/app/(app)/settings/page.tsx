import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { fetchOptionalSection, fetchSection } from "@/lib/server-fetch";
import type {
  AccountRead,
  AccountTypeRead,
  DataOverviewRead,
  GoalRead,
  NotificationPreferenceRead,
  ProfileRead,
  RenewalRecapRead,
  SubscriptionRead,
} from "@/lib/types";

import { SettingsView } from "./settings-view";

export default async function SettingsPage() {
  const { getToken } = await auth();
  const token = await getToken();

  // See app/(app)/dashboard/page.tsx for why this redirect must resolve
  // before any Suspense boundary is returned.
  if (!token) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 sm:px-8">
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent token={token} />
      </Suspense>
    </div>
  );
}

async function SettingsContent({ token }: { token: string }) {
  // Profile/Goal are Student/Graduate concepts specifically (backend now
  // rejects a Company/Service Provider account on both, same as every
  // other career-seeker-only endpoint) — fetching them for an account that
  // can never have one would surface a raw 403 as a section "error"
  // instead of the empty state it actually is. Settings itself is shared
  // by every persona, so this is decided per-request, not by which shell
  // rendered the page.
  let isCareerSeeker = true;
  try {
    const accountType = await apiFetch<AccountTypeRead>("/account/type", { token });
    isCareerSeeker = accountType.account_type === "student" || accountType.account_type === "graduate";
  } catch {
    // Backend unreachable — default to showing the section; its own fetch
    // below will surface the same failure as a normal section error.
  }

  const [account, subscription, recap, notifPrefs, dataOverview, profile, activeGoal] = await Promise.all([
    fetchSection<AccountRead>("/settings/account", token),
    fetchSection<SubscriptionRead>("/settings/subscription", token),
    fetchSection<RenewalRecapRead>("/settings/renewal-recap", token),
    fetchSection<NotificationPreferenceRead>("/settings/notification-preferences", token),
    fetchSection<DataOverviewRead>("/settings/data", token),
    isCareerSeeker ? fetchSection<ProfileRead>("/profile", token) : Promise.resolve({ data: null, error: null }),
    isCareerSeeker
      ? fetchOptionalSection<GoalRead>("/profile/goals/active", token)
      : Promise.resolve({ data: null, error: null }),
  ]);

  return (
    <SettingsView
      account={account}
      subscription={subscription}
      recap={recap}
      notifPrefs={notifPrefs}
      dataOverview={dataOverview}
      profile={profile}
      activeGoal={activeGoal}
      isCareerSeeker={isCareerSeeker}
    />
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}
