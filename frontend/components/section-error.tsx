"use client";

import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/locale-provider";

/**
 * Inline error notice for one independently-fetched section of a
 * multi-resource page — extracted from Settings (its first caller) when
 * Progress needed the identical treatment a second time. The retry is a
 * real page reload (the fetch happens in a Server Component), not a
 * client-side refetch, so it needs the current page's own path.
 */
export function SectionError({ message, error, retryHref }: { message: string; error: string; retryHref: string }) {
  const { t } = useTranslations();
  return (
    <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-small font-medium text-foreground">{message}</p>
        <p className="mt-1 text-caption text-muted-foreground">{error}</p>
      </div>
      <Button asChild variant="outline" size="sm">
        <a href={retryHref}>{t("common.retry")}</a>
      </Button>
    </div>
  );
}
