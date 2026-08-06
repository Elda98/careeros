"use client";

import { Sparkles, Target } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { ConfidenceBadge } from "@/components/confidence-badge";
import { SectionError } from "@/components/section-error";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { groupByRecency, labelForGroup } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { CATEGORY_BADGE_VARIANT, CATEGORY_ICON, categoryKey } from "@/lib/notification-categories";
import type { Fetched } from "@/lib/server-fetch";
import type { NotificationRead, RenewalRecapRead, SkillGapAnalysisRead } from "@/lib/types";
import { cn } from "@/lib/utils";

// Dot color per notification-category Badge variant, matching Roadmap's
// timeline-dot treatment (border/bg/text tints of the same token, not new
// colors) — reused here for the milestones timeline below.
const DOT_CLASS: Record<string, string> = {
  primary: "border-primary bg-primary/10 text-primary",
  rose: "border-accent-rose bg-accent-rose/20 text-accent-rose-foreground",
  success: "border-success bg-success/15 text-success",
  warning: "border-warning bg-warning/15 text-warning",
  outline: "border-border bg-surface text-muted-foreground",
  default: "border-border bg-surface text-muted-foreground",
};

/**
 * Split from page.tsx for the same reason as every other migrated page:
 * translated, reactive rendering of already-fetched data. Unlike every
 * other page built this session, Progress has no mutations at all — it is
 * a pure read-only aggregation across four existing endpoints, so there is
 * no local mirrored state, no optimistic updates, no `router.refresh()`.
 *
 * Built entirely from data that already existed: `GET
 * /skill-gap-analysis/history` (never called by any frontend page before
 * this one — the single biggest "hidden capability" this page exposes),
 * `GET /settings/renewal-recap` (already used by Settings), the current
 * skill-gap analysis, and `GET /notifications` (already used by
 * Notifications). No new backend endpoint exists or was added — see
 * frontend/README.md's Progress section for exactly what that does and
 * doesn't make possible here, most notably: there is no `GET
 * /roadmap/history`, so "roadmap history" on this page is only ever what
 * `roadmap_updated` notifications reveal (that an update happened, and
 * when) — never a real per-version roadmap snapshot.
 */
