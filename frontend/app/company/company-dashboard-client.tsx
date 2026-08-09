"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/locale-provider";

export function CompanyDashboardClient({ companyName }: { companyName: string }) {
  const { t } = useTranslations();
  return (
    <div className="mb-2">
      <h1 className="text-title text-foreground">{t("companyDashboard.welcome", { company: companyName })}</h1>
      <p className="mt-1 text-small text-muted-foreground">{t("companyDashboard.subtitle")}</p>
      <Button variant="outline" className="mt-4" asChild>
        <Link href="/company/onboarding">{t("companyDashboard.editProfile")}</Link>
      </Button>
    </div>
  );
}
