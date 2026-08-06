"use client";

import { useAuth } from "@clerk/nextjs";
import { AlertCircle, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { RemovableSkillChip } from "@/components/removable-skill-chip";
import { SectionError } from "@/components/section-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, extractApiErrorMessage } from "@/lib/api";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { Fetched } from "@/lib/server-fetch";
import type { GoalRead, OnboardingStatusRead, ProfileRead } from "@/lib/types";
import { cn } from "@/lib/utils";

// The four fields onboarding.py::evaluate() (backend/app/services/
// onboarding.py) actually checks for BR-GAP-5's "quality" tier — mirrored
// here only as "which rows to render," never as a re-derivation of
// completeness itself. Whether a field counts as missing/required always
// comes straight from OnboardingStatusRead's own arrays, not a client-side
// guess.
const QUALITY_FIELDS = ["background", "education", "experience", "skills"] as const;

const FIELD_LABEL_KEY: Record<(typeof QUALITY_FIELDS)[number], string> = {
  background: "settings.profile.backgroundLabel",
  education: "settings.profile.educationLabel",
  experience: "settings.profile.experienceLabel",
  skills: "settings.profile.skillsLabel",
};

/**
 * Split from page.tsx for the same reason as every other migrated page.
 * Profile and its Goal history are mirrored into local state so saving and
 * goal changes update instantly; `router.refresh()` reconciles with the
 * server afterward, same shape as every other mutation in this redesign —
 * including refreshing `onboardingStatus`, since a profile save can change
 * what it reports.
 */
export function ProfileView({
  profile,
  goals,
  onboardingStatus,
}: {
  profile: Fetched<ProfileRead>;
  goals: Fetched<GoalRead[]>;
  onboardingStatus: Fetched<OnboardingStatusRead>;
}) {
  const { t } = useTranslations();
  const { getToken } = useAuth();
  const router = useRouter();

  const [statusAnnouncement, setStatusAnnouncement] = useState("");

  // --- Profile form --------------------------------------------------
  const p = profile.data;
  const [background, setBackground] = useState(p?.background ?? "");
  const [education, setEducation] = useState(p?.education ?? "");
  const [experience, setExperience] = useState(p?.experience ?? "");
  const [skills, setSkills] = useState<string[]>(p?.skills ?? []);
  const [skillDraft, setSkillDraft] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveProfileError, setSaveProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (profile.data) {
      setBackground(profile.data.background);
      setEducation(profile.data.education);
      setExperience(profile.data.experience);
      setSkills(profile.data.skills);
    }
  }, [profile.data]);

  const isDirty =
    !!p &&
    (background !== p.background ||
      education !== p.education ||
      experience !== p.experience ||
      skills.length !== p.skills.length ||
      skills.some((s, i) => s !== p.skills[i]));

  function addSkill() {
    const value = skillDraft.trim();
    if (value && !skills.includes(value)) setSkills([...skills, value]);
    setSkillDraft("");
  }

  function removeSkill(skill: string) {
    setSkills(skills.filter((s) => s !== skill));
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    setSaveProfileError(null);
    setStatusAnnouncement(t("profile.form.saving"));
    try {
      const token = await getToken();
      await apiFetch<ProfileRead>("/profile", {
        method: "PATCH",
        body: JSON.stringify({ background, education, experience, skills }),
        token,
      });
      toast.success(t("profile.form.saveSuccess"));
      setStatusAnnouncement(t("profile.form.saveSuccess"));
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? extractApiErrorMessage(e.message) : t("profile.form.saveError");
      setSaveProfileError(message);
      setStatusAnnouncement(message);
    } finally {
      setSavingProfile(false);
    }
  }

  // --- Goals -----------------------------------------------------------
  const [goalList, setGoalList] = useState<GoalRead[]>(goals.data ?? []);
  useEffect(() => setGoalList(goals.data ?? []), [goals.data]);

  const [newTargetRole, setNewTargetRole] = useState("");
  const [newTargetField, setNewTargetField] = useState("");
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [goalFormError, setGoalFormError] = useState<string | null>(null);
  const [reactivatingGoalId, setReactivatingGoalId] = useState<string | null>(null);

  const goalsHeadingRef = useRef<HTMLHeadingElement>(null);

  async function handleCreateGoal() {
    setGoalFormError(null);
    if (!newTargetRole.trim()) {
      setGoalFormError(t("profile.goals.targetRoleRequired"));
      return;
    }
    setCreatingGoal(true);
    setStatusAnnouncement(t("profile.goals.settingGoal"));
    try {
      const token = await getToken();
      const created = await apiFetch<GoalRead>("/profile/goals", {
        method: "POST",
        body: JSON.stringify({ target_role: newTargetRole, target_field: newTargetField }),
        token,
      });
      setGoalList((current) => [created, ...current.map((g) => ({ ...g, is_active: false }))]);
      setNewTargetRole("");
      setNewTargetField("");
      const successMessage = t("profile.goals.activeNow", { role: created.target_role });
      toast.success(successMessage);
      setStatusAnnouncement(successMessage);
      router.refresh();
      goalsHeadingRef.current?.focus();
    } catch (e) {
      const message = e instanceof Error ? extractApiErrorMessage(e.message) : t("profile.goals.setError");
      setGoalFormError(message);
      setStatusAnnouncement(message);
    } finally {
      setCreatingGoal(false);
    }
  }

  async function handleReactivate(goal: GoalRead) {
    setReactivatingGoalId(goal.id);
    try {
      const token = await getToken();
      await apiFetch<GoalRead>(`/profile/goals/${goal.id}/reactivate`, { method: "POST", token });
      setGoalList((current) => current.map((g) => ({ ...g, is_active: g.id === goal.id })));
      const successMessage = t("profile.goals.activeNow", { role: goal.target_role });
      toast.success(successMessage);
      setStatusAnnouncement(successMessage);
      router.refresh();
    } catch (e) {
      toast.error(t("profile.goals.reactivateError"), {
        description: e instanceof Error ? extractApiErrorMessage(e.message) : undefined,
      });
    } finally {
      setReactivatingGoalId(null);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Screen-reader-only live region — visually hidden, announced on change. */}
      <p role="status" aria-live="polite" className="sr-only">
        {statusAnnouncement}
      </p>

      {profile.error && <SectionError message={t("profile.loadError")} error={profile.error} retryHref="/profile" />}

      {p && (
        <>
          <CareerSummaryCard profile={p} goals={goalList} />

          {onboardingStatus.data && <CompletenessCard status={onboardingStatus.data} />}
          {onboardingStatus.error && (
            <SectionError message={t("profile.loadError")} error={onboardingStatus.error} retryHref="/profile" />
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t("profile.form.title")}</CardTitle>
              <CardDescription>{t("profile.form.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="profile-background">{t("settings.profile.backgroundLabel")}</Label>
                <Textarea
                  id="profile-background"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  placeholder={t("profile.form.backgroundPlaceholder")}
                  disabled={savingProfile}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-education">{t("settings.profile.educationLabel")}</Label>
                <Textarea
                  id="profile-education"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder={t("profile.form.educationPlaceholder")}
                  disabled={savingProfile}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-experience">{t("settings.profile.experienceLabel")}</Label>
                <Textarea
                  id="profile-experience"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder={t("profile.form.experiencePlaceholder")}
                  disabled={savingProfile}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-skill-draft">{t("settings.profile.skillsLabel")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="profile-skill-draft"
                    value={skillDraft}
                    onChange={(e) => setSkillDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    placeholder={t("profile.form.skillsPlaceholder")}
                    disabled={savingProfile}
                  />
                  <Button type="button" variant="outline" onClick={addSkill} disabled={savingProfile}>
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
                        disabled={savingProfile}
                        removeLabel={t("profile.form.removeSkill", { skill })}
                      />
                    ))}
                  </div>
                )}
              </div>

              {saveProfileError && (
                <p role="alert" className="text-small text-destructive">
                  {saveProfileError}
                </p>
              )}
              <Button onClick={handleSaveProfile} disabled={savingProfile || !isDirty} isLoading={savingProfile}>
                {savingProfile ? t("profile.form.saving") : t("profile.form.save")}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* --- Goals ------------------------------------------------------- */}
      <div>
        <h2
          ref={goalsHeadingRef}
          tabIndex={-1}
          className="mb-3 text-small font-medium text-muted-foreground outline-none"
        >
          {t("profile.goals.title")}
        </h2>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{t("profile.goals.newTitle")}</CardTitle>
            <CardDescription>{t("profile.goals.newDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-target-role">{t("profile.goals.targetRoleLabel")}</Label>
              <Input
                id="new-target-role"
                value={newTargetRole}
                onChange={(e) => setNewTargetRole(e.target.value)}
                placeholder={t("profile.goals.targetRolePlaceholder")}
                disabled={creatingGoal}
                aria-describedby={goalFormError ? "goal-form-error" : undefined}
                aria-invalid={goalFormError ? true : undefined}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-target-field">{t("profile.goals.targetFieldLabel")}</Label>
              <Input
                id="new-target-field"
                value={newTargetField}
                onChange={(e) => setNewTargetField(e.target.value)}
                placeholder={t("profile.goals.targetFieldPlaceholder")}
                disabled={creatingGoal}
              />
            </div>
            {goalFormError && (
              <p id="goal-form-error" className="text-small text-destructive">
                {goalFormError}
              </p>
            )}
            <Button onClick={handleCreateGoal} disabled={creatingGoal} isLoading={creatingGoal}>
              {creatingGoal ? t("profile.goals.settingGoal") : t("profile.goals.setActive")}
            </Button>
          </CardContent>
        </Card>

        {goals.error && <SectionError message={t("profile.goals.loadError")} error={goals.error} retryHref="/profile" />}

        {!goals.error && goalList.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-small font-medium text-foreground">{t("profile.goals.emptyTitle")}</p>
              <p className="mt-1 text-caption text-muted-foreground">{t("profile.goals.emptyDescription")}</p>
            </CardContent>
          </Card>
        )}

        {!goals.error && goalList.length > 0 && (
          <ul className="space-y-2">
            {goalList.map((goal) => (
              <li
                key={goal.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface p-4 shadow-xs"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {goal.target_role}
                    {goal.target_field && <span className="text-small text-muted-foreground"> — {goal.target_field}</span>}
                  </p>
                  {goal.is_active && (
                    <Badge variant="success" className="mt-1">
                      {t("profile.goals.active")}
                    </Badge>
                  )}
                </div>
                {!goal.is_active && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={reactivatingGoalId === goal.id}
                    isLoading={reactivatingGoalId === goal.id}
                    aria-label={`${t("profile.goals.reactivate")}: ${goal.target_role}`}
                    onClick={() => handleReactivate(goal)}
                  >
                    {reactivatingGoalId === goal.id ? t("profile.goals.reactivating") : t("profile.goals.reactivate")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CareerSummaryCard({ profile, goals }: { profile: ProfileRead; goals: GoalRead[] }) {
  const { t } = useTranslations();
  const activeGoal = goals.find((g) => g.is_active);

  return (
    <Card className="overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-primary to-primary/30" aria-hidden="true" />
      <CardHeader className="pb-3">
        <div className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-primary">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          {t("profile.summary.title")}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-caption font-medium text-muted-foreground">{t("profile.summary.goalLabel")}</p>
            {activeGoal ? (
              <p className="text-title text-foreground">
                {activeGoal.target_role}
                {activeGoal.target_field && <span className="text-muted-foreground"> — {activeGoal.target_field}</span>}
              </p>
            ) : (
              <p className="text-small text-muted-foreground">{t("settings.profile.noGoal")}</p>
            )}
          </div>
          <Badge variant="outline">{t("settings.profile.skillCount", { count: profile.skills.length })}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function CompletenessCard({ status }: { status: OnboardingStatusRead }) {
  const { t } = useTranslations();
  const doneCount = QUALITY_FIELDS.filter((f) => !status.missing_quality_fields.includes(f)).length;
  const percent = Math.round((doneCount / QUALITY_FIELDS.length) * 100);

  const headline = !status.meets_hard_bar
    ? t("profile.completeness.blockedTitle")
    : !status.is_complete
      ? t("profile.completeness.improvableTitle")
      : t("profile.completeness.readyTitle");
  const headlineTone = !status.meets_hard_bar ? "text-destructive" : !status.is_complete ? "text-warning" : "text-success";
  const HeadlineIcon = !status.meets_hard_bar ? AlertCircle : !status.is_complete ? Circle : CheckCircle2;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>{t("profile.completeness.title")}</CardTitle>
        <p className={cn("flex items-center gap-1.5 text-small font-medium", headlineTone)}>
          <HeadlineIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
          {headline}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <span className="text-caption text-muted-foreground">
            {t("profile.completeness.fieldsComplete", { done: doneCount, total: QUALITY_FIELDS.length })}
          </span>
          <Progress value={percent} className="mt-1.5" />
        </div>

        <ul className="space-y-2.5">
          {QUALITY_FIELDS.map((field) => {
            const missing = status.missing_quality_fields.includes(field);
            const required = status.missing_hard_bar_fields.includes(field);
            return (
              <li key={field} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {missing ? (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                  )}
                  <span className="text-small text-foreground">{t(FIELD_LABEL_KEY[field])}</span>
                </div>
                {missing && (
                  <Badge variant={required ? "warning" : "outline"}>
                    {required ? t("profile.completeness.required") : t("profile.completeness.improves")}
                  </Badge>
                )}
              </li>
            );
          })}
          <li className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {status.goal_set ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
              <span className="text-small text-foreground">{t("profile.summary.goalLabel")}</span>
            </div>
            {!status.goal_set && <Badge variant="warning">{t("profile.completeness.goalRequired")}</Badge>}
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
