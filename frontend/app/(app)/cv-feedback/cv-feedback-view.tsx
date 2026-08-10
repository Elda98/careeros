"use client";

import { useAuth } from "@clerk/nextjs";
import {
  AlertCircle,
  ChevronDown,
  FileCheck,
  FileText,
  MessageSquare,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ConfidenceBadge } from "@/components/confidence-badge";
import { ExplainButton } from "@/components/explain-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, extractApiErrorMessage } from "@/lib/api";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { CVFeedbackCategory, CVFeedbackItemRead, CVFeedbackRoundRead } from "@/lib/types";

const CATEGORY_ICON: Record<CVFeedbackCategory, typeof FileCheck> = {
  factual_structural: FileCheck,
  judgment_call: MessageSquare,
};

const CATEGORY_BADGE_VARIANT: Record<CVFeedbackCategory, "primary" | "rose"> = {
  factual_structural: "primary",
  judgment_call: "rose",
};

/**
 * Split from page.tsx for the same reason as Dashboard/Skill-Gap
 * Analysis/Roadmap: translated, reactive rendering of already-fetched data,
 * plus this page's client-only interactions — submitting a new round and
 * deleting an old one. Rounds are mirrored into local state so both actions
 * can update the list instantly (optimistic), with `router.refresh()`
 * reconciling against the server afterward, same shape as Roadmap's status
 * changes.
 */
