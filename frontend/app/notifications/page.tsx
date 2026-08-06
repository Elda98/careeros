"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type { NotificationRead } from "@/lib/types";
import { useRequireAuth } from "@/lib/use-require-auth";

const CATEGORY_LABELS: Record<string, string> = {
  analysis_complete: "Skill-Gap Analysis",
  roadmap_updated: "Roadmap",
  cv_feedback_complete: "CV Feedback",
};

export default function NotificationsPage() {
  const { getToken } = useAuth();
  const { isSignedIn } = useRequireAuth();
  const [notifications, setNotifications] = useState<NotificationRead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const data = await apiFetch<NotificationRead[]>("/notifications", { token });
      setNotifications(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isSignedIn) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  async function markRead(id: string) {
    // Optimistic update — FR-NOTIF (implicit): marking read should feel
    // instant, not wait on a round trip; reconciled against the server on
    // the next full load if it ever disagrees.
    setNotifications((prev) => prev?.map((n) => (n.id === id ? { ...n, is_read: true } : n)) ?? null);
    try {
      const token = await getToken();
      await apiFetch(`/notifications/${id}/read`, { method: "PATCH", token });
    } catch {
      await load(); // reconcile with server truth if the write failed
    }
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>

      {loading && (
        <div className="animate-pulse space-y-2">
          <div className="h-16 rounded-md border bg-secondary/50" />
          <div className="h-16 rounded-md border bg-secondary/50" />
        </div>
      )}

      {!loading && error && (
        <Card className="border-destructive">
          <CardContent className="space-y-2 pt-6 text-sm text-destructive">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={() => load()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && notifications?.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No notifications yet. You&apos;ll see one here whenever an analysis, roadmap update, or CV
            feedback is ready.
          </CardContent>
        </Card>
      )}

      {!loading && !error && notifications && notifications.length > 0 && (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li key={n.id}>
              <Card className={n.is_read ? "opacity-60" : undefined}>
                <CardContent className="flex items-start justify-between gap-4 pt-4">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <Badge className="text-xs">{CATEGORY_LABELS[n.category] ?? n.category}</Badge>
                      {!n.is_read && <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-label="unread" />}
                    </div>
                    <p className="text-sm">{n.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!n.is_read && (
                    <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}>
                      Mark read
                    </Button>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
