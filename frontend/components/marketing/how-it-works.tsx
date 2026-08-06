"use client";

import { Reveal } from "@/components/marketing/reveal";
import { useTranslations } from "@/lib/i18n/locale-provider";

const STEP_KEYS = ["goal", "analysis", "roadmap", "progress"];
const STEP_NUMBERS = ["01", "02", "03", "04"];

export function HowItWorksSection() {
  const { t } = useTranslations();

  return (
    <section id="how-it-works" className="border-t border-border-subtle py-24 sm:py-32">
      <div className="container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-caption font-semibold uppercase tracking-wide text-primary">{t("howItWorks.eyebrow")}</p>
          <h2 className="mt-3 text-title text-foreground sm:text-display">{t("howItWorks.title")}</h2>
          <p className="mt-4 text-body text-muted-foreground">{t("howItWorks.subtitle")}</p>
        </Reveal>

        <div className="relative mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <div
            className="absolute inset-x-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block"
            aria-hidden="true"
          />
          {STEP_KEYS.map((key, i) => (
            <Reveal key={key} delay={i * 90} className="relative">
              <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-small font-semibold text-primary shadow-xs">
                {STEP_NUMBERS[i]}
              </span>
              <h3 className="mt-5 text-heading text-foreground">{t(`howItWorks.steps.${key}.title`)}</h3>
              <p className="mt-2 text-small text-muted-foreground">{t(`howItWorks.steps.${key}.description`)}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
