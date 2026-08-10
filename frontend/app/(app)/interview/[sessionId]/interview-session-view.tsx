"use client";

import { useAuth } from "@clerk/nextjs";
import { AlertCircle, CheckCircle2, Info, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ConfidenceBadge } from "@/components/confidence-badge";
import { ExplainButton } from "@/components/explain-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, extractApiErrorMessage } from "@/lib/api";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type {
  InterviewQuestionCategory,
  InterviewSessionDetailRead,
  InterviewSessionReportRead,
  InterviewTurnRead,
} from "@/lib/types";

import { VideoAnswerRecorder } from "./video-answer-recorder";

const CATEGORY_KEY: Record<InterviewQuestionCategory, string> = {
  intro: "interview.category.intro",
  behavioral: "interview.category.behavioral",
  technical: "interview.category.technical",
  role_specific: "interview.category.roleSpecific",
  resume_based: "interview.category.resumeBased",
  follow_up: "interview.category.followUp",
};

export function InterviewSessionView({
  initialSession,
  initialReport,
  error,
}: {
  initialSession: InterviewSessionDetailRead | null;
  initialReport: InterviewSessionReportRead | null;
  error: string | null;
}) {
  const { t } = useTranslations();
  const { getToken } = useAuth();

  const [session, setSession] = useState(initialSession);
  const [report, setReport] = useState(initialReport);
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (error || !session) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <p className="text-small text-foreground">{error ?? t("interview.loadError")}</p>
        </CardContent>
      </Card>
    );
  }

  const questions = session.questions;
  const lastQuestion = questions[questions.length - 1] ?? null;
  const awaitingAnswer = session.status === "in_progress" && lastQuestion !== null && lastQuestion.answer === null;
  const readyToFinish = session.status === "in_progress" && lastQuestion !== null && lastQuestion.answer !== null;

  async function handleSubmitAnswer() {
    if (!session || !lastQuestion) return;
    setActionError(null);
    setSubmitting(true);
    try {
      const token = await getToken();
      const turn = await apiFetch<InterviewTurnRead>(`/interview/sessions/${session.id}/answers`, {
        method: "POST",
        token,
        body: JSON.stringify({ question_id: lastQuestion.id, answer_text: answerText }),
      });
      setSession((prev) => {
        if (!prev) return prev;
        const updated = prev.questions.map((q) => (q.id === lastQuestion.id ? { ...q, answer: turn.answer_feedback } : q));
        const withNext = turn.next_question ? [...updated, turn.next_question] : updated;
        return { ...prev, questions: withNext };
      });
      setAnswerText("");
    } catch (e) {
      setActionError(e instanceof Error ? extractApiErrorMessage(e.message) : t("interview.answerError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitVideoAnswer(audio: Blob, avgVolumeLevel: number, movementLevel: number) {
    if (!session || !lastQuestion) return;
    setActionError(null);
    setSubmitting(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("question_id", lastQuestion.id);
      formData.append("avg_volume_level", String(avgVolumeLevel));
      formData.append("movement_level", String(movementLevel));
      formData.append("audio", audio, "answer.webm");
      const turn = await apiFetch<InterviewTurnRead>(`/interview/sessions/${session.id}/answers/media`, {
        method: "POST",
        token,
        body: formData,
      });
      setSession((prev) => {
        if (!prev) return prev;
        const updated = prev.questions.map((q) => (q.id === lastQuestion.id ? { ...q, answer: turn.answer_feedback } : q));
        const withNext = turn.next_question ? [...updated, turn.next_question] : updated;
        return { ...prev, questions: withNext };
      });
    } catch (e) {
      setActionError(e instanceof Error ? extractApiErrorMessage(e.message) : t("interview.answerError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFinish() {
    if (!session) return;
    setActionError(null);
    setFinishing(true);
    try {
      const token = await getToken();
      const rep = await apiFetch<InterviewSessionReportRead>(`/interview/sessions/${session.id}/finish`, {
        method: "POST",
        token,
      });
      setReport(rep);
      setSession((prev) => (prev ? { ...prev, status: "completed" } : prev));
    } catch (e) {
      setActionError(e instanceof Error ? extractApiErrorMessage(e.message) : t("interview.finishError"));
    } finally {
      setFinishing(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <Link href="/interview" className="text-small font-medium text-primary hover:underline">
        {t("interview.backToList")}
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-title text-foreground">{session.target_role}</h1>
          <p className="mt-1 flex flex-wrap gap-1.5 text-caption text-muted-foreground">
            <Badge variant="outline">{t(`interview.form.level${capitalize(session.experience_level)}`)}</Badge>
            <Badge variant="outline">{t(`interview.form.type${capitalize(session.interview_type)}`)}</Badge>
            {session.target_company && <Badge variant="outline">{session.target_company}</Badge>}
          </p>
        </div>
        <Badge variant={session.status === "completed" ? "success" : "outline"}>
          {session.status === "completed" ? t("interview.statusCompleted") : t("interview.statusInProgress")}
        </Badge>
      </div>

      {actionError && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <p className="text-small text-foreground">{actionError}</p>
        </div>
      )}

      {report && (
        <Card className="mt-6 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-primary to-primary/30" aria-hidden="true" />
          <CardHeader className="pb-3">
            <div className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {t("interview.report.eyebrow")}
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="text-display text-foreground">{report.overall_score}</span>
              <span className="text-small text-muted-foreground">{t("interview.report.overallScore")}</span>
              <ConfidenceBadge level={report.confidence} reason={report.confidence_reason} />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-body text-foreground">{report.summary}</p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ReportStat label={t("interview.report.answerQuality")} value={report.answer_quality} />
              <ReportStat label={t("interview.report.communication")} value={report.communication} />
              <ReportStat label={t("interview.report.structure")} value={report.structure_score} />
              <ReportStat label={t("interview.report.technicalReadiness")} value={report.technical_readiness} />
            </div>

            <ReportList title={t("interview.report.strengths")} items={report.strengths} icon="strength" />
            <ReportList title={t("interview.report.areasToImprove")} items={report.areas_to_improve} icon="improve" />
            <ReportList title={t("interview.report.recommendedPractice")} items={report.recommended_practice} icon="practice" />

            <div className="rounded-lg border-s-2 border-primary bg-secondary/60 p-3">
              <p className="text-caption font-medium text-foreground">{t("interview.report.nextInterview")}</p>
              <p className="mt-1 text-small text-foreground">{report.next_interview_recommendation}</p>
            </div>

            {report.voice_summary && (
              <div className="rounded-xl border border-border-subtle bg-surface p-4">
                <p className="text-small font-medium text-foreground">{t("interview.video.summaryTitle")}</p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <ReportStat
                    label={`${t("interview.video.pace")} (${t("interview.video.wpm")})`}
                    value={report.voice_summary.avg_speech_rate_wpm}
                  />
                  <ReportStat label={t("interview.video.pauses")} value={report.voice_summary.total_pause_count} />
                  <ReportStat label={t("interview.video.fillerWords")} value={report.voice_summary.total_filler_word_count} />
                  <ReportStat
                    label={t("interview.video.volume")}
                    value={Math.round(report.voice_summary.avg_volume_level * 100)}
                  />
                  <ReportStat
                    label={t("interview.video.movement")}
                    value={Math.round(report.voice_summary.avg_movement_level * 100)}
                  />
                </div>
                <div className="mt-3 flex items-start gap-2 text-caption text-muted-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <p>{report.voice_summary.disclaimer}</p>
                </div>
              </div>
            )}

            {report.grounded_on.length > 0 && (
              <p className="text-caption text-muted-foreground">
                {t("common.groundedIn")}: {report.grounded_on.join(", ")}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="mt-6 space-y-3">
        {questions.map((question) => (
          <Card key={question.id}>
            <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-body">{question.question_text}</CardTitle>
              <Badge variant="outline">{t(CATEGORY_KEY[question.category])}</Badge>
            </CardHeader>
            {question.answer && (
              <CardContent className="space-y-3">
                <p className="text-small text-foreground">{question.answer.answer_text}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline">{t("interview.scores.quality")}: {question.answer.quality_score}</Badge>
                  <Badge variant="outline">{t("interview.scores.clarity")}: {question.answer.clarity_score}</Badge>
                  <Badge variant="outline">{t("interview.scores.relevance")}: {question.answer.relevance_score}</Badge>
                  <Badge variant="outline">{t("interview.scores.structure")}: {question.answer.structure_score}</Badge>
                </div>
                <p className="text-small text-muted-foreground">{question.answer.feedback_note}</p>
                {question.answer.speech_rate_wpm !== null && (
                  <div className="flex flex-wrap items-center gap-1.5 border-t border-border-subtle pt-2.5">
                    <Badge variant="outline">{t("interview.video.pace")}: {question.answer.speech_rate_wpm} {t("interview.video.wpm")}</Badge>
                    <Badge variant="outline">{t("interview.video.pauses")}: {question.answer.pause_count}</Badge>
                    <Badge variant="outline">{t("interview.video.fillerWords")}: {question.answer.filler_word_count}</Badge>
                  </div>
                )}
                {question.answer.example_improved_answer && (
                  <div className="rounded-lg border-s-2 border-primary bg-secondary/60 p-3">
                    <p className="text-caption font-medium text-foreground">{t("interview.exampleAnswer")}</p>
                    <p className="mt-1 text-small text-foreground">{question.answer.example_improved_answer}</p>
                  </div>
                )}
                <ExplainButton endpoint={`/interview/sessions/${session.id}/answers/${question.answer.id}/explain`} />
              </CardContent>
            )}
          </Card>
        ))}

        {awaitingAnswer && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-body">{t("interview.yourAnswer")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {session.mode === "video" ? (
                <VideoAnswerRecorder onSubmit={handleSubmitVideoAnswer} submitting={submitting} />
              ) : (
                <>
                  <Textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder={t("interview.answerPlaceholder")}
                    disabled={submitting}
                    rows={5}
                  />
                  <Button onClick={handleSubmitAnswer} disabled={submitting || !answerText.trim()} isLoading={submitting}>
                    {t("interview.submitAnswer")}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {readyToFinish && (
          <Card className="animate-fade-in border-primary/40 bg-primary/5">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
                <p className="text-small text-foreground">{t("interview.readyToFinish")}</p>
              </div>
              <Button onClick={handleFinish} isLoading={finishing}>
                {t("interview.getReport")}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ReportStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-3 text-center">
      <p className="text-heading text-foreground">{value}</p>
      <p className="mt-0.5 text-caption text-muted-foreground">{label}</p>
    </div>
  );
}

function ReportList({ title, items, icon }: { title: string; items: string[]; icon: string }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-small font-medium text-foreground">{title}</p>
      <ul className="mt-1.5 space-y-1">
        {items.map((item) => (
          <li key={`${icon}-${item}`} className="flex items-start gap-2 text-small text-muted-foreground">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
