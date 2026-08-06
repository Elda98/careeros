"use client";

import { SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/locale-provider";

export function Hero() {
  const { t } = useTranslations();

  return (
    <section className="relative overflow-hidden pb-24 pt-40 sm:pb-32 sm:pt-48">
      {/* Animated background — layered blurred blobs drifting slowly, evoking
          the orbit motif without a heavy WebGL/canvas dependency. Purely
          decorative/symmetric, so it's left unmirrored in RTL. */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-[-10%] h-[36rem] w-[36rem] -translate-x-[60%] animate-float-slow rounded-full bg-primary/25 blur-[110px]" />
        <div className="absolute right-0 top-[10%] h-[28rem] w-[28rem] translate-x-1/3 animate-float-slower rounded-full bg-gradient-accent/20 blur-[100px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      <div className="container relative flex flex-col items-center text-center">
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface/80 px-3.5 py-1.5 text-caption font-medium text-muted-foreground shadow-xs backdrop-blur-sm animate-fade-in">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          {t("hero.eyebrow")}
        </div>

        <h1 className="max-w-4xl text-hero sm:text-6xl lg:text-7xl">
          {t("hero.headlinePrefix")}{" "}
          <span className="bg-gradient-to-r from-primary to-gradient-accent bg-clip-text text-transparent">
            {t("hero.headlineHighlight")}
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-body text-muted-foreground sm:text-lg">{t("hero.subtitle")}</p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <SignedOut>
            <SignUpButton mode="modal">
              <Button size="lg" className="group shadow-glow">
                {t("common.getStarted")}
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
          <Button asChild variant="outline" size="lg">
            <a href="#how-it-works">{t("hero.seeHowItWorks")}</a>
          </Button>
        </div>

        <p className="mt-14 text-caption uppercase tracking-wide text-muted-foreground">{t("hero.trustLine")}</p>
      </div>
    </section>
  );
}
