"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n/config";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type {
  AccountRead,
  DataOverviewRead,
  NotificationPreferenceRead,
  RenewalRecapRead,
  SubscriptionRead,
} from "@/lib/types";
import { useRequireAuth } from "@/lib/use-require-auth";

const CATEGORY_LABELS: Record<string, string> = {
  analysis_complete: "Skill-gap analysis complete",
  roadmap_updated: "Roadmap updated",
  cv_feedback_complete: "CV feedback complete",
};

export default function SettingsPage() {
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const { isSignedIn } = useRequireAuth();
  const router = useRouter();
  const { locale, setLocale, t } = useTranslations();

  const [statusAnnouncement, setStatusAnnouncement] = useState("");

  // --- Account -------------------------------------------------------
  const [account, setAccount] = useState<AccountRead | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountError, setAccountError] = useState<string | null>(null);

  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // --- Subscription ----------------------------------------------------
  const [subscription, setSubscription] = useState<SubscriptionRead | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [recap, setRecap] = useState<RenewalRecapRead | null>(null);
  const [recapLoading, setRecapLoading] = useState(true);
  const [recapError, setRecapError] = useState<string | null>(null);

  // --- Notification preferences ----------------------------------------
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferenceRead | null>(null);
  const [notifPrefsLoading, setNotifPrefsLoading] = useState(true);
  const [notifPrefsError, setNotifPrefsError] = useState<string | null>(null);
  const [updatingCategory, setUpdatingCategory] = useState<string | null>(null);

  // --- AI & Memory Controls (data overview + clear profile data) -------
  const [dataOverview, setDataOverview] = useState<DataOverviewRead | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [clearingProfile, setClearingProfile] = useState(false);
  const [clearProfileError, setClearProfileError] = useState<string | null>(null);

  const deleteHeadingRef = useRef<HTMLHeadingElement>(null);

  async function loadAccount() {
    setAccountLoading(true);
    setAccountError(null);
    try {
      const token = await getToken();
      setAccount(await apiFetch<AccountRead>("/settings/account", { token }));
    } catch (e) {
      setAccountError(e instanceof Error ? e.message : "Failed to load account information");
    } finally {
      setAccountLoading(false);
    }
  }

  async function loadSubscription() {
    setSubscriptionLoading(true);
    setSubscriptionError(null);
    try {
      const token = await getToken();
      setSubscription(await apiFetch<SubscriptionRead>("/settings/subscription", { token }));
    } catch (e) {
      setSubscriptionError(e instanceof Error ? e.message : "Failed to load subscription information");
    } finally {
      setSubscriptionLoading(false);
    }
  }

  async function loadRecap() {
    setRecapLoading(true);
    setRecapError(null);
    try {
      const token = await getToken();
      setRecap(await apiFetch<RenewalRecapRead>("/settings/renewal-recap", { token }));
    } catch (e) {
      setRecapError(e instanceof Error ? e.message : "Failed to load your renewal recap");
    } finally {
      setRecapLoading(false);
    }
  }

  async function loadNotifPrefs() {
    setNotifPrefsLoading(true);
    setNotifPrefsError(null);
    try {
      const token = await getToken();
      setNotifPrefs(await apiFetch<NotificationPreferenceRead>("/settings/notification-preferences", { token }));
    } catch (e) {
      setNotifPrefsError(e instanceof Error ? e.message : "Failed to load notification preferences");
    } finally {
      setNotifPrefsLoading(false);
    }
  }

  async function loadDataOverview() {
    setDataLoading(true);
    setDataError(null);
    try {
      const token = await getToken();
      setDataOverview(await apiFetch<DataOverviewRead>("/settings/data", { token }));
    } catch (e) {
      setDataError(e instanceof Error ? e.message : "Failed to load your stored data overview");
    } finally {
      setDataLoading(false);
    }
  }

  useEffect(() => {
    if (isSignedIn) {
      loadAccount();
      loadSubscription();
      loadRecap();
      loadNotifPrefs();
      loadDataOverview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  async function handleCancelSubscription() {
    setCancelling(true);
    setCancelError(null);
    setStatusAnnouncement("Cancelling subscription…");
    try {
      const token = await getToken();
      const updated = await apiFetch<SubscriptionRead>("/settings/subscription/cancel", {
        method: "POST",
        body: JSON.stringify(cancelReason.trim() ? { reason: cancelReason.trim() } : {}),
        token,
      });
      setSubscription(updated);
      setCancelReason("");
      setStatusAnnouncement("Subscription cancelled.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to cancel subscription";
      setCancelError(message);
      setStatusAnnouncement(`Failed to cancel subscription: ${message}`);
    } finally {
      setCancelling(false);
    }
  }

  async function handleToggleCategory(category: string) {
    if (!notifPrefs) return;
    const isMuted = notifPrefs.muted_categories.includes(category);
    const nextMuted = isMuted
      ? notifPrefs.muted_categories.filter((c) => c !== category)
      : [...notifPrefs.muted_categories, category];

    setUpdatingCategory(category);
    setNotifPrefsError(null);
    setStatusAnnouncement(`${isMuted ? "Unmuting" : "Muting"} ${CATEGORY_LABELS[category] ?? category}…`);
    try {
      const token = await getToken();
      const updated = await apiFetch<NotificationPreferenceRead>("/settings/notification-preferences", {
        method: "PATCH",
        body: JSON.stringify({ muted_categories: nextMuted }),
        token,
      });
      setNotifPrefs(updated);
      setStatusAnnouncement(`${CATEGORY_LABELS[category] ?? category} ${isMuted ? "unmuted" : "muted"}.`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to update notification preference";
      setNotifPrefsError(message);
      setStatusAnnouncement(`Failed to update notification preference: ${message}`);
    } finally {
      setUpdatingCategory(null);
    }
  }

  async function handleClearProfileData() {
    if (!window.confirm("Clear your background, education, experience, and skills? This cannot be undone.")) {
      return;
    }
    setClearingProfile(true);
    setClearProfileError(null);
    setStatusAnnouncement("Clearing profile data…");
    try {
      const token = await getToken();
      await apiFetch("/profile", { method: "DELETE", token });
      setStatusAnnouncement("Profile data cleared.");
      await loadDataOverview();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to clear profile data";
      setClearProfileError(message);
      setStatusAnnouncement(`Failed to clear profile data: ${message}`);
    } finally {
      setClearingProfile(false);
    }
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    setDeleteAccountError(null);
    setStatusAnnouncement("Deleting your account…");
    try {
      const token = await getToken();
      await apiFetch("/settings/account", { method: "DELETE", token });
      setStatusAnnouncement("Account deleted.");
      await signOut(() => router.push("/"));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to delete account";
      setDeleteAccountError(message);
      setStatusAnnouncement(`Failed to delete account: ${message}`);
      setDeletingAccount(false);
    }
  }

  if (!isSignedIn) {
    return null; // useRequireAuth is redirecting to /sign-in
  }

  const deleteConfirmMatches = account !== null && deleteConfirmText === account.email;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {statusAnnouncement}
      </p>

      {/* --- Language ---------------------------------------------------
          Control only, inserted as its own vertical slice per the brand
          direction's "switch available in navigation and Settings" — the
          rest of this page's content and layout is unchanged pending its
          own redesign pass. */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("common.language")}</CardTitle>
          <CardDescription>English / العربية — remembered across sessions.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          {LOCALES.map((l) => (
            <Button
              key={l}
              variant={l === locale ? "default" : "outline"}
              size="sm"
              aria-pressed={l === locale}
              onClick={() => setLocale(l)}
            >
              {LOCALE_LABELS[l]}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* --- Account --------------------------------------------------- */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>FR-AUTH-4/5.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {accountLoading && <div className="h-6 animate-pulse rounded-md border bg-secondary/50" />}
          {!accountLoading && accountError && (
            <div className="space-y-2 text-sm text-destructive">
              <p>{accountError}</p>
              <Button variant="outline" size="sm" onClick={() => loadAccount()}>
                Retry
              </Button>
            </div>
          )}
          {!accountLoading && !accountError && account && (
            <div className="text-sm">
              <p>
                <span className="text-muted-foreground">Email: </span>
                {account.email}
              </p>
              <p>
                <span className="text-muted-foreground">Member since: </span>
                {new Date(account.member_since).toLocaleDateString()}
              </p>
            </div>
          )}

          <div className="border-t pt-4">
            <h3 ref={deleteHeadingRef} tabIndex={-1} className="mb-1 font-medium text-destructive outline-none">
              Delete account
            </h3>
            <p className="mb-3 text-sm text-muted-foreground">
              Permanently deletes your CareerOS account and every piece of data associated with
              it — profile, goals, skill-gap analyses, roadmaps, CV feedback, notifications, and
              subscription. This cannot be undone.
            </p>

            {!showDeleteConfirm && (
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                Delete my account
              </Button>
            )}

            {showDeleteConfirm && account && (
              <div className="space-y-2 rounded-md border border-destructive p-3">
                <Label htmlFor="delete-confirm-email">
                  Type <span className="font-mono">{account.email}</span> to confirm
                </Label>
                <Input
                  id="delete-confirm-email"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  disabled={deletingAccount}
                  aria-describedby={deleteAccountError ? "delete-account-error" : undefined}
                  aria-invalid={deleteAccountError ? true : undefined}
                />
                {deleteAccountError && (
                  <p id="delete-account-error" className="text-sm text-destructive">
                    {deleteAccountError}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={!deleteConfirmMatches || deletingAccount}
                    onClick={handleDeleteAccount}
                  >
                    {deletingAccount ? "Deleting…" : "Permanently delete my account"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={deletingAccount}
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText("");
                      setDeleteAccountError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* --- Subscription & Billing -------------------------------------- */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Subscription &amp; billing</CardTitle>
          <CardDescription>FR-SET-1, FR-SET-4.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscriptionLoading && <div className="h-6 animate-pulse rounded-md border bg-secondary/50" />}
          {!subscriptionLoading && subscriptionError && (
            <div className="space-y-2 text-sm text-destructive">
              <p>{subscriptionError}</p>
              <Button variant="outline" size="sm" onClick={() => loadSubscription()}>
                Retry
              </Button>
            </div>
          )}
          {!subscriptionLoading && !subscriptionError && subscription && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Badge>{subscription.tier}</Badge>
                <Badge
                  className={
                    subscription.status === "canceled"
                      ? "bg-transparent"
                      : "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                  }
                >
                  {subscription.status}
                </Badge>
              </div>
              {subscription.cancellation_reason && (
                <p className="text-sm text-muted-foreground">
                  Cancellation reason: {subscription.cancellation_reason}
                </p>
              )}

              {subscription.status !== "canceled" && (
                <div className="space-y-2 border-t pt-3">
                  <Label htmlFor="cancel-reason">Reason for cancelling (optional)</Label>
                  <Textarea
                    id="cancel-reason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    disabled={cancelling}
                    rows={2}
                  />
                  {cancelError && (
                    <p role="alert" className="text-sm text-destructive">
                      {cancelError}
                    </p>
                  )}
                  <Button variant="outline" size="sm" disabled={cancelling} onClick={handleCancelSubscription}>
                    {cancelling ? "Cancelling…" : "Cancel subscription"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    BR-SUB-4/5: takes effect immediately for record-keeping; your data is retained
                    and your account is not deleted.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="mb-2 font-medium">Renewal recap</h3>
            {recapLoading && <div className="h-16 animate-pulse rounded-md border bg-secondary/50" />}
            {!recapLoading && recapError && (
              <div className="space-y-2 text-sm text-destructive">
                <p>{recapError}</p>
                <Button variant="outline" size="sm" onClick={() => loadRecap()}>
                  Retry
                </Button>
              </div>
            )}
            {!recapLoading && !recapError && recap && (
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Member since {new Date(recap.member_since).toLocaleDateString()}</li>
                <li>
                  Roadmap items completed: {recap.roadmap_items_completed_count} of{" "}
                  {recap.roadmap_items_total_count}
                </li>
                <li>Distinct skills addressed: {recap.skills_addressed_count}</li>
                <li>CV feedback rounds: {recap.cv_feedback_rounds_count}</li>
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      {/* --- Notification preferences ------------------------------------ */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Notification preferences</CardTitle>
          <CardDescription>FR-NOTIF-3 — muted categories are never delivered.</CardDescription>
        </CardHeader>
        <CardContent>
          {notifPrefsLoading && <div className="h-16 animate-pulse rounded-md border bg-secondary/50" />}
          {!notifPrefsLoading && notifPrefsError && (
            <div className="space-y-2 text-sm text-destructive">
              <p>{notifPrefsError}</p>
              <Button variant="outline" size="sm" onClick={() => loadNotifPrefs()}>
                Retry
              </Button>
            </div>
          )}
          {!notifPrefsLoading && !notifPrefsError && notifPrefs && (
            <ul className="space-y-2">
              {notifPrefs.available_categories.map((category) => {
                const muted = notifPrefs.muted_categories.includes(category);
                return (
                  <li key={category} className="flex items-center justify-between">
                    <span className="text-sm">{CATEGORY_LABELS[category] ?? category}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-pressed={!muted}
                      disabled={updatingCategory === category}
                      onClick={() => handleToggleCategory(category)}
                    >
                      {updatingCategory === category ? "Updating…" : muted ? "Muted — Unmute" : "Enabled — Mute"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* --- AI & Memory Controls ------------------------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle>AI &amp; memory controls</CardTitle>
          <CardDescription>BR-DATA-6 / DPR-14 — everything used to personalize your experience.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {dataLoading && <div className="h-24 animate-pulse rounded-md border bg-secondary/50" />}
          {!dataLoading && dataError && (
            <div className="space-y-2 text-sm text-destructive">
              <p>{dataError}</p>
              <Button variant="outline" size="sm" onClick={() => loadDataOverview()}>
                Retry
              </Button>
            </div>
          )}
          {!dataLoading && !dataError && dataOverview && (
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Profile data present: {dataOverview.profile_present ? "Yes" : "No"}</li>
              <li>Goals: {dataOverview.goals_count}</li>
              <li>Skill-gap analyses: {dataOverview.skill_gap_analyses_count}</li>
              <li>Roadmaps: {dataOverview.roadmaps_count}</li>
              <li>CV feedback rounds: {dataOverview.cv_feedback_rounds_count}</li>
              <li>Notifications: {dataOverview.notifications_count}</li>
              <li>Subscription tier: {dataOverview.subscription_tier ?? "none"}</li>
            </ul>
          )}

          <div className="border-t pt-4">
            {clearProfileError && (
              <p role="alert" className="mb-2 text-sm text-destructive">
                {clearProfileError}
              </p>
            )}
            <Button variant="outline" size="sm" disabled={clearingProfile} onClick={handleClearProfileData}>
              {clearingProfile ? "Clearing…" : "Clear profile data"}
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">
              FR-SET-3, BR-DATA-3/4 — clears background, education, experience, and skills. Does
              not remove analyses, roadmaps, or CV feedback already generated.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
