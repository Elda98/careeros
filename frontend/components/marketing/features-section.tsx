"use client";

import { Bell, FileText, LayoutDashboard, Route, ShieldCheck, Target } from "lucide-react";

import { Reveal } from "@/components/marketing/reveal";
import { useTranslations } from "@/lib/i18n/locale-provider";

const FEATURE_KEYS = [
  { icon: Target, key: "skillGap" },
  { icon: Route, key: "roadmap" },
  { icon: FileText, key: "cvFeedback" },
  { icon: LayoutDashboard, key: "dashboard" },
  { icon: Bell, key: "notifications" },
  { icon: ShieldCheck, key: "explainable" },
];

export function FeaturesSection() {
  const { t } = useTranslations();

  return (
    <section id="features" className="border-t border-border-subtle py-24 sm:py-32">
      <div className="container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-caption font-semibold uppercase tracking-wide text-primary">{t("features.eyebrow")}</p>
          <h2 className="mt-3 text-title text-foreground sm:text-display">{t("features.title")}</h2>
          <p className="mt-4 text-body text-muted-foreground">{t("features.subtitle")}</p>
        </Reveal>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_KEYS.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.key} delay={i * 60}>
                <div className="group h-full rounded-2xl border border-border-subtle bg-surface p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-lg">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-gradient-accent/20 text-primary transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-heading text-foreground">{t(`features.items.${feature.key}.title`)}</h3>
                  <p className="mt-2 text-small text-muted-foreground">
                    {t(`features.items.${feature.key}.description`)}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
