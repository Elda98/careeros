"use client";

import { useAuth } from "@clerk/nextjs";
import { AlertCircle, Check, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { apiFetch } from "@/lib/api";
import { groupByRecency, labelForGroup } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { CATEGORY_BADGE_VARIANT, CATEGORY_HREF, CATEGORY_ICON, categoryKey } from "@/lib/notification-categories";
import type { NotificationRead } from "@/lib/types";
import { cn } from "@/lib/utils";

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

  const groups = useMemo(() => groupByRecency(notifications, (n) => n.created_at), [notifications]);

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
              const timeLabel = labelForGroup(group.key, date, locale);

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
