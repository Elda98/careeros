import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import type { NotificationRead } from "@/lib/types";

import { NotificationsView } from "./notifications-view";

export default async function NotificationsPage() {
  const { getToken } = await auth();
  const token = await getToken();

  // See app/(app)/dashboard/page.tsx for why this redirect must resolve
  // before any Suspense boundary is returned.
  if (!token) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 sm:px-8">
      <Suspense fallback={<NotificationsSkeleton />}>
        <NotificationsContent token={token} />
      </Suspense>
    </div>
  );
}

async function NotificationsContent({ token }: { token: string }) {
  let notifications: NotificationRead[] | null = null;
  let error: string | null = null;
  try {
    // Always 200s (empty array for a new user) — no notFound branch needed,
    // same shape as CV Feedback's history list.
    notifications = await apiFetch<NotificationRead[]>("/notifications", { token });
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load notifications";
  }

  return <NotificationsView initialNotifications={notifications} error={error} />;
}

function NotificationsSkeleton() {
  return (
    <>
      <Skeleton className="mb-3 h-4 w-16" />
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </>
  );
}
