"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Reveal } from "@/components/marketing/reveal";
import { useTranslations } from "@/lib/i18n/locale-provider";

const FAQ_KEYS = ["what", "control", "explain", "data", "pricing"];

export function FaqSection() {
  const { t } = useTranslations();

  return (
    <section id="faq" className="border-t border-border-subtle py-24 sm:py-32">
      <div className="container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-caption font-semibold uppercase tracking-wide text-primary">{t("faq.eyebrow")}</p>
          <h2 className="mt-3 text-title text-foreground sm:text-display">{t("faq.title")}</h2>
        </Reveal>

        <Reveal delay={100} className="mx-auto mt-14 max-w-2xl">
          <Accordion type="single" collapsible>
            {FAQ_KEYS.map((key) => (
              <AccordionItem key={key} value={key}>
                <AccordionTrigger>{t(`faq.items.${key}.question`)}</AccordionTrigger>
                <AccordionContent>{t(`faq.items.${key}.answer`)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
