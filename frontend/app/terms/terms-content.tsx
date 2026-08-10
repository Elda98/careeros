"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { BRAND } from "@/lib/brand";
import { useTranslations } from "@/lib/i18n/locale-provider";

export function TermsContent() {
  const { t } = useTranslations();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 sm:px-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-small text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" /> {t("legal.backToOrbit", { brand: BRAND.name })}
      </Link>

      <h1 className="mt-8 text-title text-foreground sm:text-display">{t("legal.terms.title")}</h1>
      <p className="mt-2 text-caption text-muted-foreground">{t("legal.lastUpdated", { year: new Date().getFullYear() })}</p>

      <div className="mt-10 space-y-8 text-small leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-heading text-foreground">{t("legal.terms.serviceTitle")}</h2>
          <p className="mt-2">{t("legal.terms.serviceBody", { brand: BRAND.name })}</p>
        </section>

        <section>
          <h2 className="text-heading text-foreground">{t("legal.terms.accountTitle")}</h2>
          <p className="mt-2">{t("legal.terms.accountBody")}</p>
        </section>

        <section>
          <h2 className="text-heading text-foreground">{t("legal.terms.billingTitle")}</h2>
          <p className="mt-2">{t("legal.terms.billingBody")}</p>
        </section>

        <section>
          <h2 className="text-heading text-foreground">{t("legal.terms.acceptableUseTitle")}</h2>
          <p className="mt-2">{t("legal.terms.acceptableUseBody")}</p>
        </section>

        <section>
          <h2 className="text-heading text-foreground">{t("legal.terms.changesTitle")}</h2>
          <p className="mt-2">{t("legal.terms.changesBody")}</p>
        </section>
      </div>
    </main>
  );
}
