import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { fetchOptionalSection, fetchSection } from "@/lib/server-fetch";
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
