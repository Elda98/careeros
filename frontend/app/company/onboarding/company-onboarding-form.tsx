"use client";

import { useAuth } from "@clerk/nextjs";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, extractApiErrorMessage } from "@/lib/api";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { CompanyProfileRead } from "@/lib/types";

export function CompanyOnboardingForm() {
  const { t } = useTranslations();
  const { getToken } = useAuth();
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const token = await getToken();
      await apiFetch<CompanyProfileRead>("/account/company-profile", {
        method: "PATCH",
        body: JSON.stringify({ company_name: companyName, industry, website, description }),
        token,
      });
      router.push("/company");
    } catch (e) {
      setError(e instanceof Error ? extractApiErrorMessage(e.message) : t("companyOnboarding.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col justify-center px-6 py-12 sm:px-8">
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo size={40} animated />
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <p className="text-small text-foreground">{error}</p>
        </div>
      )}

      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle tabIndex={-1} className="outline-none">
            {t("companyOnboarding.title")}
          </CardTitle>
          <CardDescription>{t("companyOnboarding.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="company-name">{t("companyOnboarding.nameLabel")}</Label>
            <Input
              id="company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder={t("companyOnboarding.namePlaceholder")}
              disabled={submitting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company-industry">{t("companyOnboarding.industryLabel")}</Label>
            <Input
              id="company-industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder={t("companyOnboarding.industryPlaceholder")}
              disabled={submitting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company-website">{t("companyOnboarding.websiteLabel")}</Label>
            <Input
              id="company-website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder={t("companyOnboarding.websitePlaceholder")}
              disabled={submitting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company-description">{t("companyOnboarding.descriptionLabel")}</Label>
            <Textarea
              id="company-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("companyOnboarding.descriptionPlaceholder")}
              disabled={submitting}
            />
          </div>
          <Button onClick={handleSubmit} disabled={submitting || !companyName.trim()} isLoading={submitting}>
            {t("companyOnboarding.submit")}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
