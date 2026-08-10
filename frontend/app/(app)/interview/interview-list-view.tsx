"use client";

import { useAuth } from "@clerk/nextjs";
import { AlertCircle, ChevronRight, FileText, Sparkles, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, extractApiErrorMessage } from "@/lib/api";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type {
  InterviewExperienceLevel,
  InterviewSessionDetailRead,
  InterviewSessionMode,
  InterviewSessionRead,
  InterviewType,
} from "@/lib/types";

export function InterviewListView({
  initialSessions,
  error,
}: {
  initialSessions: InterviewSessionRead[];
  error: string | null;
}) {
  const { t } = useTranslations();
  const { getToken } = useAuth();
  const router = useRouter();

  const sessions = initialSessions;
  const [targetRole, setTargetRole] = useState("");
  const [targetField, setTargetField] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<InterviewExperienceLevel>("entry");
  const [interviewType, setInterviewType] = useState<InterviewType>("mixed");
  const [mode, setMode] = useState<InterviewSessionMode>("text");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleStart() {
    setFormError(null);
    setSubmitting(true);
    try {
      const token = await getToken();
      const session = await apiFetch<InterviewSessionDetailRead>("/interview/sessions", {
        method: "POST",
        token,
        body: JSON.stringify({
          target_role: targetRole,
          target_field: targetField,
          experience_level: experienceLevel,
          interview_type: interviewType,
          target_company: targetCompany,
          mode,
        }),
      });
      router.push(`/interview/${session.id}`);
    } catch (e) {
      setFormError(e instanceof Error ? extractApiErrorMessage(e.message) : t("interview.startError"));
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-primary">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        {t("interview.eyebrow")}
      </div>
      <h1 className="mt-1 text-title text-foreground">{t("interview.title")}</h1>
      <p className="mt-1 text-small text-muted-foreground">{t("interview.subtitle")}</p>

      <Card className="mt-6 animate-fade-in">
        <CardHeader>
          <CardTitle className="text-body">{t("interview.form.heading")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(error || formError) && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
              <p className="text-small text-foreground">{error ?? formError}</p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>{t("interview.form.modeLabel")}</Label>
            <div className="flex gap-2" role="radiogroup" aria-label={t("interview.form.modeLabel")}>
              <button
                type="button"
                role="radio"
                aria-checked={mode === "text"}
                onClick={() => setMode("text")}
                disabled={submitting}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-small transition-colors ${
                  mode === "text"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                {t("interview.form.modeText")}
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={mode === "video"}
                onClick={() => setMode("video")}
                disabled={submitting}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-small transition-colors ${
                  mode === "video"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input text-muted-foreground hover:text-foreground"
                }`}
              >
                <Video className="h-4 w-4" aria-hidden="true" />
                {t("interview.form.modeVideo")}
              </button>
            </div>
            {mode === "video" && <p className="text-caption text-muted-foreground">{t("interview.form.modeVideoHint")}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="iv-target-role">{t("interview.form.targetRoleLabel")}</Label>
            <Input
              id="iv-target-role"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder={t("interview.form.targetRolePlaceholder")}
              disabled={submitting}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="iv-level">{t("interview.form.experienceLevelLabel")}</Label>
              <select
                id="iv-level"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as InterviewExperienceLevel)}
                disabled={submitting}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-small text-foreground"
              >
                <option value="entry">{t("interview.form.levelEntry")}</option>
                <option value="mid">{t("interview.form.levelMid")}</option>
                <option value="senior">{t("interview.form.levelSenior")}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="iv-type">{t("interview.form.interviewTypeLabel")}</Label>
              <select
                id="iv-type"
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value as InterviewType)}
                disabled={submitting}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-small text-foreground"
              >
                <option value="mixed">{t("interview.form.typeMixed")}</option>
                <option value="behavioral">{t("interview.form.typeBehavioral")}</option>
                <option value="technical">{t("interview.form.typeTechnical")}</option>
                <option value="screening">{t("interview.form.typeScreening")}</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="iv-field">{t("interview.form.targetFieldLabel")}</Label>
              <Input
                id="iv-field"
                value={targetField}
                onChange={(e) => setTargetField(e.target.value)}
                placeholder={t("interview.form.targetFieldPlaceholder")}
                disabled={submitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="iv-company">{t("interview.form.targetCompanyLabel")}</Label>
              <Input
                id="iv-company"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder={t("interview.form.targetCompanyPlaceholder")}
                disabled={submitting}
              />
            </div>
          </div>
          <Button onClick={handleStart} disabled={submitting || !targetRole.trim()} isLoading={submitting}>
            {t("interview.form.submit")}
          </Button>
        </CardContent>
      </Card>

      {sessions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-heading text-foreground">{t("interview.pastSessions")}</h2>
          <div className="mt-3 space-y-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => router.push(`/interview/${session.id}`)}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-border-subtle bg-surface p-4 text-start shadow-xs transition-shadow hover:shadow-md"
              >
                <div>
                  <p className="flex items-center gap-1.5 font-medium text-foreground">
                    {session.mode === "video" ? (
                      <Video className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    )}
                    <span dir="auto">{session.target_role}</span>
                  </p>
                  <p className="mt-0.5 text-caption text-muted-foreground">
                    {new Date(session.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={session.status === "completed" ? "success" : "outline"}>
                    {session.status === "completed" ? t("interview.statusCompleted") : t("interview.statusInProgress")}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" aria-hidden="true" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
