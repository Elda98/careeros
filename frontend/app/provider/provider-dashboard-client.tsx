"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/locale-provider";

export function ProviderDashboardClient({ name }: { name: string }) {
  const { t } = useTranslations();
  return (
    <div className="mb-2">
      <h1 className="text-title text-foreground">{t("providerDashboard.welcome", { name })}</h1>
      <p className="mt-1 text-small text-muted-foreground">{t("providerDashboard.subtitle")}</p>
      <Button variant="outline" className="mt-4" asChild>
        <Link href="/provider/onboarding">{t("providerDashboard.editProfile")}</Link>
      </Button>
    </div>
  );
}
