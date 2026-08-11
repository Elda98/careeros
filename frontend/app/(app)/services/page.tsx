import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { careerSeekerRedirectTarget } from "@/lib/role-routing";
import type { ServiceListingWithProviderRead } from "@/lib/types";

import { ServicesView } from "./services-view";

export default async function ServicesPage() {
  const { getToken } = await auth();
  const token = await getToken();

  // See app/(app)/dashboard/page.tsx for why this redirect must resolve
  // before any Suspense boundary is returned.
  if (!token) {
    redirect("/sign-in");
  }

  // Browsing service providers is a Student/Graduate action (a Service
  // Provider manages their own listings from their own dashboard, not
  // here, and a Company has no established use for this page either) —
  // send them to their own Home instead. See opportunities/page.tsx for
  // the same guard and reasoning.
  const redirectTarget = await careerSeekerRedirectTarget(token);
  if (redirectTarget) {
    redirect(redirectTarget);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 sm:px-8">
      <Suspense fallback={<ServicesSkeleton />}>
        <ServicesContent token={token} />
      </Suspense>
    </div>
  );
}

async function ServicesContent({ token }: { token: string }) {
  let services: ServiceListingWithProviderRead[] = [];
  let error: string | null = null;
  try {
    services = await apiFetch<ServiceListingWithProviderRead[]>("/services", { token });
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load services";
  }

  return <ServicesView services={services} error={error} />;
}

function ServicesSkeleton() {
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
