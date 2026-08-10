"use client";

import {
  AlertCircle,
  ArrowRight,
  Bell,
  Briefcase,
  FileText,
  Mic,
  Route as RouteIcon,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import Link from "next/link";

import { ConfidenceBadge } from "@/components/confidence-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type {
  CommunityGroupRead,
  DashboardRead,
  GoalRead,
  InterviewSessionRead,
  NotificationRead,
  RenewalRecapRead,
  SkillGapAnalysisRead,
} from "@/lib/types";

/**
 * Home — the one screen meant to answer "where do I stand, and what's
 * next?" without further navigation. Everything below the readiness card
 * is real data reused from other modules (Progress's recap, Interview
 * Prep's own session list, Community's membership, Opportunities' open
 * count) — Home doesn't own any of it, it just makes the continuity
 * across the whole product ("PRODUCT COHERENCE": Profile -> Goal -> Skill
 * Analysis -> Gaps -> Roadmap -> Progress -> CV -> Interview ->
 * Opportunities -> Community -> Growth -> Re-analysis) visible in one
 * place, which no single module page does on its own.
 */
export function DashboardView({
  dashboard,
  error,
  goal,
  analysis,
  recap,
  recentNotifications,
  interviewSessions,
  myCommunityGroups,
  openOpportunitiesCount,
}: {
  dashboard: DashboardRead | null;
  error: string | null;
  goal: GoalRead | null;
  analysis: SkillGapAnalysisRead | null;
  recap: RenewalRecapRead | null;
  recentNotifications: NotificationRead[];
  interviewSessions: InterviewSessionRead[];
  myCommunityGroups: CommunityGroupRead[];
  openOpportunitiesCount: number;
}) {
  const { t } = useTranslations();

  const quickLinks = [
    { href: "/skill-gap-analysis", label: t("nav.skillGapAnalysis"), description: t("dashboard.quickLinks.skillGapDescription"), icon: Target },
    { href: "/roadmap", label: t("nav.roadmap"), description: t("dashboard.quickLinks.roadmapDescription"), icon: RouteIcon },
    { href: "/cv-feedback", label: t("nav.cvFeedback"), description: t("dashboard.quickLinks.cvFeedbackDescription"), icon: FileText },
    { href: "/interview", label: t("nav.interview"), description: t("dashboard.quickLinks.interviewDescription"), icon: Mic },
  ];

  if (error) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-body font-medium text-foreground">{t("dashboard.loadError")}</p>
            <p className="mt-1 text-small text-muted-foreground">{error}</p>
          </div>
          {/* The fetch happens in a Server Component — a real page reload is the correct retry mechanism. */}
          <Button asChild variant="outline" size="sm">
            <a href="/dashboard">{t("common.retry")}</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!dashboard) {
    return null;
  }

  const roadmapPercent =
    recap && recap.roadmap_items_total_count > 0
      ? Math.round((recap.roadmap_items_completed_count / recap.roadmap_items_total_count) * 100)
      : null;
  const completedInterviews = interviewSessions.filter((s) => s.status === "completed" && s.overall_score !== null);
  const latestInterviewScore = completedInterviews.at(0)?.overall_score ?? null;

  return (
    <>
      <div>
        <h1 className="text-title text-foreground">
          {goal ? t("dashboard.greetingWithGoal", { role: goal.target_role }) : t("dashboard.greeting")}
        </h1>
        {!goal && <p className="mt-1 text-small text-muted-foreground">{t("dashboard.noGoalYet")}</p>}
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary to-primary/30" aria-hidden="true" />
        <CardHeader className="pb-3">
          <div className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {t("dashboard.recommendedNext")}
          </div>
          {dashboard.current_confidence && <ConfidenceBadge level={dashboard.current_confidence} />}
        </CardHeader>
        <CardContent className="space-y-4">
          {dashboard.next_action ? (
            <div>
              <p className="text-title text-foreground">{dashboard.next_action.title}</p>
              <p className="mt-1.5 text-small text-muted-foreground">{dashboard.next_action.reason}</p>
            </div>
          ) : (
            <div>
              <p className="text-title text-foreground">{t("dashboard.allCaughtUp")}</p>
              <p className="mt-1.5 text-small text-muted-foreground">{t("dashboard.allCaughtUpDescription")}</p>
            </div>
          )}

          {analysis && analysis.gaps.length > 0 && (
            <div>
              <p className="text-caption font-medium text-muted-foreground">{t("dashboard.topGaps")}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {analysis.gaps.slice(0, 3).map((gap) => (
                  <Badge key={gap.id} variant="outline">
                    {gap.skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {roadmapPercent !== null && (
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-caption font-medium text-muted-foreground">{t("dashboard.roadmapProgress")}</p>
                <p className="text-caption text-muted-foreground">
                  {t("roadmap.progress", {
                    completed: recap!.roadmap_items_completed_count,
                    total: recap!.roadmap_items_total_count,
                  })}
                </p>
              </div>
              <Progress value={roadmapPercent} className="mt-1.5" aria-label={t("dashboard.roadmapProgress")} />
            </div>
          )}

          <Button asChild>
            <Link href="/roadmap">
              {dashboard.next_action ? t("dashboard.viewRoadmap") : t("dashboard.reviewRoadmap")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <SnapshotCard
          href="/interview"
          icon={Mic}
          label={t("nav.interview")}
          value={
            completedInterviews.length > 0
              ? t("dashboard.snapshot.interviewScore", { score: latestInterviewScore ?? 0 })
              : t("dashboard.snapshot.interviewEmpty")
          }
        />
        <SnapshotCard
          href="/community"
          icon={Users}
          label={t("nav.community")}
          value={t("dashboard.snapshot.communityCount", { count: myCommunityGroups.length })}
        />
        <SnapshotCard
          href="/opportunities"
          icon={Briefcase}
          label={t("nav.opportunities")}
          value={t("dashboard.snapshot.opportunitiesCount", { count: openOpportunitiesCount })}
        />
      </div>

      {recentNotifications.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-small font-medium text-muted-foreground">
              <Bell className="h-4 w-4" aria-hidden="true" />
              {t("dashboard.recentActivity")}
            </h2>
            <Link href="/notifications" className="text-caption font-medium text-primary hover:underline">
              {t("dashboard.viewAllActivity")}
            </Link>
          </div>
          <div className="space-y-2">
            {recentNotifications.map((n) => (
              <div key={n.id} className="rounded-xl border border-border-subtle bg-surface p-3.5">
                <p className="text-small text-foreground">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-3 text-small font-medium text-muted-foreground">{t("dashboard.continueWhereYouLeftOff")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group rounded-xl border border-border-subtle bg-surface p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <p className="mt-3 text-small font-medium text-foreground">{link.label}</p>
                <p className="mt-1 text-caption text-muted-foreground">{link.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

function SnapshotCard({
  href,
  icon: Icon,
  label,
  value,
}: {
  href: string;
  icon: typeof Mic;
  label: string;
  value: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-border-subtle bg-surface p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center gap-2 text-caption font-medium text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-2 text-body font-semibold text-foreground">{value}</p>
    </Link>
  );
}
