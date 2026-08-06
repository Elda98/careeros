"use client";

import { useAuth } from "@clerk/nextjs";
import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Route as RouteIcon,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { apiFetch } from "@/lib/api";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { Locale } from "@/lib/i18n/config";
import type { NotificationRead } from "@/lib/types";
import { cn } from "@/lib/utils";

// The backend's authoritative, complete list of category strings it will
// ever actually write (backend/app/schemas/settings.py's
// NOTIFICATION_CATEGORIES) is exactly these three — everything else below
// (reminder/progress_update/goal_update/system_message) is a
// forward-compatible visual slot, not a live category: nothing in this
// codebase produces them today. See frontend/README.md's Notifications
// section for why they're defined anyway.
const CATEGORY_ICON: Record<string, typeof Bell> = {
  analysis_complete: Sparkles,
  roadmap_updated: RouteIcon,
  cv_feedback_complete: FileText,
  reminder: Clock,
  progress_update: TrendingUp,
  goal_update: Target,
  system_message: Bell,
};

const CATEGORY_BADGE_VARIANT: Record<string, BadgeProps["variant"]> = {
  analysis_complete: "primary",
  roadmap_updated: "rose",
  cv_feedback_complete: "success",
  reminder: "warning",
  progress_update: "success",
  goal_update: "primary",
  system_message: "outline",
};

// Every category that currently exists also implies exactly one place to
// go look — this is the closest honest reading of "whether action is
// required" the real data supports (every notification exists because
// something is ready to view). Deliberately not extended to the
// forward-compatible-only categories above; a href for a category that
// never occurs would be untestable dead code.
const CATEGORY_HREF: Record<string, string> = {
  analysis_complete: "/skill-gap-analysis",
  roadmap_updated: "/roadmap",
  cv_feedback_complete: "/cv-feedback",
};

const KNOWN_CATEGORIES = new Set(Object.keys(CATEGORY_ICON));

function categoryKey(category: string): string {
  return KNOWN_CATEGORIES.has(category) ? category : "system_message";
}

function relativeLabel(date: Date, locale: Locale): string {
  const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, "hour");
  return rtf.format(Math.round(diffHour / 24), "day");
}

function timeOfDay(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(date);
}

function fullDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

interface Group {
  key: "today" | "yesterday" | "earlier";
  labelKey: string;
  items: NotificationRead[];
}

function groupByRecency(notifications: NotificationRead[]): Group[] {
  const now = new Date();
  const todayStart = startOfDay(now).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

  const today: NotificationRead[] = [];
  const yesterday: NotificationRead[] = [];
  const earlier: NotificationRead[] = [];

  for (const n of notifications) {
    const t = new Date(n.created_at).getTime();
    if (t >= todayStart) today.push(n);
    else if (t >= yesterdayStart) yesterday.push(n);
    else earlier.push(n);
  }

  const groups: Group[] = [
    { key: "today", labelKey: "notifications.today", items: today },
    { key: "yesterday", labelKey: "notifications.yesterday", items: yesterday },
    { key: "earlier", labelKey: "notifications.earlier", items: earlier },
  ];
  return groups.filter((g) => g.items.length > 0);
}

/**
 * Split from page.tsx for the same reason as the other three migrated
 * pages: translated, reactive rendering of already-fetched data, plus this
 * page's one client interaction — marking a notification read. Notifications
 * are mirrored into local state for an optimistic read-state flip, reverted
 * on failure, with `router.refresh()` reconciling against the server
 * afterward — same shape as Roadmap's status changes and CV Feedback's
 * submit/delete.
 *
 * No "mark all as read" action here: the backend has no bulk endpoint
 * (`PATCH /notifications/{id}/read` only ever handles one), and looping N
 * individual requests behind a single button would present a non-atomic,
 * partial-failure-prone operation as if it were one clean action — see
 * frontend/README.md's Notifications section for the honest writeup.
 */
export function NotificationsView({
  initialNotifications,
  error,
}: {
  initialNotifications: NotificationRead[] | null;
  error: string | null;
}) {
  const { t, locale } = useTranslations();
  const { getToken } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationRead[]>(initialNotifications ?? []);
  useEffect(() => {
    setNotifications(initialNotifications ?? []);
  }, [initialNotifications]);

  const [markingId, setMarkingId] = useState<string | null>(null);

  const groups = useMemo(() => groupByRecency(notifications), [notifications]);

  async function markRead(id: string) {
    const previous = notifications;
    setMarkingId(id);
    setNotifications((current) => current.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try {
      const token = await getToken();
      await apiFetch(`/notifications/${id}/read`, { method: "PATCH", token });
      router.refresh();
    } catch {
      setNotifications(previous); // reconcile with server truth if the write failed
    } finally {
      setMarkingId(null);
    }
  }

  if (error) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-body font-medium text-foreground">{t("notifications.loadError")}</p>
            <p className="mt-1 text-small text-muted-foreground">{error}</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <a href="/notifications">{t("common.retry")}</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
            <CheckCircle2 className="h-6 w-6 text-success" aria-hidden="true" />
          </div>
          <div>
            <p className="text-title text-foreground">{t("notifications.emptyTitle")}</p>
            <p className="mx-auto mt-1.5 max-w-sm text-small text-muted-foreground">
              {t("notifications.emptyDescription")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {groups.map((group) => (
        <div key={group.key}>
          <h2 className="mb-3 text-small font-medium text-muted-foreground">{t(group.labelKey)}</h2>
          <ul className="space-y-2.5">
            {group.items.map((n) => {
              const key = categoryKey(n.category);
              const Icon = CATEGORY_ICON[key];
              const href = CATEGORY_HREF[n.category];
              const date = new Date(n.created_at);
              const timeLabel = group.key === "today" ? relativeLabel(date, locale) : group.key === "yesterday" ? timeOfDay(date, locale) : fullDate(date, locale);

              return (
                <li key={n.id}>
                  <Card
                    className={cn(
                      "overflow-hidden transition-all duration-300",
                      !n.is_read && "border-s-2 border-s-primary",
                      n.is_read && "opacity-70",
                    )}
                  >
                    <CardContent className="flex items-start gap-3 p-4">
                      <div
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          n.is_read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={CATEGORY_BADGE_VARIANT[key]}>{t(`notifications.category.${key}`)}</Badge>
                          {!n.is_read && (
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                              aria-label={t("notifications.unread")}
                            />
                          )}
                          <span className="text-caption text-muted-foreground">{timeLabel}</span>
                        </div>
                        <p className="mt-1.5 text-small text-foreground">{n.message}</p>
                        {href && (
                          <Link
                            href={href}
                            className="mt-2 inline-block text-caption font-medium text-primary underline-offset-2 hover:underline"
                          >
                            {t(`notifications.viewAction.${n.category}`)}
                          </Link>
                        )}
                      </div>

                      {!n.is_read && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              disabled={markingId === n.id}
                              aria-label={t("notifications.markRead")}
                              onClick={() => markRead(n.id)}
                            >
                              <Check className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("notifications.markRead")}</TooltipContent>
                        </Tooltip>
                      )}
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
