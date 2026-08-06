"use client";

import { useAuth } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { ExplanationRead } from "@/lib/types";

/**
 * On-request explanation affordance (RAI-4, FR-AICC-5/11/16, PRD §28.8 —
 * scoped to one specific output, never open-ended). Its own small client
 * component so it can be dropped into an otherwise-static server-rendered
 * page (Skill-Gap Analysis, Roadmap) without converting the whole page to
 * client-side rendering.
 *
 * Renders `grounded_on` alongside the explanation text — the backend has
 * always returned it, but the previous version of this component silently
 * discarded it. Surfacing it is a presentation change only: same endpoint,
 * same response shape, same request/loading/error flow.
 */
export function ExplainButton({ endpoint }: { endpoint: string }) {
  const { getToken } = useAuth();
  const { t } = useTranslations();
  const [explanation, setExplanation] = useState<ExplanationRead | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (explanation) {
      setExplanation(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const data = await apiFetch<ExplanationRead>(endpoint, { token });
      setExplanation(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.explainError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2">
      <Button variant="ghost" size="sm" onClick={handleClick} isLoading={loading} className="-ms-2 text-muted-foreground hover:text-foreground">
        {!loading && <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
        {loading ? t("common.explaining") : explanation ? t("common.hideExplanation") : t("common.why")}
      </Button>

      {error && (
        <p className="mt-1 text-caption text-destructive">
          {error}{" "}
          <button type="button" className="underline underline-offset-2 hover:no-underline" onClick={handleClick}>
            {t("common.retry")}
          </button>
        </p>
      )}

      {explanation && (
        <div className="mt-2 animate-slide-up rounded-lg border-s-2 border-primary bg-secondary/60 p-3">
          <p className="text-small text-foreground">{explanation.explanation}</p>
          {explanation.grounded_on.length > 0 && (
            <p className="mt-2 text-caption text-muted-foreground">
              {t("common.groundedIn")}: {explanation.grounded_on.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