export function ProgressView({
  recap,
  currentAnalysis,
  analysisHistory,
  notifications,
}: {
  recap: Fetched<RenewalRecapRead>;
  currentAnalysis: Fetched<SkillGapAnalysisRead>;
  analysisHistory: Fetched<SkillGapAnalysisRead[]>;
  notifications: Fetched<NotificationRead[]>;
}) {
  const { t, locale } = useTranslations();

  const notifs = useMemo(() => notifications.data ?? [], [notifications.data]);
  const milestoneGroups = useMemo(() => groupByRecency(notifs, (n) => n.created_at), [notifs]);

  const history = useMemo(
    () => [...(analysisHistory.data ?? [])].sort((a, b) => a.version - b.version),
    [analysisHistory.data],
  );
  const maxGapCount = Math.max(1, ...history.map((a) => a.gaps.length));

  if (currentAnalysis.error) {
    return <SectionError message={t("progress.loadError")} error={currentAnalysis.error} retryHref="/progress" />;
  }

  if (!currentAnalysis.data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Target className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="text-title text-foreground">{t("progress.emptyTitle")}</p>
            <p className="mx-auto mt-1.5 max-w-sm text-small text-muted-foreground">{t("progress.emptyDescription")}</p>
          </div>
          <Button asChild className="mt-2">
            <Link href="/onboarding">{t("common.completeOnboarding")}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const analysis = currentAnalysis.data;
  const recapData = recap.data;
  const roadmapPercent =
    recapData && recapData.roadmap_items_total_count > 0
      ? Math.round((recapData.roadmap_items_completed_count / recapData.roadmap_items_total_count) * 100)
      : 0;

  return (
    <div className="animate-fade-in space-y-8">
      {/* --- Career readiness ------------------------------------------- */}
      <Card className="overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary to-primary/30" aria-hidden="true" />
        <CardHeader className="pb-3">
          <div className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {t("progress.readiness.eyebrow")}
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <ConfidenceBadge level={analysis.confidence} reason={analysis.confidence_reason} />
            <Badge variant="outline">{t("progress.readiness.openGaps", { count: analysis.gaps.length })}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {recap.error && <SectionError message={t("progress.loadError")} error={recap.error} retryHref="/progress" />}
          {recapData && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-small font-medium text-foreground">{t("progress.readiness.roadmapCompletion")}</p>
                <p className="text-small text-muted-foreground">
                  {t("roadmap.progress", {
                    completed: recapData.roadmap_items_completed_count,
                    total: recapData.roadmap_items_total_count,
                  })}
                </p>
              </div>
              <Progress value={roadmapPercent} className="mt-2" aria-label={t("progress.readiness.roadmapCompletion")} />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/skill-gap-analysis">{t("progress.readiness.viewAnalysis")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/roadmap">{t("progress.readiness.viewRoadmap")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- AI insight ---------------------------------------------------- */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-1.5 text-small font-medium text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            {t("progress.insight.title")}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-small text-foreground">{analysis.summary}</p>
        </CardContent>
      </Card>

      {/* --- Skill improvement over time ------------------------------------ */}
      <div>
        <h2 className="mb-1 text-small font-medium text-foreground">{t("progress.skillImprovement.title")}</h2>
        <p className="mb-4 text-caption text-muted-foreground">{t("progress.skillImprovement.description")}</p>

        {analysisHistory.error && (
          <SectionError message={t("progress.loadError")} error={analysisHistory.error} retryHref="/progress" />
        )}

        {history.length === 1 && (
          <p className="mb-3 text-caption text-muted-foreground">{t("progress.skillImprovement.onlyOneVersion")}</p>
        )}

        {history.length > 0 && (
          <ol className="list-none">
            {history.map((version, index) => {
              const isLast = index === history.length - 1;
              const gapPercent = Math.round((version.gaps.length / maxGapCount) * 100);
              return (
                <li key={version.id} className="relative flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-primary">
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                    </div>
                    {!isLast && <div className="w-px flex-1 bg-border" />}
                  </div>
                  <div className={cn("min-w-0 flex-1", isLast ? "pb-0" : "pb-5")}>
                    <div className="rounded-xl border border-border-subtle bg-surface p-4 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{t("common.version", { n: version.version })}</Badge>
                          <ConfidenceBadge level={version.confidence} />
                        </div>
                        <span className="text-caption text-muted-foreground">
                          {new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(
                            new Date(version.created_at),
                          )}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-caption text-muted-foreground">
                            {t("progress.skillImprovement.gapsCount", { count: version.gaps.length })}
                          </span>
                        </div>
                        <Progress value={gapPercent} className="mt-1.5" />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* --- Completion metrics --------------------------------------------- */}
      <div>
        <h2 className="mb-3 text-small font-medium text-foreground">{t("progress.metrics.title")}</h2>
        {recapData && (
          <div className="grid gap-3 sm:grid-cols-4">
            <StatCard
              label={t("settings.subscription.recapRoadmapCompleted")}
              value={`${recapData.roadmap_items_completed_count} / ${recapData.roadmap_items_total_count}`}
            />
            <StatCard label={t("settings.subscription.recapSkillsAddressed")} value={String(recapData.skills_addressed_count)} />
            <StatCard label={t("settings.subscription.recapCvRounds")} value={String(recapData.cv_feedback_rounds_count)} />
            <StatCard
              label={t("settings.subscription.recapMemberSince")}
              value={new Intl.DateTimeFormat(locale, { year: "numeric", month: "short" }).format(
                new Date(recapData.member_since),
              )}
            />
          </div>
        )}
      </div>

      {/* --- Milestones / your journey ---------------------------------------- */}
      <div>
        <h2 className="mb-1 text-small font-medium text-foreground">{t("progress.milestones.title")}</h2>
        <p className="mb-4 text-caption text-muted-foreground">{t("progress.milestones.description")}</p>

        {notifications.error && (
          <SectionError message={t("progress.loadError")} error={notifications.error} retryHref="/progress" />
        )}

        {!notifications.error && notifs.length === 0 && (
          <div className="rounded-xl border border-border-subtle bg-surface p-6 text-center">
            <p className="text-small font-medium text-foreground">{t("progress.milestones.emptyTitle")}</p>
            <p className="mt-1 text-caption text-muted-foreground">{t("progress.milestones.emptyDescription")}</p>
          </div>
        )}

        <div className="space-y-6">
          {milestoneGroups.map((group) => (
            <div key={group.key}>
              <h3 className="mb-3 text-caption font-semibold uppercase tracking-wide text-muted-foreground">
                {t(group.labelKey)}
              </h3>
              <ol className="list-none">
                {group.items.map((n, index) => {
                  const isLast = index === group.items.length - 1;
                  const key = categoryKey(n.category);
                  const Icon = CATEGORY_ICON[key];
                  const variant = CATEGORY_BADGE_VARIANT[key] ?? "default";
                  const date = new Date(n.created_at);

                  return (
                    <li key={n.id} className="relative flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2", DOT_CLASS[variant])}>
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </div>
                        {!isLast && <div className="w-px flex-1 bg-border" />}
                      </div>
                      <div className={cn("min-w-0 flex-1", isLast ? "pb-0" : "pb-5")}>
                        <div className="rounded-xl border border-border-subtle bg-surface p-4 shadow-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={variant}>{t(`notifications.category.${key}`)}</Badge>
                            <span className="text-caption text-muted-foreground">{labelForGroup(group.key, date, locale)}</span>
                          </div>
                          <p className="mt-1.5 text-small text-foreground">{n.message}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
