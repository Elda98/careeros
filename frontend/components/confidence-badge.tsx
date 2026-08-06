"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { ConfidenceLevel } from "@/lib/types";

const VARIANT: Record<ConfidenceLevel, "success" | "warning" | "destructive"> = {
  high: "success",
  medium: "warning",
  low: "destructive",
};

const DOT: Record<ConfidenceLevel, string> = {
  high: "bg-success",
  medium: "bg-warning",
  low: "bg-destructive",
};

const LABEL_KEY: Record<ConfidenceLevel, string> = {
  high: "common.confidenceHigh",
  medium: "common.confidenceMedium",
  low: "common.confidenceLow",
};

/**
 * RAI-6: confidence must be presented at the point of output, never
 * understated. A dot + label (not color alone) so the signal doesn't
 * depend on color perception, and a visible reason whenever confidence
 * isn't High — reduced certainty is never buried behind a request.
 *
 * "use client" so the label can react to a language switch — safe to render
 * directly from a Server Component parent (e.g. a page's own auth+fetch
 * component), since Server Components may render Client Components as
 * children.
 */
export function ConfidenceBadge({ level, reason }: { level: ConfidenceLevel; reason?: string }) {
  const { t } = useTranslations();
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Badge variant={VARIANT[level]}>
        <span className={`h-1.5 w-1.5 rounded-full ${DOT[level]}`} aria-hidden="true" />
        {t(LABEL_KEY[level])} {t("common.confidence")}
      </Badge>
      {level !== "high" && reason && <span className="text-caption text-muted-foreground">{reason}</span>}
    </span>
  );
}
