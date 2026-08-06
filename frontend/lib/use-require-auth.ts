"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Client-component equivalent of the server-component guard in
 * app/dashboard/page.tsx and app/skill-gap-analysis/page.tsx. Needed
 * separately because a 'use client' page's initial HTML always renders
 * with a 200 (no server-side redirect is possible once the page has opted
 * into client rendering) — found by actually testing every route in Docker:
 * without this, /onboarding and /roadmap silently rendered an empty shell
 * for unauthenticated visitors instead of redirecting, unlike their
 * server-component counterparts.
 */
export function useRequireAuth() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  return { isLoaded, isSignedIn };
}
