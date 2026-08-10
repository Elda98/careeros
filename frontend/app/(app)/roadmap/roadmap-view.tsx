"use client";

import { useAuth } from "@clerk/nextjs";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleDot,
  Route as RouteIcon,
  SkipForward,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ConfidenceBadge } from "@/components/confidence-badge";
import { ExplainButton } from "@/components/explain-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { apiFetch, extractApiErrorMessage } from "@/lib/api";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { RoadmapItemRead, RoadmapItemStatus, RoadmapRead } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: RoadmapItemStatus[] = ["not_started", "in_progress", "completed", "skipped"];

const STATUS_ICON: Record<RoadmapItemStatus, typeof Circle> = {
  not_started: Circle,
  in_progress: CircleDot,
  completed: Check,
  skipped: SkipForward,
};

const STATUS_DOT_CLASS: Record<RoadmapItemStatus, string> = {
  not_started: "border-border bg-surface text-muted-foreground",
  in_progress: "border-primary bg-primary/10 text-primary",
  completed: "border-success bg-success/15 text-success",
  skipped: "border-border bg-muted text-muted-foreground",
};

const STATUS_TEXT_CLASS: Record<RoadmapItemStatus, string> = {
  not_started: "text-muted-foreground",
  in_progress: "text-primary",
  completed: "text-success",
  skipped: "text-muted-foreground",
};

const STATUS_INDICATOR_CLASS: Record<RoadmapItemStatus, string> = {
  not_started: "bg-muted-foreground",
  in_progress: "bg-primary",
  completed: "bg-success",
  skipped: "bg-muted-foreground",
};

/**
 * Split from page.tsx for the same reason as Dashboard and Skill-Gap
 * Analysis: translated, reactive rendering of already-fetched data, plus
 * this page's client-only interaction — changing a roadmap item's status.
 *
 * Items are mirrored into local state so a status change can update the
 * timeline instantly (optimistic) rather than waiting on a full
 * Server-Component round trip; `router.refresh()` still runs afterward to
 * reconcile with the server, and a failed update reverts the optimistic
 * change.
 */
