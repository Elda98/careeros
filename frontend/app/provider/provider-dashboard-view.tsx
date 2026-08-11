import { HandHeart } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ServiceListingRead, ServiceProviderProfileRead } from "@/lib/types";

import { ProviderDashboardClient } from "./provider-dashboard-client";
import { ProviderServicesPanel } from "./provider-services-panel";

/** The Service Provider persona's own Home — same reasoning as
 * CompanyDashboardView: rendered inside the shared AppShell with its own
 * short nav (PROVIDER_NAV_GROUPS), showing the provider's actual saved
 * profile plus their own service listings. */
export function ProviderDashboardView({
  profile,
  services,
}: {
  profile: ServiceProviderProfileRead | null;
  services: ServiceListingRead[];
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8 sm:px-8">
      <ProviderDashboardClient name={profile?.professional_title ?? ""} />

      <Card className="mt-6 animate-fade-in">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HandHeart className="h-4 w-4" aria-hidden="true" />
            </span>
            <CardTitle>{profile?.professional_title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {profile?.expertise && profile.expertise.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.expertise.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-border-subtle bg-background px-2.5 py-1 text-caption text-foreground"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
          {profile?.description && (
            <p className="text-small text-foreground" dir="auto">
              {profile.description}
            </p>
          )}
          {profile?.contact_info && <p className="text-small text-muted-foreground">{profile.contact_info}</p>}
        </CardContent>
      </Card>

      <ProviderServicesPanel initialServices={services} />
    </div>
  );
}
