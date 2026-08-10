"use client";

import { useAuth } from "@clerk/nextjs";
import { AlertCircle, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, extractApiErrorMessage } from "@/lib/api";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { CommunityGroupRead, CommunityGroupType } from "@/lib/types";

const GROUP_TYPE_KEY: Record<CommunityGroupType, string> = {
  general: "community.groupType.general",
  major: "community.groupType.major",
  university: "community.groupType.university",
  college: "community.groupType.college",
  department: "community.groupType.department",
  skill: "community.groupType.skill",
  goal: "community.groupType.goal",
  opportunities_events: "community.groupType.opportunitiesEvents",
};

export function CommunityView({ initialGroups, error }: { initialGroups: CommunityGroupRead[]; error: string | null }) {
  const { t } = useTranslations();
  const { getToken } = useAuth();

  const [groups, setGroups] = useState(initialGroups);
  const [showForm, setShowForm] = useState(false);
  const [busyGroupId, setBusyGroupId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function withAuth<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await getToken();
    return apiFetch<T>(path, { ...init, token });
  }

  async function toggleMembership(group: CommunityGroupRead) {
    setActionError(null);
    setBusyGroupId(group.id);
    try {
      await withAuth(`/community/groups/${group.id}/join`, { method: group.is_member ? "DELETE" : "POST" });
      setGroups((prev) =>
        prev.map((g) =>
          g.id === group.id
            ? { ...g, is_member: !g.is_member, member_count: g.member_count + (g.is_member ? -1 : 1) }
            : g,
        ),
      );
    } catch (e) {
      setActionError(e instanceof Error ? extractApiErrorMessage(e.message) : t("community.actionError"));
    } finally {
      setBusyGroupId(null);
    }
  }

  return (
    <>
      <h1 className="text-title text-foreground">{t("community.title")}</h1>
      <p className="mt-1 text-small text-muted-foreground">{t("community.subtitle")}</p>

      {(error || actionError) && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <p className="text-small text-foreground">{error ?? actionError}</p>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-heading text-foreground">{t("community.allCommunities")}</h2>
        <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("community.createNew")}
        </Button>
      </div>

      {showForm && (
        <CreateGroupForm
          withAuth={withAuth}
          onCreated={(created) => {
            setGroups((prev) => [created, ...prev]);
            setShowForm(false);
          }}
        />
      )}

      <div className="mt-4 space-y-3">
        {groups.length === 0 && !showForm && <p className="text-small text-muted-foreground">{t("community.noCommunitiesYet")}</p>}
        {groups.map((group) => (
          <Card key={group.id} className="animate-fade-in">
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <Link href={`/community/${group.id}`} className="text-body font-semibold text-foreground hover:underline">
                  {group.name}
                </Link>
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-caption text-muted-foreground">
                  <Badge variant="outline">{t(GROUP_TYPE_KEY[group.group_type])}</Badge>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" aria-hidden="true" />
                    {t("community.memberCount", { count: group.member_count })}
                  </span>
                  <span>{t("community.postCount", { count: group.post_count })}</span>
                </p>
              </div>
              <Button
                variant={group.is_member ? "outline" : "default"}
                size="sm"
                onClick={() => toggleMembership(group)}
                isLoading={busyGroupId === group.id}
              >
                {group.is_member ? t("community.leave") : t("community.join")}
              </Button>
            </CardHeader>
            {group.description && (
              <CardContent>
                <p className="text-small text-foreground">{group.description}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}

function CreateGroupForm({
  withAuth,
  onCreated,
}: {
  withAuth: <T>(path: string, init?: RequestInit) => Promise<T>;
  onCreated: (group: CommunityGroupRead) => void;
}) {
  const { t } = useTranslations();
  const [name, setName] = useState("");
  const [groupType, setGroupType] = useState<CommunityGroupType>("general");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const created = await withAuth<CommunityGroupRead>("/community/groups", {
        method: "POST",
        body: JSON.stringify({ name, group_type: groupType, description }),
      });
      onCreated(created);
    } catch (e) {
      setError(e instanceof Error ? extractApiErrorMessage(e.message) : t("community.form.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mt-4 animate-fade-in">
      <CardContent className="space-y-4 pt-6">
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
            <p className="text-small text-foreground">{error}</p>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="cg-name">{t("community.form.nameLabel")}</Label>
          <Input
            id="cg-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("community.form.namePlaceholder")}
            disabled={submitting}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cg-type">{t("community.form.typeLabel")}</Label>
          <select
            id="cg-type"
            value={groupType}
            onChange={(e) => setGroupType(e.target.value as CommunityGroupType)}
            disabled={submitting}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-small text-foreground"
          >
            {Object.entries(GROUP_TYPE_KEY).map(([value, key]) => (
              <option key={value} value={value}>
                {t(key)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cg-description">{t("community.form.descriptionLabel")}</Label>
          <Textarea
            id="cg-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("community.form.descriptionPlaceholder")}
            disabled={submitting}
          />
        </div>
        <Button onClick={handleSubmit} disabled={submitting || !name.trim()} isLoading={submitting}>
          {t("community.form.submit")}
        </Button>
      </CardContent>
    </Card>
  );
}
