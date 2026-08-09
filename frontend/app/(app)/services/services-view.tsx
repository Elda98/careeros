"use client";

import { AlertCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { ServiceListingWithProviderRead } from "@/lib/types";

export function ServicesView({
  services,
  error,
}: {
  services: ServiceListingWithProviderRead[];
  error: string | null;
}) {
  const { t } = useTranslations();

  return (
    <>
      <h1 className="text-title text-foreground">{t("providerServices.browseTitle")}</h1>
      <p className="mt-1 text-small text-muted-foreground">{t("providerServices.browseSubtitle")}</p>

      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <p className="text-small text-foreground">{error}</p>
        </div>
      )}

      {!error && services.length === 0 && (
        <p className="mt-6 text-small text-muted-foreground">{t("providerServices.noActiveServices")}</p>
      )}

      <div className="mt-6 space-y-3">
        {services.map((service) => (
          <Card key={service.id} className="animate-fade-in">
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-body">{service.title}</CardTitle>
                <p className="mt-1 text-small text-muted-foreground">{service.provider_title}</p>
              </div>
              {service.category && <Badge variant="outline">{service.category}</Badge>}
            </CardHeader>
            <CardContent className="space-y-3">
              {service.description && <p className="text-small text-foreground">{service.description}</p>}
              {service.provider_expertise.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {service.provider_expertise.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
              {service.provider_contact_info && (
                <p className="text-caption text-muted-foreground">
                  {t("providerServices.contact")}: {service.provider_contact_info}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
