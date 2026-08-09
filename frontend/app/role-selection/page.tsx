import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import type { AccountTypeRead } from "@/lib/types";

import { RoleSelectionView } from "./role-selection-view";

/** Destination once a role is known — mirrors the redirect logic in
 * (app)/dashboard/page.tsx, which is what sends a signed-in user here in
 * the first place when `account_type` is still null. Kept in one place
 * (`lib/role-routing.ts`) so the two call sites can't drift apart. */
import { destinationForAccountType } from "@/lib/role-routing";

export default async function RoleSelectionPage() {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    redirect("/sign-in");
  }

  // A user who already picked a role shouldn't be able to land back on
  // this screen via a stale link or the back button.
  let accountType: AccountTypeRead["account_type"] = null;
  try {
    const status = await apiFetch<AccountTypeRead>("/account/type", { token });
    accountType = status.account_type;
  } catch {
    accountType = null; // fail open — let the screen render, same as onboarding's page.tsx
  }
  if (accountType) {
    redirect(destinationForAccountType(accountType));
  }

  return <RoleSelectionView />;
}
