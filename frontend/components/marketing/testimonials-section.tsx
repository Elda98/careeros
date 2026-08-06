"use client";

import { Reveal } from "@/components/marketing/reveal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTranslations } from "@/lib/i18n/locale-provider";

/**
 * Placeholder content, deliberately — no real customer quotes exist yet.
 * Generic first-name-plus-initial attribution and a role only (no
 * fabricated company affiliation, no photo implying a real person) so
 * nothing here could be mistaken for an actual review.
 */
const TESTIMONIAL_KEYS = ["amara", "daniel", "priya"];

export function TestimonialsSection() {
  const { t } = useTranslations();

  return (
    <section className="border-t border-border-subtle py-24 sm:py-32">
      <div className="container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-caption font-semibold uppercase tracking-wide text-primary">{t("testimonials.eyebrow")}</p>
          <h2 className="mt-3 text-title text-foreground sm:text-display">{t("testimonials.title")}</h2>
        </Reveal>

        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {TESTIMONIAL_KEYS.map((key, i) => {
            const name = t(`testimonials.items.${key}.name`);
            return (
              <Reveal key={key} delay={i * 90}>
                <figure className="flex h-full flex-col rounded-2xl border border-border-subtle bg-surface p-7 shadow-xs">
                  <blockquote className="flex-1 text-small leading-relaxed text-foreground">
                    &ldquo;{t(`testimonials.items.${key}.quote`)}&rdquo;
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-border-subtle pt-5">
                    <Avatar>
                      <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-small font-medium text-foreground">{name}</p>
                      <p className="text-caption text-muted-foreground">{t(`testimonials.items.${key}.role`)}</p>
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
