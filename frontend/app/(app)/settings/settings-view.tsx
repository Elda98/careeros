"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { Check, LogOut, Moon, ShieldCheck, Sun, SunMoon, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { SectionError } from "@/components/section-error";
import { StatCard } from "@/components/stat-card";
import { apiFetch, extractApiErrorMessage } from "@/lib/api";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/config";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type {
  AccountRead,
  DataOverviewRead,
  GoalRead,
  NotificationPreferenceRead,
  ProfileRead,
  RenewalRecapRead,
  SubscriptionRead,
} from "@/lib/types";

import type { Fetched } from "@/lib/server-fetch";

/**
 * Split from page.tsx for the same reason as every other migrated page:
 * translated, reactive rendering of already-fetched data, plus every
 * client-only interaction this page has. Settings is the widest page
 * migrated so far — seven independent backend resources, each fetched and
 * failed independently in the Server Component (one section's error never
 * blocks another), each mutation here mirrored into local state and
 * reconciled with `router.refresh()` on success, exactly like Roadmap/CV
 * Feedback/Notifications.
 */
export function SettingsView({
  account,
  subscription,
  recap,
  notifPrefs,
  dataOverview,
  profile,
  activeGoal,
}: {
  account: Fetched<AccountRead>;
  subscription: Fetched<SubscriptionRead>;
  recap: Fetched<RenewalRecapRead>;
  notifPrefs: Fetched<NotificationPreferenceRead>;
  dataOverview: Fetched<DataOverviewRead>;
  profile: Fetched<ProfileRead>;
  activeGoal: Fetched<GoalRead>;
}) {
  const { t } = useTranslations();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();

  const [statusAnnouncement, setStatusAnnouncement] = useState("");

  // --- Subscription ------------------------------------------------------
  const [sub, setSub] = useState(subscription.data);
  useEffect(() => setSub(subscription.data), [subscription.data]);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  async function handleCancelSubscription() {
    setCancelling(true);
    setCancelError(null);
    setStatusAnnouncement(t("settings.subscription.cancelling"));
    try {
      const token = await getToken();
      const updated = await apiFetch<SubscriptionRead>("/settings/subscription/cancel", {
        method: "POST",
        body: JSON.stringify(cancelReason.trim() ? { reason: cancelReason.trim() } : {}),
        token,
      });
      setSub(updated);
      setCancelReason("");
      router.refresh();
    } catch (e) {
      setCancelError(e instanceof Error ? extractApiErrorMessage(e.message) : t("settings.subscription.cancelError"));
    } finally {
      setCancelling(false);
    }
  }

  // --- Notification preferences ------------------------------------------
  const [prefs, setPrefs] = useState(notifPrefs.data);
  useEffect(() => setPrefs(notifPrefs.data), [notifPrefs.data]);
  const [updatingCategory, setUpdatingCategory] = useState<string | null>(null);

  async function handleToggleCategory(category: string) {
    if (!prefs) return;
    const isMuted = prefs.muted_categories.includes(category);
    const nextMuted = isMuted
      ? prefs.muted_categories.filter((c) => c !== category)
      : [...prefs.muted_categories, category];

    setUpdatingCategory(category);
    try {
      const token = await getToken();
      const updated = await apiFetch<NotificationPreferenceRead>("/settings/notification-preferences", {
        method: "PATCH",
        body: JSON.stringify({ muted_categories: nextMuted }),
        token,
      });
      setPrefs(updated);
      router.refresh();
    } catch (e) {
      toast.error(t("settings.notifications.loadError"), {
        description: e instanceof Error ? extractApiErrorMessage(e.message) : undefined,
      });
    } finally {
      setUpdatingCategory(null);
    }
  }

  // --- Privacy & data ------------------------------------------------------
  const [overview, setOverview] = useState(dataOverview.data);
  useEffect(() => setOverview(dataOverview.data), [dataOverview.data]);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  async function handleClearProfileData() {
    setClearDialogOpen(false);
    setClearing(true);
    try {
      const token = await getToken();
      await apiFetch<ProfileRead>("/profile", { method: "DELETE", token });
      toast.success(t("settings.privacy.clearSuccess"));
      router.refresh();
      // The data-overview counts are derived server-side from the same
      // profile row; re-fetching just that one number here would duplicate
      // the Server Component's own fetch, so the visible "Profile data:
      // Present" flips to "Not set" on the next full data reload instead.
    } catch (e) {
      toast.error(t("settings.privacy.clearError"), {
        description: e instanceof Error ? extractApiErrorMessage(e.message) : undefined,
      });
    } finally {
      setClearing(false);
    }
  }

  // --- Account deletion ----------------------------------------------------
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    setDeleteAccountError(null);
    setStatusAnnouncement(t("settings.dangerZone.deleting"));
    try {
      const token = await getToken();
      await apiFetch("/settings/account", { method: "DELETE", token });
      await signOut(() => router.push("/"));
    } catch (e) {
      setDeleteAccountError(e instanceof Error ? extractApiErrorMessage(e.message) : t("settings.dangerZone.deleteError"));
      setDeletingAccount(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Screen-reader-only live region — visually hidden, announced on change. */}
      <p role="status" aria-live="polite" className="sr-only">
        {statusAnnouncement}
      </p>

      <ProfileGoalCard profile={profile} activeGoal={activeGoal} />
      <AccountCard account={account} />
      <SubscriptionCard
        sub={sub}
        subError={subscription.error}
        recap={recap}
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
        cancelling={cancelling}
        cancelError={cancelError}
        onCancel={handleCancelSubscription}
      />
      <NotificationPrefsCard
        prefs={prefs}
        error={notifPrefs.error}
        updatingCategory={updatingCategory}
        onToggle={handleToggleCategory}
      />
      <PreferencesCard />
      <PrivacyCard overview={overview} error={dataOverview.error} clearing={clearing} onClearClick={() => setClearDialogOpen(true)} />
      <SecurityCard onSignOut={() => signOut(() => router.push("/"))} />
      <DangerZoneCard
        account={account.data}
        showConfirm={showDeleteConfirm}
        onStart={() => setShowDeleteConfirm(true)}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeleteConfirmText("");
          setDeleteAccountError(null);
        }}
        confirmText={deleteConfirmText}
        setConfirmText={setDeleteConfirmText}
        deleting={deletingAccount}
        error={deleteAccountError}
        onDelete={handleDeleteAccount}
      />

      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.privacy.clearConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("settings.privacy.clearConfirmDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleClearProfileData}>
              {t("settings.privacy.clearAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


function ProfileGoalCard({ profile, activeGoal }: { profile: Fetched<ProfileRead>; activeGoal: Fetched<GoalRead> }) {
  const { t } = useTranslations();
  const p = profile.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.profile.title")}</CardTitle>
        <CardDescription>{t("settings.profile.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile.error && <SectionError message={t("settings.profile.loadError")} error={profile.error} retryHref="/settings" />}
        {p && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-caption font-medium text-muted-foreground">{t("settings.profile.backgroundLabel")}</p>
                <p className="line-clamp-2 text-small text-foreground">{p.background || t("settings.profile.notSet")}</p>
              </div>
              <div>
                <p className="text-caption font-medium text-muted-foreground">{t("settings.profile.educationLabel")}</p>
                <p className="line-clamp-2 text-small text-foreground">{p.education || t("settings.profile.notSet")}</p>
              </div>
              <div>
                <p className="text-caption font-medium text-muted-foreground">{t("settings.profile.experienceLabel")}</p>
                <p className="line-clamp-2 text-small text-foreground">{p.experience || t("settings.profile.notSet")}</p>
              </div>
            </div>

            <div>
              <p className="text-caption font-medium text-muted-foreground">{t("settings.profile.skillsLabel")}</p>
              {p.skills.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {p.skills.slice(0, 6).map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                  {p.skills.length > 6 && <Badge variant="outline">+{p.skills.length - 6}</Badge>}
                </div>
              ) : (
                <p className="text-small text-foreground">{t("settings.profile.notSet")}</p>
              )}
            </div>

            <Separator />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-caption font-medium text-muted-foreground">{t("settings.profile.activeGoal")}</p>
                {activeGoal.data ? (
                  <p className="text-small text-foreground" dir="auto">
                    {activeGoal.data.target_role}
                    {activeGoal.data.target_field && (
                      <span className="text-muted-foreground"> — {activeGoal.data.target_field}</span>
                    )}
                  </p>
                ) : (
                  <p className="text-small text-muted-foreground">
                    {activeGoal.error ? t("settings.profile.loadError") : t("settings.profile.noGoal")}
                  </p>
                )}
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/profile">{t("settings.profile.editLink")}</Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AccountCard({ account }: { account: Fetched<AccountRead> }) {
  const { t, locale } = useTranslations();
  const a = account.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.account.title")}</CardTitle>
        <CardDescription>{t("settings.account.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {account.error && <SectionError message={t("settings.account.loadError")} error={account.error} retryHref="/settings" />}
        {a && (
          <dl className="space-y-2 text-small">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">{t("settings.account.email")}</dt>
              <dd className="text-foreground">{a.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">{t("settings.account.memberSince")}</dt>
              <dd className="text-foreground">
                {new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(
                  new Date(a.member_since),
                )}
              </dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

function SubscriptionCard({
  sub,
  subError,
  recap,
  cancelReason,
  setCancelReason,
  cancelling,
  cancelError,
  onCancel,
}: {
  sub: SubscriptionRead | null;
  subError: string | null;
  recap: Fetched<RenewalRecapRead>;
  cancelReason: string;
  setCancelReason: (v: string) => void;
  cancelling: boolean;
  cancelError: string | null;
  onCancel: () => void;
}) {
  const { t, locale } = useTranslations();
  const r = recap.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.subscription.title")}</CardTitle>
        <CardDescription>{t("settings.subscription.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subError && <SectionError message={t("settings.subscription.loadError")} error={subError} retryHref="/settings" />}
        {sub && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={sub.tier === "paid" ? "primary" : "outline"}>{t(`settings.subscription.tier.${sub.tier}`)}</Badge>
              <Badge variant={sub.status === "active" ? "success" : "outline"}>
                {t(`settings.subscription.status.${sub.status}`)}
              </Badge>
            </div>
            {sub.cancellation_reason && (
              <p className="text-small text-muted-foreground">
                {t("settings.subscription.cancellationReason")}: {sub.cancellation_reason}
              </p>
            )}

            {sub.status !== "canceled" && (
              <div className="space-y-2 border-t border-border-subtle pt-3">
                <Label htmlFor="cancel-reason">{t("settings.subscription.cancelReasonLabel")}</Label>
                <Textarea
                  id="cancel-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder={t("settings.subscription.cancelReasonPlaceholder")}
                  disabled={cancelling}
                  rows={2}
                />
                {cancelError && <p className="text-small text-destructive">{cancelError}</p>}
                <Button variant="outline" size="sm" disabled={cancelling} isLoading={cancelling} onClick={onCancel}>
                  {cancelling ? t("settings.subscription.cancelling") : t("settings.subscription.cancel")}
                </Button>
                <p className="text-caption text-muted-foreground">{t("settings.subscription.cancelNote")}</p>
              </div>
            )}
          </div>
        )}

        <Separator />

        <div>
          <h3 className="mb-2 text-small font-medium text-foreground">{t("settings.subscription.recapTitle")}</h3>
          {recap.error && <SectionError message={t("settings.subscription.loadError")} error={recap.error} retryHref="/settings" />}
          {r && (
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard
                label={t("settings.subscription.recapRoadmapCompleted")}
                value={`${r.roadmap_items_completed_count} / ${r.roadmap_items_total_count}`}
              />
              <StatCard label={t("settings.subscription.recapSkillsAddressed")} value={String(r.skills_addressed_count)} />
              <StatCard label={t("settings.subscription.recapCvRounds")} value={String(r.cv_feedback_rounds_count)} />
              <StatCard
                label={t("settings.subscription.recapMemberSince")}
                value={new Intl.DateTimeFormat(locale, { year: "numeric", month: "short" }).format(new Date(r.member_since))}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationPrefsCard({
  prefs,
  error,
  updatingCategory,
  onToggle,
}: {
  prefs: NotificationPreferenceRead | null;
  error: string | null;
  updatingCategory: string | null;
  onToggle: (category: string) => void;
}) {
  const { t } = useTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.notifications.title")}</CardTitle>
        <CardDescription>{t("settings.notifications.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <SectionError message={t("settings.notifications.loadError")} error={error} retryHref="/settings" />}
        {prefs && (
          <ul className="divide-y divide-border-subtle">
            {prefs.available_categories.map((category) => {
              const muted = prefs.muted_categories.includes(category);
              const isUpdating = updatingCategory === category;
              return (
                <li key={category} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${muted ? "bg-muted-foreground" : "bg-success"}`}
                      aria-hidden="true"
                    />
                    <span className="text-small text-foreground">{t(`notifications.category.${category}`)}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-pressed={!muted}
                    disabled={isUpdating}
                    isLoading={isUpdating}
                    onClick={() => onToggle(category)}
                  >
                    {isUpdating
                      ? t("settings.notifications.updating")
                      : muted
                        ? t("settings.notifications.unmute")
                        : t("settings.notifications.mute")}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

const THEME_OPTIONS: { value: "light" | "dark" | "system"; icon: typeof Sun }[] = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: SunMoon },
];

function PreferencesCard() {
  const { t, locale, setLocale } = useTranslations();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.preferences.title")}</CardTitle>
        <CardDescription>{t("settings.preferences.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-small font-medium text-foreground">{t("settings.preferences.themeLabel")}</p>
          <div className="flex flex-wrap gap-2">
            {mounted &&
              THEME_OPTIONS.map(({ value, icon: Icon }) => (
                <Button
                  key={value}
                  variant={theme === value ? "default" : "outline"}
                  size="sm"
                  aria-pressed={theme === value}
                  onClick={() => setTheme(value)}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {t(`common.${value}`)}
                </Button>
              ))}
            {!mounted && <div className="h-9 w-full" aria-hidden="true" />}
          </div>
        </div>

        <Separator />

        <div>
          <p className="mb-2 text-small font-medium text-foreground">{t("common.language")}</p>
          <div className="flex flex-wrap gap-2">
            {LOCALES.map((l: Locale) => (
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PrivacyCard({
  overview,
  error,
  clearing,
  onClearClick,
}: {
  overview: DataOverviewRead | null;
  error: string | null;
  clearing: boolean;
  onClearClick: () => void;
}) {
  const { t } = useTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.privacy.title")}</CardTitle>
        <CardDescription>{t("settings.privacy.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <SectionError message={t("settings.privacy.loadError")} error={error} retryHref="/settings" />}
        {overview && (
          <dl className="space-y-1.5 text-small">
            <DataRow label={t("settings.privacy.profilePresent")} value={overview.profile_present ? t("settings.privacy.present") : t("settings.privacy.notPresent")} />
            <DataRow label={t("settings.privacy.goals")} value={String(overview.goals_count)} />
            <DataRow label={t("settings.privacy.analyses")} value={String(overview.skill_gap_analyses_count)} />
            <DataRow label={t("settings.privacy.roadmaps")} value={String(overview.roadmaps_count)} />
            <DataRow label={t("settings.privacy.cvRounds")} value={String(overview.cv_feedback_rounds_count)} />
            <DataRow label={t("settings.privacy.notificationsCount")} value={String(overview.notifications_count)} />
            <DataRow
              label={t("settings.privacy.subscriptionTier")}
              value={overview.subscription_tier ? t(`settings.subscription.tier.${overview.subscription_tier}`) : t("settings.privacy.none")}
            />
          </dl>
        )}

        <Link href="/privacy" className="inline-block text-caption font-medium text-primary underline-offset-2 hover:underline">
          {t("settings.privacy.policyLink")}
        </Link>

        <Separator />

        <div>
          <h3 className="mb-1 text-small font-medium text-foreground">{t("settings.privacy.clearTitle")}</h3>
          <p className="mb-3 text-caption text-muted-foreground">{t("settings.privacy.clearDescription")}</p>
          <Button variant="outline" size="sm" disabled={clearing} isLoading={clearing} onClick={onClearClick}>
            {clearing ? t("settings.privacy.clearing") : t("settings.privacy.clearAction")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

function SecurityCard({ onSignOut }: { onSignOut: () => void }) {
  const { t } = useTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.security.title")}</CardTitle>
        <CardDescription>{t("settings.security.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-small text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
          <span>{t("settings.security.managedByClerk")}</span>
        </div>
        <Button variant="outline" size="sm" className="mt-3" onClick={onSignOut}>
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          {t("settings.security.signOut")}
        </Button>
      </CardContent>
    </Card>
  );
}

function DangerZoneCard({
  account,
  showConfirm,
  onStart,
  onCancel,
  confirmText,
  setConfirmText,
  deleting,
  error,
  onDelete,
}: {
  account: AccountRead | null;
  showConfirm: boolean;
  onStart: () => void;
  onCancel: () => void;
  confirmText: string;
  setConfirmText: (v: string) => void;
  deleting: boolean;
  error: string | null;
  onDelete: () => void;
}) {
  const { t } = useTranslations();
  const matches = account !== null && confirmText === account.email;

  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardHeader>
        <CardTitle className="text-destructive">{t("settings.dangerZone.title")}</CardTitle>
        <CardDescription>{t("settings.dangerZone.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {!showConfirm && (
          <Button variant="destructive" size="sm" onClick={onStart}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {t("settings.dangerZone.deleteAction")}
          </Button>
        )}

        {showConfirm && account && (
          <div className="space-y-2.5 rounded-xl border border-destructive/40 bg-surface p-3.5">
            <Label htmlFor="delete-confirm-email">{t("settings.dangerZone.confirmLabel", { email: account.email })}</Label>
            <Input
              id="delete-confirm-email"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={deleting}
              aria-describedby={error ? "delete-account-error" : undefined}
              aria-invalid={error ? true : undefined}
            />
            {error && (
              <p id="delete-account-error" className="text-small text-destructive">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="destructive" size="sm" disabled={!matches || deleting} isLoading={deleting} onClick={onDelete}>
                {!deleting && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                {deleting ? t("settings.dangerZone.deleting") : t("settings.dangerZone.confirmAction")}
              </Button>
              <Button variant="outline" size="sm" disabled={deleting} onClick={onCancel}>
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
