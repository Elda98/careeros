import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, apiFetch } from "@/lib/api";
import type {
  AccountRead,
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

export interface Fetched<T> {
  data: T | null;
  error: string | null;
}

/** Every section on this page loads independently — one section failing must never block the rest. */
async function fetchSection<T>(path: string, token: string): Promise<Fetched<T>> {
  try {
    return { data: await apiFetch<T>(path, { token }), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Failed to load" };
  }
}

/** Like fetchSection, but a 404 means "nothing set yet" (a real, valid state), not a load failure. */
async function fetchOptionalSection<T>(path: string, token: string): Promise<Fetched<T>> {
  try {
    return { data: await apiFetch<T>(path, { token }), error: null };
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return { data: null, error: null };
    return { data: null, error: e instanceof Error ? e.message : "Failed to load" };
  }
}

async function SettingsContent({ token }: { token: string }) {
  const [account, subscription, recap, notifPrefs, dataOverview, profile, activeGoal] = await Promise.all([
    fetchSection<AccountRead>("/settings/account", token),
    fetchSection<SubscriptionRead>("/settings/subscription", token),
    fetchSection<RenewalRecapRead>("/settings/renewal-recap", token),
    fetchSection<NotificationPreferenceRead>("/settings/notification-preferences", token),
    fetchSection<DataOverviewRead>("/settings/data", token),
    fetchSection<ProfileRead>("/profile", token),
    fetchOptionalSection<GoalRead>("/profile/goals/active", token),
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
