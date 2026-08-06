"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import type { GoalRead, ProfileRead } from "@/lib/types";
import { useRequireAuth } from "@/lib/use-require-auth";

export default function ProfilePage() {
  const { getToken } = useAuth();
  const { isSignedIn } = useRequireAuth();

  // --- Profile ---------------------------------------------------------
  const [profile, setProfile] = useState<ProfileRead | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [background, setBackground] = useState("");
  const [education, setEducation] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [saveProfileError, setSaveProfileError] = useState<string | null>(null);

  // --- Goals -------------------------------------------------------------
  const [goals, setGoals] = useState<GoalRead[] | null>(null);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [goalsError, setGoalsError] = useState<string | null>(null);

  const [newTargetRole, setNewTargetRole] = useState("");
  const [newTargetField, setNewTargetField] = useState("");
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [goalFormError, setGoalFormError] = useState<string | null>(null);

  const [reactivatingGoalId, setReactivatingGoalId] = useState<string | null>(null);
  const [reactivateError, setReactivateError] = useState<string | null>(null);

  const [statusAnnouncement, setStatusAnnouncement] = useState("");
  const goalsHeadingRef = useRef<HTMLHeadingElement>(null);

  async function loadProfile() {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const token = await getToken();
      const data = await apiFetch<ProfileRead>("/profile", { token });
      setProfile(data);
      setBackground(data.background);
      setEducation(data.education);
      setExperience(data.experience);
      setSkills(data.skills);
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : "Failed to load your profile");
    } finally {
      setProfileLoading(false);
    }
  }

  async function loadGoals() {
    setGoalsLoading(true);
    setGoalsError(null);
    try {
      const token = await getToken();
      const data = await apiFetch<GoalRead[]>("/profile/goals", { token });
      setGoals(data);
    } catch (e) {
      setGoalsError(e instanceof Error ? e.message : "Failed to load your goal history");
    } finally {
      setGoalsLoading(false);
    }
  }

  useEffect(() => {
    if (isSignedIn) {
      loadProfile();
      loadGoals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  function addSkill() {
    const value = skillDraft.trim();
    if (value && !skills.includes(value)) {
      setSkills([...skills, value]);
    }
    setSkillDraft("");
  }

  function removeSkill(skill: string) {
    setSkills(skills.filter((s) => s !== skill));
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    setSaveProfileError(null);
    setStatusAnnouncement("Saving profile…");
    try {
      const token = await getToken();
      const updated = await apiFetch<ProfileRead>("/profile", {
        method: "PATCH",
        body: JSON.stringify({ background, education, experience, skills }),
        token,
      });
      setProfile(updated);
      setStatusAnnouncement("Profile saved.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save profile";
      setSaveProfileError(message);
      setStatusAnnouncement(`Failed to save profile: ${message}`);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleCreateGoal() {
    setGoalFormError(null);
    if (!newTargetRole.trim()) {
      setGoalFormError("Target role is required.");
      return;
    }
    setCreatingGoal(true);
    setStatusAnnouncement("Setting new goal…");
    try {
      const token = await getToken();
      await apiFetch<GoalRead>("/profile/goals", {
        method: "POST",
        body: JSON.stringify({ target_role: newTargetRole, target_field: newTargetField }),
        token,
      });
      setNewTargetRole("");
      setNewTargetField("");
      setStatusAnnouncement(`New goal set: ${newTargetRole}.`);
      await loadGoals();
      goalsHeadingRef.current?.focus();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to set new goal";
      setGoalFormError(message);
      setStatusAnnouncement(`Failed to set new goal: ${message}`);
    } finally {
      setCreatingGoal(false);
    }
  }

  async function handleReactivate(goal: GoalRead) {
    setReactivatingGoalId(goal.id);
    setReactivateError(null);
    setStatusAnnouncement(`Reactivating ${goal.target_role}…`);
    try {
      const token = await getToken();
      await apiFetch<GoalRead>(`/profile/goals/${goal.id}/reactivate`, { method: "POST", token });
      setStatusAnnouncement(`${goal.target_role} is now your active goal.`);
      await loadGoals();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to reactivate this goal";
      setReactivateError(message);
      setStatusAnnouncement(`Failed to reactivate goal: ${message}`);
    } finally {
      setReactivatingGoalId(null);
    }
  }

  if (!isSignedIn) {
    return null; // useRequireAuth is redirecting to /sign-in
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Profile &amp; Goal</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {statusAnnouncement}
      </p>

      {/* --- Profile --------------------------------------------------- */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your profile</CardTitle>
          <CardDescription>FR-PROF-1 — edited fields affect your next skill-gap analysis.</CardDescription>
        </CardHeader>
        <CardContent>
          {profileLoading && (
            <div className="animate-pulse space-y-2">
              <div className="h-8 rounded-md border bg-secondary/50" />
              <div className="h-8 rounded-md border bg-secondary/50" />
              <div className="h-8 rounded-md border bg-secondary/50" />
            </div>
          )}

          {!profileLoading && profileError && (
            <div className="space-y-2 text-sm text-destructive">
              <p>{profileError}</p>
              <Button variant="outline" size="sm" onClick={() => loadProfile()}>
                Retry
              </Button>
            </div>
          )}

          {!profileLoading && !profileError && profile && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="profile-background">Background</Label>
                <Textarea
                  id="profile-background"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  disabled={savingProfile}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-education">Education</Label>
                <Textarea
                  id="profile-education"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  disabled={savingProfile}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-experience">Experience</Label>
                <Textarea
                  id="profile-experience"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  disabled={savingProfile}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-skill-draft">Skills</Label>
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
                    placeholder="e.g. Python"
                    disabled={savingProfile}
                  />
                  <Button type="button" variant="outline" onClick={addSkill} disabled={savingProfile}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge
                      key={skill}
                      className="cursor-pointer"
                      onClick={() => removeSkill(skill)}
                      aria-label={`Remove skill ${skill}`}
                    >
                      {skill} &times;
                    </Badge>
                  ))}
                </div>
              </div>

              {saveProfileError && (
                <p role="alert" className="text-sm text-destructive">
                  {saveProfileError}
                </p>
              )}
              <Button onClick={handleSaveProfile} disabled={savingProfile || !background.trim()}>
                {savingProfile ? "Saving…" : "Save profile"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Goals ------------------------------------------------------- */}
      <h2 ref={goalsHeadingRef} tabIndex={-1} className="mb-3 text-lg font-semibold outline-none">
        Goal management
      </h2>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Set a new goal</CardTitle>
          <CardDescription>
            BR-GOAL-2 — setting a new active goal archives your current one; it is retained, not
            deleted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-target-role">Target role</Label>
            <Input
              id="new-target-role"
              value={newTargetRole}
              onChange={(e) => setNewTargetRole(e.target.value)}
              placeholder="e.g. Backend Engineer"
              disabled={creatingGoal}
              aria-describedby={goalFormError ? "goal-form-error" : undefined}
              aria-invalid={goalFormError ? true : undefined}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-target-field">Target field (optional)</Label>
            <Input
              id="new-target-field"
              value={newTargetField}
              onChange={(e) => setNewTargetField(e.target.value)}
              placeholder="e.g. Fintech"
              disabled={creatingGoal}
            />
          </div>
          {goalFormError && (
            <p id="goal-form-error" className="text-sm text-destructive">
              {goalFormError}
            </p>
          )}
          <Button onClick={handleCreateGoal} disabled={creatingGoal}>
            {creatingGoal ? "Setting goal…" : "Set as active goal"}
          </Button>
        </CardContent>
      </Card>

      {goalsLoading && (
        <div className="animate-pulse space-y-2">
          <div className="h-14 rounded-md border bg-secondary/50" />
          <div className="h-14 rounded-md border bg-secondary/50" />
        </div>
      )}

      {!goalsLoading && goalsError && (
        <Card className="border-destructive">
          <CardContent className="space-y-2 pt-6 text-sm text-destructive">
            <p>{goalsError}</p>
            <Button variant="outline" size="sm" onClick={() => loadGoals()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!goalsLoading && !goalsError && goals?.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No goals yet — set one above.
          </CardContent>
        </Card>
      )}

      {reactivateError && (
        <p className="mb-3 text-sm text-destructive" role="alert">
          {reactivateError}
        </p>
      )}

      {!goalsLoading && !goalsError && goals && goals.length > 0 && (
        <ul className="space-y-2">
          {goals.map((goal) => (
            <li key={goal.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">
                  {goal.target_role}
                  {goal.target_field && (
                    <span className="text-sm text-muted-foreground"> — {goal.target_field}</span>
                  )}
                </p>
                {goal.is_active && (
                  <Badge className="mt-1 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                    Active
                  </Badge>
                )}
              </div>
              {!goal.is_active && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={reactivatingGoalId === goal.id}
                  aria-label={`Reactivate goal ${goal.target_role}`}
                  onClick={() => handleReactivate(goal)}
                >
                  {reactivatingGoalId === goal.id ? "Reactivating…" : "Reactivate"}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
