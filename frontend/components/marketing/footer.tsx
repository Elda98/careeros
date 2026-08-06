"use client";

import { Github, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { BRAND } from "@/lib/brand";
import { useTranslations } from "@/lib/i18n/locale-provider";

const PRODUCT_LINKS = [
  { href: "#features", key: "nav.features" },
  { href: "#how-it-works", key: "nav.howItWorks" },
  { href: "#agents", key: "footer.aiAgents" },
  { href: "#preview", key: "footer.productPreview" },
];

const COMPANY_LINKS = [
  { href: "#about", key: "nav.about" },
  { href: "#faq", key: "nav.faq" },
  { href: "/sign-up", key: "common.getStarted" },
  { href: "/sign-in", key: "common.signIn" },
];

const LEGAL_LINKS = [
  { href: "/privacy", key: "footer.privacyPolicy" },
  { href: "/terms", key: "footer.termsOfService" },
];

/** Real accounts don't exist yet — inert, purely visual placeholders (same spirit as the explicitly-placeholder testimonials), not links to a real or fabricated external identity. */
const SOCIALS = [
  { icon: Twitter, label: "X (Twitter)" },
  { icon: Github, label: "GitHub" },
  { icon: Linkedin, label: "LinkedIn" },
];

function FooterColumn({ title, links, t }: { title: string; links: { href: string; key: string }[]; t: (k: string) => string }) {
  return (
    <div>
      <h3 className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-small text-muted-foreground transition-colors hover:text-foreground">
              {t(link.key)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const { t } = useTranslations();

  return (
    <footer className="border-t border-border-subtle">
      <div className="container py-16">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-small text-muted-foreground">{BRAND.description}</p>
            <div className="mt-6 flex gap-2">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={`${social.label} (coming soon)`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title={t("footer.product")} links={PRODUCT_LINKS} t={t} />
          <FooterColumn title={t("footer.company")} links={COMPANY_LINKS} t={t} />
          <FooterColumn title={t("footer.legal")} links={LEGAL_LINKS} t={t} />
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border-subtle pt-8 sm:flex-row">
          <p className="text-caption text-muted-foreground">
            © {new Date().getFullYear()} {BRAND.fullName}. {t("footer.rights")}
          </p>
          <p className="text-caption text-muted-foreground">{t("footer.tagline")}</p>
        </div>
      </div>
    </footer>
  );
}
