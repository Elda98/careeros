import { HandHeart } from "lucide-react";

import { Logo } from "@/components/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ServiceProviderProfileRead } from "@/lib/types";

import { ProviderDashboardClient } from "./provider-dashboard-client";

/** The Service Provider persona's own landing surface — same reasoning as
 * CompanyDashboardView: not the (app) Sidebar shell, a real minimal
 * dashboard showing the provider's actual saved profile. Service listing
 * management/discovery is the next milestone. */
export function ProviderDashboardView({ profile }: { profile: ServiceProviderProfileRead | null }) {
  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-3xl px-6 py-12 sm:px-8">
      <div className="mb-8 flex items-center gap-3">
        <Logo size={32} />
      </div>

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
          {profile?.description && <p className="text-small text-foreground">{profile.description}</p>}
          {profile?.contact_info && <p className="text-small text-muted-foreground">{profile.contact_info}</p>}
        </CardContent>
      </Card>
    </main>
  );
}
