"use client";

import { useAuth } from "@clerk/nextjs";
import { AlertCircle, ArrowRight, Check, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ConfidenceBadge } from "@/components/confidence-badge";
import { Logo } from "@/components/logo";
import { RemovableSkillChip } from "@/components/removable-skill-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, extractApiErrorMessage } from "@/lib/api";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { GoalRead, ProfileRead, RoadmapRead, SkillGapAnalysisRead } from "@/lib/types";
import { cn } from "@/lib/utils";

type Step = "profile" | "goal" | "skills" | "generate";
const STEPS: Step[] = ["profile", "goal", "skills", "generate"];

/**
 * A standalone, full-page wizard — deliberately *not* inside the `(app)`
 * shell (no Sidebar/Topbar), matching sign-in/sign-up: a focused, hero-like
 * first impression with nothing to navigate away to before there's any
 * real data yet. `page.tsx` handles the auth + already-completed redirect;
 * this component owns the whole four-step flow.
 */
export function OnboardingWizard() {
  const { t } = useTranslations();
  const { getToken } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("profile");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusAnnouncement, setStatusAnnouncement] = useState("");

  // Step 1: profile
  const [background, setBackground] = useState("");
  const [education, setEducation] = useState("");
  const [experience, setExperience] = useState("");

  // Step 2: goal
  const [targetRole, setTargetRole] = useState("");
  const [targetField, setTargetField] = useState("");

  // Step 3: skills
  const [skills, setSkills] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState("");

  // Step 4: generated results
  const [analysis, setAnalysis] = useState<SkillGapAnalysisRead | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapRead | null>(null);

  const stepIndex = STEPS.indexOf(step);

  // Accessibility: move focus to the new step's heading on every
  // transition, and announce it, so keyboard/screen-reader users land on
  // the new content immediately rather than staying on a now-gone button.
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    stepHeadingRef.current?.focus();
    setStatusAnnouncement(t("onboarding.stepLabel", { current: stepIndex + 1, total: STEPS.length }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function withAuth<T>(path: string, init: RequestInit): Promise<T> {
    const token = await getToken();
    return apiFetch<T>(path, { ...init, token });
  }

  async function handleProfileNext() {
    setError(null);
    setSubmitting(true);
    try {
      await withAuth<ProfileRead>("/profile", {
        method: "PATCH",
        body: JSON.stringify({ background, education, experience }),
      });
      setStep("goal");
    } catch (e) {
      setError(e instanceof Error ? extractApiErrorMessage(e.message) : t("onboarding.profile.error"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoalNext() {
    setError(null);
    if (!targetRole.trim()) {
      setError(t("onboarding.goal.roleRequired"));
      return;
    }
    setSubmitting(true);
    try {
      await withAuth<GoalRead>("/profile/goals", {
        method: "POST",
        body: JSON.stringify({ target_role: targetRole, target_field: targetField }),
      });
      setStep("skills");
    } catch (e) {
      setError(e instanceof Error ? extractApiErrorMessage(e.message) : t("onboarding.goal.error"));
    } finally {
      setSubmitting(false);
    }
  }

  function addSkill() {
    const value = skillDraft.trim();
    if (value && !skills.includes(value)) setSkills([...skills, value]);
    setSkillDraft("");
  }

  function removeSkill(skill: string) {
    setSkills(skills.filter((s) => s !== skill));
  }

  async function handleSkillsNext() {
    setError(null);
    setSubmitting(true);
    try {
      await withAuth<ProfileRead>("/profile", { method: "PATCH", body: JSON.stringify({ skills }) });
      setStep("generate");
    } catch (e) {
      setError(e instanceof Error ? extractApiErrorMessage(e.message) : t("onboarding.skills.error"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGenerate() {
    setError(null);
    setSubmitting(true);
    setStatusAnnouncement(t("onboarding.generate.generating"));
    try {
      const analysisResult = await withAuth<SkillGapAnalysisRead>("/ai-career-center/skill-gap-analysis/refresh", {
        method: "POST",
      });
      setAnalysis(analysisResult);
      const roadmapResult = await withAuth<RoadmapRead>("/ai-career-center/roadmap/current", { method: "GET" });
      setRoadmap(roadmapResult);
      setStatusAnnouncement(t("onboarding.generate.analysisTitle"));
    } catch (e) {
      setError(e instanceof Error ? extractApiErrorMessage(e.message) : t("onboarding.generate.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col justify-center px-6 py-12 sm:px-8">
      {/* Screen-reader-only live region — visually hidden, announced on change. */}
      <p role="status" aria-live="polite" className="sr-only">
        {statusAnnouncement}
      </p>

      <div className="mb-8 flex flex-col items-center text-center">
        <Logo size={40} animated />
        <p className="mt-3 text-title text-foreground">{t("onboarding.welcome")}</p>
      </div>

      <Stepper currentIndex={stepIndex} />

      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <p className="text-small text-foreground">{error}</p>
        </div>
      )}

      {step === "profile" && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle ref={stepHeadingRef} tabIndex={-1} className="outline-none">
              {t("onboarding.profile.title")}
            </CardTitle>
            <CardDescription>{t("onboarding.profile.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="onboarding-background">{t("settings.profile.backgroundLabel")}</Label>
              <Textarea
                id="onboarding-background"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder={t("onboarding.profile.backgroundPlaceholder")}
                disabled={submitting}
              />
              <p className="text-caption text-muted-foreground">{t("onboarding.profile.backgroundHint")}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="onboarding-education">{t("settings.profile.educationLabel")}</Label>
              <Textarea
                id="onboarding-education"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="onboarding-experience">{t("settings.profile.experienceLabel")}</Label>
              <Textarea
                id="onboarding-experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                disabled={submitting}
              />
            </div>
            <Button onClick={handleProfileNext} disabled={submitting || !background.trim()} isLoading={submitting}>
              {t("common.next")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "goal" && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle ref={stepHeadingRef} tabIndex={-1} className="outline-none">
              {t("onboarding.goal.title")}
            </CardTitle>
            <CardDescription>{t("onboarding.goal.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="onboarding-target-role">{t("profile.goals.targetRoleLabel")}</Label>
              <Input
                id="onboarding-target-role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder={t("profile.goals.targetRolePlaceholder")}
                disabled={submitting}
                aria-invalid={!!error || undefined}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="onboarding-target-field">{t("profile.goals.targetFieldLabel")}</Label>
              <Input
                id="onboarding-target-field"
                value={targetField}
                onChange={(e) => setTargetField(e.target.value)}
                placeholder={t("profile.goals.targetFieldPlaceholder")}
                disabled={submitting}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setStep("profile")} disabled={submitting}>
                <ArrowRight className="h-4 w-4 rotate-180 rtl:rotate-0" aria-hidden="true" />
                {t("common.back")}
              </Button>
              <Button onClick={handleGoalNext} disabled={submitting} isLoading={submitting}>
                {t("common.next")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "skills" && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle ref={stepHeadingRef} tabIndex={-1} className="outline-none">
              {t("onboarding.skills.title")}
            </CardTitle>
            <CardDescription>{t("onboarding.skills.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={skillDraft}
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder={t("profile.form.skillsPlaceholder")}
                disabled={submitting}
                aria-label={t("settings.profile.skillsLabel")}
              />
              <Button type="button" variant="outline" onClick={addSkill} disabled={submitting}>
                {t("profile.form.addSkill")}
              </Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <RemovableSkillChip
                    key={skill}
                    skill={skill}
                    onRemove={() => removeSkill(skill)}
                    disabled={submitting}
                    removeLabel={t("profile.form.removeSkill", { skill })}
                  />
                ))}
              </div>
            )}
            <p className="text-caption text-muted-foreground">{t("onboarding.skills.hint")}</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setStep("goal")} disabled={submitting}>
                <ArrowRight className="h-4 w-4 rotate-180 rtl:rotate-0" aria-hidden="true" />
                {t("common.back")}
              </Button>
              <Button onClick={handleSkillsNext} disabled={submitting || skills.length === 0} isLoading={submitting}>
                {t("common.next")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "generate" && (
        <div className="animate-fade-in space-y-4">
          {!analysis && (
            <Card>
              <CardHeader>
                <CardTitle ref={stepHeadingRef} tabIndex={-1} className="flex items-center gap-1.5 outline-none">
                  <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                  {t("onboarding.generate.title")}
                </CardTitle>
                <CardDescription>{t("onboarding.generate.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleGenerate} disabled={submitting} isLoading={submitting}>
                  {submitting ? t("onboarding.generate.generating") : t("onboarding.generate.button")}
                </Button>
              </CardContent>
            </Card>
          )}

          {analysis && (
            <Card className="overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-primary to-primary/30" aria-hidden="true" />
              <CardHeader>
                <CardTitle>{t("onboarding.generate.analysisTitle")}</CardTitle>
                <ConfidenceBadge level={analysis.confidence} reason={analysis.confidence_reason} />
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-small text-foreground">{analysis.summary}</p>
                <ul className="space-y-2">
                  {analysis.gaps.map((gap) => (
                    <li key={gap.id} className="rounded-xl border border-border-subtle bg-surface p-3.5">
                      <p className="font-medium text-foreground">{gap.skill}</p>
                      <p className="text-small text-muted-foreground">{gap.description}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {roadmap && (
            <Card>
              <CardHeader>
                <CardTitle>{t("onboarding.generate.roadmapTitle")}</CardTitle>
                <CardDescription>{t("onboarding.generate.roadmapSteps", { count: roadmap.items.length })}</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {roadmap.items.map((item) => (
                    <li key={item.id} className="rounded-xl border border-border-subtle bg-surface p-3.5">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-small text-muted-foreground">{item.description}</p>
                    </li>
                  ))}
                </ol>
                <Button className="mt-4" onClick={() => router.push("/dashboard")}>
                  {t("common.goToDashboard")}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </main>
  );
}

function Stepper({ currentIndex }: { currentIndex: number }) {
  const { t } = useTranslations();
  return (
    <ol className="mb-8 flex items-start">
      {STEPS.map((s, i) => {
        const isComplete = i < currentIndex;
        const isActive = i === currentIndex;
        const isLast = i === STEPS.length - 1;
        return (
          <li key={s} className={cn("flex items-start", !isLast && "flex-1")} aria-current={isActive ? "step" : undefined}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-caption font-semibold transition-colors duration-200",
                  isComplete && "border-success bg-success/15 text-success",
                  isActive && "border-primary bg-primary/10 text-primary",
                  !isComplete && !isActive && "border-border bg-surface text-muted-foreground",
                )}
              >
                {isComplete ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
              </div>
              <span
                className={cn(
                  "hidden text-caption sm:block",
                  isActive ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {t(`onboarding.steps.${s}`)}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "mx-2 mt-4 h-px flex-1 transition-colors duration-300",
                  isComplete ? "bg-success" : "bg-border",
                )}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
