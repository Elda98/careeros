"use client";

import { useAuth } from "@clerk/nextjs";
import { AlertCircle, MapPin } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, extractApiErrorMessage } from "@/lib/api";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { JobOpportunityWithCompanyRead, MyApplicationRead } from "@/lib/types";

export function OpportunitiesView({
  initialOpportunities,
  initialApplications,
  error,
}: {
  initialOpportunities: JobOpportunityWithCompanyRead[];
  initialApplications: MyApplicationRead[];
  error: string | null;
}) {
  const { t } = useTranslations();
  const { getToken } = useAuth();

  const [applications, setApplications] = useState(initialApplications);
  const [applyError, setApplyError] = useState<string | null>(null);
  const appliedIds = new Set(applications.map((a) => a.opportunity.id));

  async function apply(opportunity: JobOpportunityWithCompanyRead) {
    setApplyError(null);
    try {
      const token = await getToken();
      const application = await apiFetch<MyApplicationRead>(`/opportunities/${opportunity.id}/apply`, {
        method: "POST",
        token,
      });
      setApplications((prev) => [application, ...prev]);
    } catch (e) {
      setApplyError(e instanceof Error ? extractApiErrorMessage(e.message) : t("opportunities.applyError"));
    }
  }

  return (
    <>
      <h1 className="text-title text-foreground">{t("opportunities.browseTitle")}</h1>
      <p className="mt-1 text-small text-muted-foreground">{t("opportunities.browseSubtitle")}</p>

      {(error || applyError) && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <p className="text-small text-foreground">{error ?? applyError}</p>
        </div>
      )}

      {!error && initialOpportunities.length === 0 && (
        <p className="mt-6 text-small text-muted-foreground">{t("opportunities.noOpenOpportunities")}</p>
      )}

      <div className="mt-6 space-y-3">
        {initialOpportunities.map((opportunity) => {
          const alreadyApplied = appliedIds.has(opportunity.id);
          return (
            <Card key={opportunity.id} className="animate-fade-in">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-body">{opportunity.title}</CardTitle>
                  <p className="mt-1 text-small text-muted-foreground">{opportunity.company_name}</p>
                </div>
                <Badge variant="outline">
                  {opportunity.opportunity_type === "job" ? t("opportunities.form.typeJob") : t("opportunities.form.typeInternship")}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {opportunity.location && (
                  <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {opportunity.location}
                  </p>
                )}
                {opportunity.description && <p className="text-small text-foreground">{opportunity.description}</p>}
                {opportunity.required_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {opportunity.required_skills.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
                <Button
                  size="sm"
                  variant={alreadyApplied ? "outline" : "default"}
                  disabled={alreadyApplied}
                  onClick={() => apply(opportunity)}
                >
                  {alreadyApplied ? t("opportunities.alreadyApplied") : t("opportunities.apply")}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {applications.length > 0 && (
        <div className="mt-10">
          <h2 className="text-heading text-foreground">{t("opportunities.myApplications")}</h2>
          <div className="mt-3 space-y-2">
            {applications.map((application) => (
              <div
                key={application.id}
                className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface p-3.5"
              >
                <div>
                  <p className="font-medium text-foreground">{application.opportunity.title}</p>
                  <p className="text-small text-muted-foreground">{application.opportunity.company_name}</p>
                </div>
                <Badge variant="outline">{t(`opportunities.applicantStatus.${application.status}`)}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
