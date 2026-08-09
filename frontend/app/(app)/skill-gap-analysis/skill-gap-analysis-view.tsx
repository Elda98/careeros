"use client";

import { useAuth } from "@clerk/nextjs";
import { AlertCircle, RefreshCw, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ConfidenceBadge } from "@/components/confidence-badge";
import { ExplainButton } from "@/components/explain-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { apiFetch, extractApiErrorMessage } from "@/lib/api";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { ConfidenceLevel, ServiceListingWithProviderRead, SkillGapAnalysisRead } from "@/lib/types";

const SEVERITY_VARIANT: Record<ConfidenceLevel, "destructive" | "warning" | "success"> = {
  high: "destructive",
  medium: "warning",
  low: "success",
};

const SEVERITY_KEY: Record<ConfidenceLevel, string> = {
  high: "skillGapAnalysis.severity.high",
  medium: "skillGapAnalysis.severity.medium",
  low: "skillGapAnalysis.severity.low",
};

/**
 * Split from page.tsx for the same reason as Dashboard's split (see
 * app/(app)/dashboard/dashboard-view.tsx): translated, reactive rendering
 * of an already-fetched Server Component result, plus the one client-only
 * interaction this page has — requesting a refreshed analysis.
 */
export function SkillGapAnalysisView({
  analysis,
  notFound,
  error,
  recommendedServices,
}: {
  analysis: SkillGapAnalysisRead | null;
  notFound: boolean;
  error: string | null;
  recommendedServices: ServiceListingWithProviderRead[];
}) {
  const { t } = useTranslations();
  const { getToken } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const token = await getToken();
      await apiFetch("/ai-career-center/skill-gap-analysis/refresh", { method: "POST", token });
      toast.success(t("skillGapAnalysis.refreshSuccess"));
      router.refresh();
    } catch (e) {
      toast.error(t("skillGapAnalysis.refreshError"), {
        description: e instanceof Error ? extractApiErrorMessage(e.message) : undefined,
      });
    } finally {
      setRefreshing(false);
    }
  }

  if (error) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-body font-medium text-foreground">{t("skillGapAnalysis.loadError")}</p>
            <p className="mt-1 text-small text-muted-foreground">{error}</p>
          </div>
          {/* The fetch happens in a Server Component — a real page reload is the correct retry mechanism. */}
          <Button asChild variant="outline" size="sm">
            <a href="/skill-gap-analysis">{t("common.retry")}</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (notFound || !analysis) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Target className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="text-title text-foreground">{t("skillGapAnalysis.emptyTitle")}</p>
            <p className="mx-auto mt-1.5 max-w-sm text-small text-muted-foreground">
              {t("skillGapAnalysis.emptyDescription")}
            </p>
          </div>
          <Button asChild className="mt-2">
            <Link href="/onboarding">{t("common.completeOnboarding")}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="animate-fade-in">
      <Card className="overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary to-primary/30" aria-hidden="true" />
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {t("skillGapAnalysis.eyebrow")}
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} isLoading={refreshing}>
              {!refreshing && <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
              {refreshing ? t("skillGapAnalysis.refreshing") : t("skillGapAnalysis.refresh")}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="outline">{t("common.version", { n: analysis.version })}</Badge>
            <ConfidenceBadge level={analysis.confidence} reason={analysis.confidence_reason} />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-body text-foreground">{analysis.summary}</p>

          <h2 className="mt-6 text-small font-medium text-muted-foreground">{t("skillGapAnalysis.gapsTitle")}</h2>
          <ul className="mt-3 space-y-3">
            {analysis.gaps.map((gap) => (
              <li
                key={gap.id}
                className="rounded-xl border border-border-subtle bg-surface p-4 shadow-xs transition-shadow duration-200 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-foreground">{gap.skill}</p>
                  <Badge variant={SEVERITY_VARIANT[gap.severity]}>{t(SEVERITY_KEY[gap.severity])}</Badge>
                </div>
                <p className="mt-1 text-small text-muted-foreground">{gap.description}</p>
                <ExplainButton endpoint={`/ai-career-center/skill-gap-analysis/gaps/${gap.id}/explain`} />
              </li>
            ))}
          </ul>

          {analysis.grounded_on.length > 0 && (
            <p className="mt-6 text-caption text-muted-foreground">
              {t("common.groundedIn")}: {analysis.grounded_on.join(", ")}
            </p>
          )}
        </CardContent>
      </Card>

      {recommendedServices.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-heading text-foreground">{t("skillGapAnalysis.recommendedServicesTitle")}</h2>
            <Link href="/services" className="text-small font-medium text-primary hover:underline">
              {t("skillGapAnalysis.browseAllServices")}
            </Link>
          </div>
          <p className="mt-1 text-small text-muted-foreground">{t("skillGapAnalysis.recommendedServicesSubtitle")}</p>
          <div className="mt-3 space-y-3">
            {recommendedServices.map((service) => (
              <Card key={service.id}>
                <CardHeader className="flex-row items-start justify-between space-y-0">
                  <div>
                    <p className="font-medium text-foreground">{service.title}</p>
                    <p className="mt-1 text-small text-muted-foreground">{service.provider_title}</p>
                  </div>
                  {service.category && <Badge variant="outline">{service.category}</Badge>}
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
