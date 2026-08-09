"use client";

import { useAuth } from "@clerk/nextjs";
import { AlertCircle, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useState } from "react";

import { RemovableSkillChip } from "@/components/removable-skill-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, extractApiErrorMessage } from "@/lib/api";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type {
  ApplicationRead,
  ApplicationStatus,
  JobOpportunityRead,
  OpportunityType,
} from "@/lib/types";

export function CompanyOpportunitiesPanel({ initialOpportunities }: { initialOpportunities: JobOpportunityRead[] }) {
  const { t } = useTranslations();
  const { getToken } = useAuth();

  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [showForm, setShowForm] = useState(false);

  async function withAuth<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await getToken();
    return apiFetch<T>(path, { ...init, token });
  }

  async function toggleStatus(opportunity: JobOpportunityRead) {
    const nextStatus = opportunity.status === "open" ? "closed" : "open";
    const updated = await withAuth<JobOpportunityRead>(`/company/opportunities/${opportunity.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus }),
    });
    setOpportunities((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-heading text-foreground">{t("opportunities.yourPostings")}</h2>
        <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("opportunities.postNew")}
        </Button>
      </div>

      {showForm && (
        <PostOpportunityForm
          withAuth={withAuth}
          onCreated={(created) => {
            setOpportunities((prev) => [created, ...prev]);
            setShowForm(false);
          }}
        />
      )}

      {opportunities.length === 0 && !showForm ? (
        <p className="text-small text-muted-foreground">{t("opportunities.noPostings")}</p>
      ) : (
        <div className="space-y-3">
          {opportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} onToggleStatus={toggleStatus} withAuth={withAuth} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostOpportunityForm({
  withAuth,
  onCreated,
}: {
  withAuth: <T>(path: string, init?: RequestInit) => Promise<T>;
  onCreated: (opportunity: JobOpportunityRead) => void;
}) {
  const { t } = useTranslations();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<OpportunityType>("job");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addSkill() {
    const value = skillDraft.trim();
    if (value && !skills.includes(value)) setSkills([...skills, value]);
    setSkillDraft("");
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const created = await withAuth<JobOpportunityRead>("/company/opportunities", {
        method: "POST",
        body: JSON.stringify({
          title,
          opportunity_type: type,
          location,
          description,
          required_skills: skills,
        }),
      });
      onCreated(created);
    } catch (e) {
      setError(e instanceof Error ? extractApiErrorMessage(e.message) : t("opportunities.form.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="animate-fade-in">
      <CardContent className="space-y-4 pt-6">
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
            <p className="text-small text-foreground">{error}</p>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="opp-title">{t("opportunities.form.titleLabel")}</Label>
          <Input
            id="opp-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("opportunities.form.titlePlaceholder")}
            disabled={submitting}
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="opp-type">{t("opportunities.form.typeLabel")}</Label>
            <select
              id="opp-type"
              value={type}
              onChange={(e) => setType(e.target.value as OpportunityType)}
              disabled={submitting}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-small text-foreground"
            >
              <option value="job">{t("opportunities.form.typeJob")}</option>
              <option value="internship">{t("opportunities.form.typeInternship")}</option>
            </select>
          </div>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="opp-location">{t("opportunities.form.locationLabel")}</Label>
            <Input
              id="opp-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("opportunities.form.locationPlaceholder")}
              disabled={submitting}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="opp-skills">{t("opportunities.form.skillsLabel")}</Label>
          <div className="flex gap-2">
            <Input
              id="opp-skills"
              value={skillDraft}
              onChange={(e) => setSkillDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder={t("opportunities.form.skillsPlaceholder")}
              disabled={submitting}
            />
            <Button type="button" variant="outline" onClick={addSkill} disabled={submitting}>
              {t("opportunities.form.addSkill")}
            </Button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <RemovableSkillChip
                  key={skill}
                  skill={skill}
                  onRemove={() => setSkills(skills.filter((s) => s !== skill))}
                  disabled={submitting}
                  removeLabel={t("opportunities.form.removeSkill", { skill })}
                />
              ))}
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="opp-description">{t("opportunities.form.descriptionLabel")}</Label>
          <Textarea
            id="opp-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("opportunities.form.descriptionPlaceholder")}
            disabled={submitting}
          />
        </div>
        <Button onClick={handleSubmit} disabled={submitting || !title.trim()} isLoading={submitting}>
          {t("opportunities.form.submit")}
        </Button>
      </CardContent>
    </Card>
  );
}

function OpportunityCard({
  opportunity,
  onToggleStatus,
  withAuth,
}: {
  opportunity: JobOpportunityRead;
  onToggleStatus: (opportunity: JobOpportunityRead) => void;
  withAuth: <T>(path: string, init?: RequestInit) => Promise<T>;
}) {
  const { t } = useTranslations();
  const [expanded, setExpanded] = useState(false);
  const [applications, setApplications] = useState<ApplicationRead[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggleExpanded() {
    if (!expanded && applications === null) {
      setLoading(true);
      try {
        const result = await withAuth<ApplicationRead[]>(`/company/opportunities/${opportunity.id}/applications`);
        setApplications(result);
      } finally {
        setLoading(false);
      }
    }
    setExpanded((v) => !v);
  }

  async function updateApplicationStatus(applicationId: string, status: ApplicationStatus) {
    const updated = await withAuth<ApplicationRead>(
      `/company/opportunities/${opportunity.id}/applications/${applicationId}`,
      { method: "PATCH", body: JSON.stringify({ status }) },
    );
    setApplications((prev) => (prev ? prev.map((a) => (a.id === updated.id ? updated : a)) : prev));
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-body">{opportunity.title}</CardTitle>
          <p className="mt-1 text-caption text-muted-foreground">
            {opportunity.location || "—"} · {opportunity.opportunity_type === "job" ? t("opportunities.form.typeJob") : t("opportunities.form.typeInternship")}
          </p>
        </div>
        <Badge variant={opportunity.status === "open" ? "success" : "outline"}>
          {opportunity.status === "open" ? t("opportunities.statusOpen") : t("opportunities.statusClosed")}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {opportunity.required_skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {opportunity.required_skills.map((skill) => (
              <Badge key={skill} variant="outline">
                {skill}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onToggleStatus(opportunity)}>
            {opportunity.status === "open" ? t("opportunities.close") : t("opportunities.reopen")}
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleExpanded} isLoading={loading}>
            {expanded ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
            {expanded
              ? t("opportunities.hideApplications")
              : t("opportunities.viewApplications", { count: applications?.length ?? "…" })}
          </Button>
        </div>

        {expanded && (
          <div className="space-y-2 border-t border-border-subtle pt-3">
            {applications && applications.length === 0 && (
              <p className="text-small text-muted-foreground">{t("opportunities.noApplications")}</p>
            )}
            {applications?.map((application) => (
              <div
                key={application.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-subtle bg-background p-3"
              >
                <div>
                  <p className="text-small font-medium text-foreground">{application.applicant.email}</p>
                  <p className="text-caption text-muted-foreground">
                    {t(`opportunities.applicantStatus.${application.status}`)}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => updateApplicationStatus(application.id, "reviewed")}>
                    {t("opportunities.markReviewed")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => updateApplicationStatus(application.id, "accepted")}>
                    {t("opportunities.accept")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => updateApplicationStatus(application.id, "rejected")}>
                    {t("opportunities.reject")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