export function RoadmapView({
  roadmap,
  notFound,
  error,
}: {
  roadmap: RoadmapRead | null;
  notFound: boolean;
  error: string | null;
}) {
  const { t } = useTranslations();
  const { getToken } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<RoadmapItemRead[]>(roadmap?.items ?? []);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  useEffect(() => {
    setItems(roadmap?.items ?? []);
  }, [roadmap]);

  async function updateStatus(itemId: string, status: RoadmapItemStatus) {
    const previous = items;
    setItems((current) => current.map((i) => (i.id === itemId ? { ...i, status } : i)));
    setUpdatingItemId(itemId);
    try {
      const token = await getToken();
      await apiFetch(`/ai-career-center/roadmap/items/${itemId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
        token,
      });
      if (status === "completed") {
        toast.success(t("roadmap.statusUpdateSuccess"));
      }
      router.refresh();
    } catch (e) {
      setItems(previous);
      toast.error(t("roadmap.statusUpdateError"), {
        description: e instanceof Error ? extractApiErrorMessage(e.message) : undefined,
      });
    } finally {
      setUpdatingItemId(null);
    }
  }

  if (error) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-body font-medium text-foreground">{t("roadmap.loadError")}</p>
            <p className="mt-1 text-small text-muted-foreground">{error}</p>
          </div>
          {/* The fetch happens in a Server Component — a real page reload is the correct retry mechanism. */}
          <Button asChild variant="outline" size="sm">
            <a href="/roadmap">{t("common.retry")}</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (notFound || !roadmap) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <RouteIcon className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="text-title text-foreground">{t("roadmap.emptyTitle")}</p>
            <p className="mx-auto mt-1.5 max-w-sm text-small text-muted-foreground">{t("roadmap.emptyDescription")}</p>
          </div>
          <Button asChild className="mt-2">
            <Link href="/onboarding">{t("common.completeOnboarding")}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const total = items.length;
  const completedCount = items.filter((i) => i.status === "completed").length;
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const isFullyComplete = total > 0 && completedCount === total;
  const activeIndex = items.findIndex((i) => i.status === "not_started" || i.status === "in_progress");

  return (
    <div className="animate-fade-in">
      <Card className="overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary to-primary/30" aria-hidden="true" />
        <CardHeader className="pb-3">
          <div className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {t("roadmap.eyebrow")}
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="outline">{t("common.version", { n: roadmap.version })}</Badge>
            <ConfidenceBadge level={roadmap.confidence} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-small font-medium text-foreground">
              {t("roadmap.progress", { completed: completedCount, total })}
            </p>
            {isFullyComplete && (
              <span className="flex items-center gap-1.5 text-caption font-medium text-success">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                {t("roadmap.complete")}
              </span>
            )}
          </div>
          <Progress
            value={percent}
            className="mt-2.5"
            aria-label={t("roadmap.progress", { completed: completedCount, total })}
          />
        </CardContent>
      </Card>

      <h2 className="mb-4 mt-8 text-small font-medium text-muted-foreground">{t("roadmap.pathForward")}</h2>
      <ol className="list-none">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isUpNext = index === activeIndex;
          const isUpdating = updatingItemId === item.id;
          const StatusIcon = STATUS_ICON[item.status];

          return (
            <li key={item.id} className="relative flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200",
                    STATUS_DOT_CLASS[item.status],
                    item.status === "in_progress" && "animate-pulse",
                  )}
                >
                  <StatusIcon className="h-4 w-4" aria-hidden="true" />
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "w-px flex-1 transition-colors duration-300",
                      item.status === "completed" ? "bg-success" : "bg-border",
                    )}
                  />
                )}
              </div>

              <div className={cn("min-w-0 flex-1", isLast ? "pb-0" : "pb-5")}>
                <div
                  className={cn(
                    "rounded-xl border border-border-subtle bg-surface shadow-xs transition-shadow duration-200 hover:shadow-md",
                    isUpNext && "ring-2 ring-primary/30",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      {isUpNext && (
                        <span className="mb-1 block text-caption font-semibold uppercase tracking-wide text-primary">
                          {t("roadmap.upNext")}
                        </span>
                      )}
                      <p className="font-medium text-foreground" dir="auto">
                        {item.title}
                      </p>
                      <p className="mt-1 text-small text-muted-foreground" dir="auto">
                        {item.description}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isUpdating}
                          isLoading={isUpdating}
                          className={cn("shrink-0 gap-1.5", STATUS_TEXT_CLASS[item.status])}
                          aria-label={`${t("roadmap.statusLabel")}: ${t(`roadmap.status.${item.status}`)}`}
                        >
                          {!isUpdating && (
                            <span
                              className={cn("h-1.5 w-1.5 rounded-full", STATUS_INDICATOR_CLASS[item.status])}
                              aria-hidden="true"
                            />
                          )}
                          {t(`roadmap.status.${item.status}`)}
                          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {STATUS_OPTIONS.map((s) => (
                          <DropdownMenuItem key={s} onSelect={() => updateStatus(item.id, s)}>
                            <span className="flex h-4 w-4 items-center justify-center">
                              {item.status === s && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                            </span>
                            {t(`roadmap.status.${s}`)}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Native <details>/<summary>: keyboard-operable and screen-reader-announced with zero custom ARIA. */}
                  <details className="group/details border-t border-border-subtle">
                    <summary className="flex cursor-pointer list-none items-center gap-1.5 px-4 py-2.5 text-caption font-medium text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
                      {t("common.viewDetails")}
                      <ChevronDown
                        className="h-3.5 w-3.5 transition-transform duration-200 group-open/details:rotate-180"
                        aria-hidden="true"
                      />
                    </summary>
                    <div className="animate-slide-up space-y-3 px-4 pb-4">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-caption text-secondary-foreground">
                        <Target className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span>
                          {t("roadmap.addresses")}: {item.addresses_gap}
                        </span>
                      </div>
                      <ExplainButton endpoint={`/ai-career-center/roadmap/items/${item.id}/explain`} />
                    </div>
                  </details>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
