"use client";

import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { LanguageToggle } from "@/components/language-toggle";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

const LINK_KEYS = [
  { href: "#features", key: "nav.features" },
  { href: "#how-it-works", key: "nav.howItWorks" },
  { href: "#about", key: "nav.about" },
  { href: "#faq", key: "nav.faq" },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslations();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border-subtle bg-background/75 backdrop-blur-lg"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {LINK_KEYS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-small font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(link.key)}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-1 md:flex">
          <LanguageToggle />
          <ThemeToggle />
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">
                {t("common.signIn")}
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm">{t("common.getStarted")}</Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Button asChild size="sm">
              <Link href="/dashboard">{t("common.goToDashboard")}</Link>
            </Button>
          </SignedIn>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <LanguageToggle />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border-subtle bg-background/95 backdrop-blur-lg md:hidden">
          <nav className="container flex flex-col gap-1 py-4" aria-label="Primary">
            {LINK_KEYS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-2 py-2.5 text-body font-medium text-foreground hover:bg-accent"
              >
                {t(link.key)}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border-subtle pt-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="outline">{t("common.signIn")}</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button>{t("common.getStarted")}</Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Button asChild>
                  <Link href="/dashboard">{t("common.goToDashboard")}</Link>
                </Button>
              </SignedIn>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
