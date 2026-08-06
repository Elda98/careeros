"use client";

import { FileSearch, ListChecks, ScanSearch } from "lucide-react";

import { Reveal } from "@/components/marketing/reveal";
import { useTranslations } from "@/lib/i18n/locale-provider";

const AGENT_KEYS = [
  { icon: ScanSearch, key: "skillGap" },
  { icon: ListChecks, key: "roadmap" },
  { icon: FileSearch, key: "cvFeedback" },
];

export function AiAgentsSection() {
  const { t } = useTranslations();

  return (
    <section id="agents" className="relative overflow-hidden border-t border-border-subtle py-24 sm:py-32">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent"
        aria-hidden="true"
      />
      <div className="container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-caption font-semibold uppercase tracking-wide text-primary">{t("aiAgents.eyebrow")}</p>
          <h2 className="mt-3 text-title text-foreground sm:text-display">{t("aiAgents.title")}</h2>
          <p className="mt-4 text-body text-muted-foreground">{t("aiAgents.subtitle")}</p>
        </Reveal>

        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {AGENT_KEYS.map((agent, i) => {
            const Icon = agent.icon;
            return (
              <Reveal key={agent.key} delay={i * 90}>
                <div className="flex h-full flex-col rounded-2xl border border-border-subtle bg-surface/70 p-7 backdrop-blur-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-6 text-heading text-foreground">{t(`aiAgents.items.${agent.key}.name`)}</h3>
                  <p className="mt-2 flex-1 text-small text-muted-foreground">{t(`aiAgents.items.${agent.key}.role`)}</p>
                  <dl className="mt-6 space-y-1.5 border-t border-border-subtle pt-4 text-caption">
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground">{t("aiAgents.reads")}</dt>
                      <dd className="text-foreground">{t(`aiAgents.items.${agent.key}.reads`)}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground">{t("aiAgents.writes")}</dt>
                      <dd className="text-foreground">{t(`aiAgents.items.${agent.key}.writes`)}</dd>
                    </div>
                  </dl>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