export function CVFeedbackView({
  initialRounds,
  error,
}: {
  initialRounds: CVFeedbackRoundRead[] | null;
  error: string | null;
}) {
  const { t } = useTranslations();
  const { getToken } = useAuth();
  const router = useRouter();

  const [rounds, setRounds] = useState<CVFeedbackRoundRead[]>(initialRounds ?? []);
  useEffect(() => {
    setRounds(initialRounds ?? []);
  }, [initialRounds]);

  const [documentText, setDocumentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isNoGoalError, setIsNoGoalError] = useState(false);
  const [justSubmittedId, setJustSubmittedId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<CVFeedbackRoundRead | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Accessibility: after a successful submission, move focus to the result
  // heading so screen-reader users land on the new content immediately.
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const [statusAnnouncement, setStatusAnnouncement] = useState("");

  const wordCount = documentText.trim() ? documentText.trim().split(/\s+/).length : 0;

  async function handleSubmit() {
    const trimmed = documentText.trim();
    if (!trimmed) {
      setSubmitError(t("cvFeedback.submitEmpty"));
      setIsNoGoalError(false);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    setIsNoGoalError(false);
    setStatusAnnouncement(t("cvFeedback.submitting"));
    try {
      const token = await getToken();
      const result = await apiFetch<CVFeedbackRoundRead>("/ai-career-center/cv-feedback", {
        method: "POST",
        body: JSON.stringify({ document_text: trimmed }),
        token,
      });
      setDocumentText("");
      setJustSubmittedId(result.id);
      setRounds((current) => [result, ...current]);
      setStatusAnnouncement(t("cvFeedback.submitSuccess"));
      toast.success(t("cvFeedback.submitSuccess"));
      router.refresh();
      resultHeadingRef.current?.focus();
    } catch (e) {
      // BR-AICC-14's "no active goal" rejection (a real, reachable state —
      // Settings allows deactivating a goal) gets its own affordance below
      // instead of a bare error string.
      const message = e instanceof Error ? extractApiErrorMessage(e.message) : t("cvFeedback.submitEmpty");
      setSubmitError(message);
      setIsNoGoalError(/active goal/i.test(message));
      setStatusAnnouncement(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setDeletingId(target.id);
    const previous = rounds;
    setRounds((current) => current.filter((r) => r.id !== target.id));
    try {
      const token = await getToken();
      await apiFetch(`/ai-career-center/cv-feedback/${target.id}`, { method: "DELETE", token });
      if (justSubmittedId === target.id) setJustSubmittedId(null);
      router.refresh();
    } catch (e) {
      setRounds(previous);
      toast.error(t("cvFeedback.deleteError"), {
        description: e instanceof Error ? extractApiErrorMessage(e.message) : undefined,
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Screen-reader-only live region — visually hidden, announced on change. */}
      <p role="status" aria-live="polite" className="sr-only">
        {statusAnnouncement}
      </p>

      <Card className="overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary to-primary/30" aria-hidden="true" />
        <CardHeader className="pb-3">
          <div className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {t("cvFeedback.formTitle")}
          </div>
          <CardDescription>{t("cvFeedback.formDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cv-document-text">{t("cvFeedback.textareaLabel")}</Label>
            <Textarea
              id="cv-document-text"
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              rows={8}
              placeholder={t("cvFeedback.placeholder")}
              disabled={submitting}
              aria-describedby={submitError ? "cv-submit-error" : undefined}
              aria-invalid={submitError ? true : undefined}
            />
            {wordCount > 0 && (
              <p className="text-caption text-muted-foreground">{t("cvFeedback.wordCount", { count: wordCount })}</p>
            )}
          </div>

          {submitError && !isNoGoalError && (
            <p id="cv-submit-error" className="text-small text-destructive">
              {submitError}
            </p>
          )}

          {isNoGoalError && (
            <div
              id="cv-submit-error"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning/10 p-3"
            >
              <p className="text-small text-foreground">{t("cvFeedback.noActiveGoal")}</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/profile">{t("cvFeedback.noActiveGoalAction")}</Link>
              </Button>
            </div>
          )}

          <Button onClick={handleSubmit} disabled={submitting} isLoading={submitting}>
            {!submitting && <Sparkles className="h-4 w-4" aria-hidden="true" />}
            {submitting ? t("cvFeedback.submitting") : t("cvFeedback.submit")}
          </Button>
        </CardContent>
      </Card>

      <h2
        ref={resultHeadingRef}
        tabIndex={-1}
        className="mb-4 mt-8 text-small font-medium text-muted-foreground outline-none"
      >
        {t("cvFeedback.historyTitle")}
      </h2>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-body font-medium text-foreground">{t("cvFeedback.loadError")}</p>
              <p className="mt-1 text-small text-muted-foreground">{error}</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <a href="/cv-feedback">{t("common.retry")}</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {!error && rounds.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-title text-foreground">{t("cvFeedback.emptyTitle")}</p>
              <p className="mx-auto mt-1.5 max-w-sm text-small text-muted-foreground">
                {t("cvFeedback.emptyDescription")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!error && rounds.length > 0 && (
        <ul className="space-y-3">
          {rounds.map((round) => {
            const factualItems = round.items.filter((i) => i.category === "factual_structural");
            const judgmentItems = round.items.filter((i) => i.category === "judgment_call");
            const isDeleting = deletingId === round.id;

            return (
              <li key={round.id}>
                {/* Native <details>/<summary>: keyboard-operable and screen-reader-announced with zero custom ARIA. */}
                <details
                  open={round.id === justSubmittedId}
                  className="group/round rounded-xl border border-border-subtle bg-surface shadow-xs transition-shadow duration-200 open:shadow-md"
                >
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 p-4 [&::-webkit-details-marker]:hidden">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-medium text-foreground">
                        {t("cvFeedback.round", { n: round.round_number })}
                      </span>
                      <span className="text-caption text-muted-foreground">
                        {new Date(round.created_at).toLocaleDateString()}
                      </span>
                      <ConfidenceBadge level={round.confidence} />
                    </div>
                    <ChevronDown
                      className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open/round:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>

                  <div className="animate-slide-up space-y-4 border-t border-border-subtle px-4 pb-4 pt-3">
                    <div>
                      <p className="mb-1 text-caption font-medium text-muted-foreground">
                        {t("cvFeedback.submittedText")}
                      </p>
                      <p className="whitespace-pre-wrap rounded-lg bg-secondary/60 p-3 text-small text-foreground">
                        {round.document_text}
                      </p>
                    </div>

                    {factualItems.length > 0 && <FeedbackItemGroup category="factual_structural" items={factualItems} />}
                    {judgmentItems.length > 0 && <FeedbackItemGroup category="judgment_call" items={judgmentItems} />}

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isDeleting}
                      isLoading={isDeleting}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeleteTarget(round)}
                    >
                      {!isDeleting && <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
                      {isDeleting ? t("cvFeedback.deleting") : t("cvFeedback.delete")}
                    </Button>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deleteTarget && t("cvFeedback.deleteConfirmTitle", { n: deleteTarget.round_number })}
            </DialogTitle>
            <DialogDescription>{t("cvFeedback.deleteConfirmDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeedbackItemGroup({ category, items }: { category: CVFeedbackCategory; items: CVFeedbackItemRead[] }) {
  const { t } = useTranslations();
  const Icon = CATEGORY_ICON[category];

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        <Badge variant={CATEGORY_BADGE_VARIANT[category]}>{t(`cvFeedback.category.${category}`)}</Badge>
        <span className="text-caption text-muted-foreground">({items.length})</span>
      </div>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-border-subtle bg-surface p-3.5">
            <p className="text-small text-foreground" dir="auto">
              {item.note}
            </p>
            {item.relevance_to_goal && (
              <div className="mt-2 rounded-lg border-s-2 border-primary bg-secondary/60 p-2.5">
                <p className="text-caption font-medium text-muted-foreground">{t("cvFeedback.relevance")}</p>
                <p className="mt-0.5 text-small text-foreground" dir="auto">
                  {item.relevance_to_goal}
                </p>
              </div>
            )}
            <ExplainButton endpoint={`/ai-career-center/cv-feedback/items/${item.id}/explain`} />
          </li>
        ))}
      </ul>
    </div>
  );
}
