"use client";

import { Bell, FileText, LayoutDashboard, Route, Settings, Sparkles, Target, UserCircle } from "lucide-react";

import { Reveal } from "@/components/marketing/reveal";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { useTranslations } from "@/lib/i18n/locale-provider";

const NAV_PREVIEW = [
  { icon: LayoutDashboard, active: true },
  { icon: Target, active: false },
  { icon: Route, active: false },
  { icon: FileText, active: false },
  { icon: Bell, active: false },
  { icon: UserCircle, active: false },
  { icon: Settings, active: false },
];

/**
 * A code-drawn representation of the real Dashboard UI, not a captured
 * screenshot — built from the same design tokens and components (e.g.
 * `ConfidenceBadge`) the actual app uses, inside a browser-chrome frame, so
 * it stays accurate as the real product evolves rather than going stale.
 */
export function ProductPreviewSection() {
  const { t } = useTranslations();

  return (
    <section id="preview" className="border-t border-border-subtle py-24 sm:py-32">
      <div className="container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-caption font-semibold uppercase tracking-wide text-primary">{t("productPreview.eyebrow")}</p>
          <h2 className="mt-3 text-title text-foreground sm:text-display">{t("productPreview.title")}</h2>
          <p className="mt-4 text-body text-muted-foreground">{t("productPreview.subtitle")}</p>
        </Reveal>

        <Reveal delay={100} className="mx-auto mt-14 max-w-4xl">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xl" dir="ltr">
            {/* dir="ltr" pinned — this is a fixed illustrative mockup of the
                app UI (which, like this preview, is still LTR-only pending
                its own RTL migration), not live translated content. */}
            <div className="flex items-center gap-2 border-b border-border-subtle bg-secondary/50 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
              </div>
              <div className="mx-auto flex items-center gap-1.5 rounded-md bg-background px-3 py-1 text-caption text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" /> orbit.app/dashboard
              </div>
            </div>

            <div className="flex">
              <div className="hidden w-14 shrink-0 flex-col items-center gap-3 border-e border-border-subtle bg-sidebar py-4 sm:flex">
                {NAV_PREVIEW.map((item, i) => (
                  <div
                    key={i}
                    className={
                      "flex h-8 w-8 items-center justify-center rounded-md " +
                      (item.active ? "bg-sidebar-active text-primary" : "text-sidebar-foreground/50")
                    }
                  >
                    <item.icon className="h-4 w-4" />
                  </div>
                ))}
              </div>

              <div className="flex-1 space-y-5 p-6 sm:p-8">
                <div className="overflow-hidden rounded-xl border border-border-subtle">
                  <div className="h-1 w-full bg-gradient-to-r from-primary to-gradient-accent" />
                  <div className="space-y-3 p-5">
                    <div className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-primary">
                      <Sparkles className="h-3 w-3" /> {t("productPreview.recommendedNext")}
                    </div>
                    <ConfidenceBadge level="high" />
                    <p className="text-heading text-foreground">{t("productPreview.sampleAction")}</p>
                    <p className="text-small text-muted-foreground">{t("productPreview.sampleReason")}</p>
                    <div className="h-8 w-32 rounded-full bg-primary/90" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[Target, Route, FileText].map((Icon, i) => (
                    <div key={i} className="rounded-lg border border-border-subtle p-3">
                      <Icon className="h-4 w-4 text-primary" />
                      <div className="mt-3 h-2 w-3/4 rounded bg-muted" />
                      <div className="mt-1.5 h-2 w-1/2 rounded bg-muted" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
