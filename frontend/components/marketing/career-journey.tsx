"use client";

import { Reveal } from "@/components/marketing/reveal";
import { useTranslations } from "@/lib/i18n/locale-provider";

const STAGE_KEYS = ["before", "dayOne", "weeksIn", "ready"];

export function CareerJourneySection() {
  const { t } = useTranslations();

  return (
    <section id="about" className="border-t border-border-subtle py-24 sm:py-32">
      <div className="container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-caption font-semibold uppercase tracking-wide text-primary">{t("careerJourney.eyebrow")}</p>
          <h2 className="mt-3 text-title text-foreground sm:text-display">{t("careerJourney.title")}</h2>
          <p className="mt-4 text-body text-muted-foreground">{t("careerJourney.subtitle")}</p>
        </Reveal>

        <div className="relative mx-auto mt-16 max-w-2xl">
          {/* `start-*` (logical) rather than `left-*` — the dot column sits on
              the reading-start side, which flips to the right in RTL. */}
          <div
            className="absolute bottom-0 start-[15px] top-2 w-px bg-gradient-to-b from-primary/60 via-border to-transparent sm:start-[19px]"
            aria-hidden="true"
          />
          <ol className="space-y-10">
            {STAGE_KEYS.map((key, i) => (
              <Reveal key={key} delay={i * 100}>
                <li className="relative flex gap-5 sm:gap-6">
                  <span className="relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background sm:h-10 sm:w-10">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  </span>
                  <div className="pb-1">
                    <p className="text-caption font-semibold uppercase tracking-wide text-primary">
                      {t(`careerJourney.stages.${key}.label`)}
                    </p>
                    <h3 className="mt-1 text-heading text-foreground">{t(`careerJourney.stages.${key}.title`)}</h3>
                    <p className="mt-1.5 text-small text-muted-foreground">
                      {t(`careerJourney.stages.${key}.description`)}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
