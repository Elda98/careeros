"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import type { ProfileRead, GoalRead, RoadmapRead, SkillGapAnalysisRead } from "@/lib/types";
import { useRequireAuth } from "@/lib/use-require-auth";

type Step = "profile" | "goal" | "skills" | "generate";

const STEPS: Step[] = ["profile", "goal", "skills", "generate"];

export default function OnboardingPage() {
  const { getToken } = useAuth();
  const { isSignedIn } = useRequireAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("profile");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: User profile (FR-PROF-1)
  const [background, setBackground] = useState("");
  const [education, setEducation] = useState("");
  const [experience, setExperience] = useState("");

  // Step 2: Goal selection (FR-PROF-2)
  const [targetRole, setTargetRole] = useState("");
  const [targetField, setTargetField] = useState("");

  // Step 3: Skill input (part of Profile, PRD FR-PROF-1's "background")
  const [skills, setSkills] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState("");

  // Step 4: generated results
  const [analysis, setAnalysis] = useState<SkillGapAnalysisRead | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapRead | null>(null);

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
      setError(e instanceof Error ? e.message : "Failed to save profile");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoalNext() {
    setError(null);
    if (!targetRole.trim()) {
      setError("Target role is required");
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
      setError(e instanceof Error ? e.message : "Failed to save goal");
    } finally {
      setSubmitting(false);
    }
  }

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

  async function handleSkillsNext() {
    setError(null);
    setSubmitting(true);
    try {
      await withAuth<ProfileRead>("/profile", {
        method: "PATCH",
        body: JSON.stringify({ skills }),
      });
      setStep("generate");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save skills");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGenerate() {
    setError(null);
    setSubmitting(true);
    try {
      const analysisResult = await withAuth<SkillGapAnalysisRead>(
        "/ai-career-center/skill-gap-analysis/refresh",
        { method: "POST" },
      );
      setAnalysis(analysisResult);
      const roadmapResult = await withAuth<RoadmapRead>("/ai-career-center/roadmap/current", {
        method: "GET",
      });
      setRoadmap(roadmapResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate your skill-gap analysis");
    } finally {
      setSubmitting(false);
    }
  }

  const stepIndex = STEPS.indexOf(step);

  if (!isSignedIn) {
    return null; // useRequireAuth is redirecting to /sign-in
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="mb-6 flex gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? "bg-primary" : "bg-secondary"}`}
          />
        ))}
      </div>

      {error && (
        <Card className="mb-4 border-destructive">
          <CardContent className="pt-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {step === "profile" && (
        <Card>
          <CardHeader>
            <CardTitle>Tell us about yourself</CardTitle>
            <CardDescription>
              This is the minimum profile CareerOS needs before running your first skill-gap
              analysis (FR-ONBOARD-1).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="background">Background</Label>
              <Textarea
                id="background"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="e.g. Final-year Computer Science student"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="education">Education</Label>
              <Textarea id="education" value={education} onChange={(e) => setEducation(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="experience">Experience</Label>
              <Textarea id="experience" value={experience} onChange={(e) => setExperience(e.target.value)} />
            </div>
            <Button onClick={handleProfileNext} disabled={submitting || !background.trim()}>
              Next
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "goal" && (
        <Card>
          <CardHeader>
            <CardTitle>What&apos;s your target role?</CardTitle>
            <CardDescription>FR-PROF-2 — you can update this at any time later.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="target_role">Target role</Label>
              <Input
                id="target_role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Backend Engineer"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="target_field">Target field (optional)</Label>
              <Input
                id="target_field"
                value={targetField}
                onChange={(e) => setTargetField(e.target.value)}
                placeholder="e.g. Fintech"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("profile")}>
                Back
              </Button>
              <Button onClick={handleGoalNext} disabled={submitting}>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "skills" && (
        <Card>
          <CardHeader>
            <CardTitle>What skills do you already have?</CardTitle>
            <CardDescription>
              Add a few — the more complete this is, the more confident your first analysis will
              be (BR-GAP-5).
            </CardDescription>
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
                placeholder="e.g. Python"
              />
              <Button type="button" variant="outline" onClick={addSkill}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill} className="cursor-pointer" onClick={() => removeSkill(skill)}>
                  {skill} &times;
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("goal")}>
                Back
              </Button>
              <Button onClick={handleSkillsNext} disabled={submitting || skills.length === 0}>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "generate" && (
        <div className="space-y-4">
          {!analysis && (
            <Card>
              <CardHeader>
                <CardTitle>Ready to generate your first skill-gap analysis</CardTitle>
                <CardDescription>
                  This runs the Skill-Gap Analysis Agent, then automatically generates your first
                  roadmap.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleGenerate} disabled={submitting}>
                  {submitting ? "Generating..." : "Generate my analysis"}
                </Button>
              </CardContent>
            </Card>
          )}

          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle>Your skill-gap analysis</CardTitle>
                <CardDescription>
                  Confidence: {analysis.confidence}
                  {analysis.confidence !== "high" ? ` — ${analysis.confidence_reason}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm">{analysis.summary}</p>
                <ul className="space-y-2">
                  {analysis.gaps.map((gap, i) => (
                    <li key={i} className="rounded-md border p-3">
                      <p className="font-medium">{gap.skill}</p>
                      <p className="text-sm text-muted-foreground">{gap.description}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {roadmap && (
            <Card>
              <CardHeader>
                <CardTitle>Your roadmap</CardTitle>
                <CardDescription>{roadmap.items.length} steps generated</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {roadmap.items.map((item) => (
                    <li key={item.id} className="rounded-md border p-3">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </li>
                  ))}
                </ol>
                <Button className="mt-4" onClick={() => router.push("/dashboard")}>
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </main>
  );
}
