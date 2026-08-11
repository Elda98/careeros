import { Building2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CompanyProfileRead, JobOpportunityRead } from "@/lib/types";

import { CompanyDashboardClient } from "./company-dashboard-client";
import { CompanyOpportunitiesPanel } from "./company-opportunities-panel";

/**
 * The Company persona's own Home — rendered inside the same AppShell
 * (Sidebar/Topbar) every persona gets, with its own short nav
 * (COMPANY_NAV_GROUPS in nav-config.ts) since none of the career-seeker
 * tools apply here. Shows the company's real saved profile plus real
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
    <div className="mx-auto max-w-3xl px-6 py-8 sm:px-8">
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
          {profile?.description && (
            <p className="text-small text-foreground" dir="auto">
              {profile.description}
            </p>
          )}
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
    </div>
  );
}
