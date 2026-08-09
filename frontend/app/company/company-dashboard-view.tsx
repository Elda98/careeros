import { Building2 } from "lucide-react";

import { Logo } from "@/components/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CompanyProfileRead, JobOpportunityRead } from "@/lib/types";

import { CompanyDashboardClient } from "./company-dashboard-client";
import { CompanyOpportunitiesPanel } from "./company-opportunities-panel";

/**
 * The Company persona's own landing surface — deliberately not the
 * (app) route group's Sidebar shell, which is built around Student/
 * Graduate navigation (Skill Gap Analysis, Roadmap, CV Feedback) that
 * doesn't apply here. Shows the company's real saved profile plus real
 * job/internship posting management (Milestone 3) — candidate matching
 * and the richer ecosystem-connection view are later milestones.
 */
export function CompanyDashboardView({
  profile,
  opportunities,
}: {
  profile: CompanyProfileRead | null;
  opportunities: JobOpportunityRead[];
}) {
  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-3xl px-6 py-12 sm:px-8">
      <div className="mb-8 flex items-center gap-3">
        <Logo size={32} />
      </div>

      <CompanyDashboardClient companyName={profile?.company_name ?? ""} />

      <Card className="mt-6 animate-fade-in">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Building2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <CardTitle>{profile?.company_name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {profile?.industry && <p className="text-small text-muted-foreground">{profile.industry}</p>}
          {profile?.description && <p className="text-small text-foreground">{profile.description}</p>}
          {profile?.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-small text-primary underline-offset-2 hover:underline"
            >
              {profile.website}
            </a>
          )}
        </CardContent>
      </Card>

      <CompanyOpportunitiesPanel initialOpportunities={opportunities} />
    </main>
  );
}
