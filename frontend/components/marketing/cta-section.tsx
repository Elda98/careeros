"use client";

import { SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Reveal } from "@/components/marketing/reveal";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/locale-provider";

export function CtaSection() {
  const { t } = useTranslations();

  return (
    <section className="border-t border-border-subtle py-24 sm:py-32">
      <div className="container">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-border-subtle bg-surface px-6 py-16 text-center sm:px-16">
            <div
              className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/15 via-transparent to-gradient-accent/15"
              aria-hidden="true"
            />
            <h2 className="text-title text-foreground sm:text-display">{t("cta.title")}</h2>
            <p className="mx-auto mt-4 max-w-xl text-body text-muted-foreground">{t("cta.subtitle")}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <SignedOut>
                <SignUpButton mode="modal">
                  <Button size="lg" className="group shadow-glow">
                    {t("cta.button")}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform duration-200 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Button asChild size="lg" className="group shadow-glow">
                  <Link href="/dashboard">
                    {t("common.goToDashboard")}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform duration-200 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                  </Link>
                </Button>
              </SignedIn>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
