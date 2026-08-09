"use client";

import { useAuth } from "@clerk/nextjs";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/logo";
import { RemovableSkillChip } from "@/components/removable-skill-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, extractApiErrorMessage } from "@/lib/api";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { ServiceProviderProfileRead } from "@/lib/types";

export function ProviderOnboardingForm() {
  const { t } = useTranslations();
  const { getToken } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [expertiseDraft, setExpertiseDraft] = useState("");
  const [description, setDescription] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addExpertise() {
    const value = expertiseDraft.trim();
    if (value && !expertise.includes(value)) setExpertise([...expertise, value]);
    setExpertiseDraft("");
  }

  function removeExpertise(skill: string) {
    setExpertise(expertise.filter((s) => s !== skill));
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const token = await getToken();
      await apiFetch<ServiceProviderProfileRead>("/account/service-provider-profile", {
        method: "PATCH",
        body: JSON.stringify({
          professional_title: title,
          expertise,
          description,
          contact_info: contactInfo,
        }),
        token,
      });
      router.push("/provider");
    } catch (e) {
      setError(e instanceof Error ? extractApiErrorMessage(e.message) : t("providerOnboarding.error"));
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
            {t("providerOnboarding.title")}
          </CardTitle>
          <CardDescription>{t("providerOnboarding.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="provider-title">{t("providerOnboarding.titleLabel")}</Label>
            <Input
              id="provider-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("providerOnboarding.titlePlaceholder")}
              disabled={submitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="provider-expertise">{t("providerOnboarding.expertiseLabel")}</Label>
            <div className="flex gap-2">
              <Input
                id="provider-expertise"
                value={expertiseDraft}
                onChange={(e) => setExpertiseDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addExpertise();
                  }
                }}
                placeholder={t("providerOnboarding.expertisePlaceholder")}
                disabled={submitting}
              />
              <Button type="button" variant="outline" onClick={addExpertise} disabled={submitting}>
                {t("providerOnboarding.addExpertise")}
              </Button>
            </div>
            {expertise.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {expertise.map((skill) => (
                  <RemovableSkillChip
                    key={skill}
                    skill={skill}
                    onRemove={() => removeExpertise(skill)}
                    disabled={submitting}
                    removeLabel={t("providerOnboarding.removeExpertise", { skill })}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="provider-description">{t("providerOnboarding.descriptionLabel")}</Label>
            <Textarea
              id="provider-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("providerOnboarding.descriptionPlaceholder")}
              disabled={submitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="provider-contact">{t("providerOnboarding.contactLabel")}</Label>
            <Input
              id="provider-contact"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder={t("providerOnboarding.contactPlaceholder")}
              disabled={submitting}
            />
          </div>

          <Button onClick={handleSubmit} disabled={submitting || !title.trim()} isLoading={submitting}>
            {t("providerOnboarding.submit")}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
