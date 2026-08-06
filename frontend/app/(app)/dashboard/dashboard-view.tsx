"use client";

import { AlertCircle, ArrowRight, FileText, Route as RouteIcon, Sparkles, Target } from "lucide-react";
import Link from "next/link";

import { ConfidenceBadge } from "@/components/confidence-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { DashboardRead } from "@/lib/types";

/**
 * The translated, reactive rendering of Dashboard's already-fetched data.
 * Split from page.tsx (a Server Component, which must stay a Server
 * Component for the auth-redirect timing fix documented there) because
 * translated text needs to react to a client-side language switch without
 * a full page reload — hooks like useTranslations() can't run in a Server
 * Component. The data fetch itself stays server-side; only rendering it
 * is a client concern.
 */
export function DashboardView({ dashboard, error }: { dashboard: DashboardRead | null; error: string | null }) {
  const { t } = useTranslations();

  const quickLinks = [
    { href: "/skill-gap-analysis", label: t("nav.skillGapAnalysis"), description: t("dashboard.quickLinks.skillGapDescription"), icon: Target },
    { href: "/roadmap", label: t("nav.roadmap"), description: t("dashboard.quickLinks.roadmapDescription"), icon: RouteIcon },
    { href: "/cv-feedback", label: t("nav.cvFeedback"), description: t("dashboard.quickLinks.cvFeedbackDescription"), icon: FileText },
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

  return (
    <>
      <Card className="overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary to-primary/30" aria-hidden="true" />
        <CardHeader className="pb-3">
          <div className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {t("dashboard.recommendedNext")}
          </div>
          {dashboard.current_confidence && <ConfidenceBadge level={dashboard.current_confidence} />}
        </CardHeader>
        <CardContent>
          {dashboard.next_action ? (
            <div className="space-y-4">
              <div>
                <p className="text-title text-foreground">{dashboard.next_action.title}</p>
                <p className="mt-1.5 text-small text-muted-foreground">{dashboard.next_action.reason}</p>
              </div>
              <Button asChild>
                <Link href="/roadmap">
                  {t("dashboard.viewRoadmap")}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-title text-foreground">{t("dashboard.allCaughtUp")}</p>
                <p className="mt-1.5 text-small text-muted-foreground">{t("dashboard.allCaughtUpDescription")}</p>
              </div>
              <Button asChild variant="outline">
                <Link href="/roadmap">
                  {t("dashboard.reviewRoadmap")}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8">
        <h2 className="mb-3 text-small font-medium text-muted-foreground">{t("dashboard.continueWhereYouLeftOff")}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
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
