"use client";

import { useAuth } from "@clerk/nextjs";
import { AlertCircle, Plus, Search, Sparkles, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, extractApiErrorMessage } from "@/lib/api";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { CommunityGroupRead, CommunityGroupType, GoalRead, ProfileRead } from "@/lib/types";

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

// Display order for the "browse by category" sections — general first
// (the widest audience), then progressively narrower/more specific.
const GROUP_TYPE_ORDER: CommunityGroupType[] = [
  "general",
  "major",
  "university",
  "college",
  "department",
  "skill",
  "goal",
  "opportunities_events",
];

function matchesInterest(group: CommunityGroupRead, goal: GoalRead | null, profile: ProfileRead | null): boolean {
  const haystack = `${group.name} ${group.description}`.toLowerCase();
  const needles = [goal?.target_role, goal?.target_field, ...(profile?.skills ?? [])]
    .filter((n): n is string => typeof n === "string" && n.length > 2)
    .map((n) => n.toLowerCase());
  return needles.some((n) => haystack.includes(n));
}

export function CommunityView({
  initialGroups,
  error,
  goal,
  profile,
  canCreateGroup,
}: {
  initialGroups: CommunityGroupRead[];
  error: string | null;
  goal: GoalRead | null;
  profile: ProfileRead | null;
  canCreateGroup: boolean;
}) {
  const { t } = useTranslations();
  const { getToken } = useAuth();

  const [groups, setGroups] = useState(initialGroups);
  const [showForm, setShowForm] = useState(false);
  const [busyGroupId, setBusyGroupId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => `${g.name} ${g.description}`.toLowerCase().includes(q));
  }, [groups, search]);

  const myGroups = useMemo(() => searched.filter((g) => g.is_member), [searched]);
  const recommended = useMemo(
    () => searched.filter((g) => !g.is_member && matchesInterest(g, goal, profile)),
    [searched, goal, profile],
  );
  const byType = useMemo(() => {
    const map = new Map<CommunityGroupType, CommunityGroupRead[]>();
    for (const g of searched) {
      const list = map.get(g.group_type) ?? [];
      list.push(g);
      map.set(g.group_type, list);
    }
    return map;
  }, [searched]);

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

  const hasAnyGroups = groups.length > 0;
  const searchHasNoResults = hasAnyGroups && search.trim() !== "" && searched.length === 0;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-title text-foreground">{t("community.title")}</h1>
          <p className="mt-1 text-small text-muted-foreground">{t("community.subtitle")}</p>
        </div>
        {/* Server-gated to Company/Service Provider — this only decides
            whether to show the button, the backend independently rejects
            the request regardless of what the frontend renders. */}
        {canCreateGroup && (
          <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("community.createNew")}
          </Button>
        )}
      </div>

      {(error || actionError) && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <p className="text-small text-foreground">{error ?? actionError}</p>
        </div>
      )}

      {showForm && canCreateGroup && (
        <CreateGroupForm
          withAuth={withAuth}
          onCreated={(created) => {
            setGroups((prev) => [created, ...prev]);
            setShowForm(false);
          }}
        />
      )}

      {hasAnyGroups && (
        <div className="relative mt-4">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("community.searchPlaceholder")}
            aria-label={t("community.searchPlaceholder")}
            className="ps-9"
          />
        </div>
      )}

      {!hasAnyGroups && (
        <div className="mt-8 rounded-xl border border-dashed border-border-subtle bg-surface p-8 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-body font-medium text-foreground">{t("community.emptyStateTitle")}</p>
          <p className="mx-auto mt-1 max-w-sm text-small text-muted-foreground">
            {canCreateGroup ? t("community.emptyStateCreatorHint") : t("community.emptyStateMemberHint")}
          </p>
        </div>
      )}

      {searchHasNoResults && (
        <p className="mt-6 text-center text-small text-muted-foreground">{t("community.noSearchResults", { query: search })}</p>
      )}

      {myGroups.length > 0 && (
        <GroupSection
          title={t("community.myCommunities")}
          icon={Users}
          groups={myGroups}
          busyGroupId={busyGroupId}
          onToggleMembership={toggleMembership}
          t={t}
        />
      )}

      {recommended.length > 0 && (
        <GroupSection
          title={t("community.recommendedForYou")}
          icon={Sparkles}
          groups={recommended}
          busyGroupId={busyGroupId}
          onToggleMembership={toggleMembership}
          t={t}
        />
      )}

      {hasAnyGroups && !searchHasNoResults && (
        <div className="mt-8">
          <h2 className="text-heading text-foreground">{t("community.browseByCategory")}</h2>
          {GROUP_TYPE_ORDER.map((groupType) => {
            const list = byType.get(groupType);
            if (!list || list.length === 0) return null;
            return (
              <GroupSection
                key={groupType}
                title={t(GROUP_TYPE_KEY[groupType])}
                groups={list}
                busyGroupId={busyGroupId}
                onToggleMembership={toggleMembership}
                t={t}
                compact
              />
            );
          })}
        </div>
      )}
    </>
  );
}

function GroupSection({
  title,
  icon: Icon,
  groups,
  busyGroupId,
  onToggleMembership,
  t,
  compact,
}: {
  title: string;
  icon?: LucideIcon;
  groups: CommunityGroupRead[];
  busyGroupId: string | null;
  onToggleMembership: (group: CommunityGroupRead) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "mt-5" : "mt-6"}>
      <h3 className="mb-3 flex items-center gap-1.5 text-small font-medium text-foreground">
        {Icon && <Icon className="h-4 w-4 text-primary" aria-hidden="true" />}
        {title}
      </h3>
      <div className="space-y-3">
        {groups.map((group) => (
          <Card key={group.id} className="animate-fade-in">
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <Link
                  href={`/community/${group.id}`}
                  className="text-body font-semibold text-foreground hover:underline"
                  dir="auto"
                >
                  {group.name}
                </Link>
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-caption text-muted-foreground">
                  {group.is_owner && <Badge variant="primary">{t("community.owner")}</Badge>}
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
                onClick={() => onToggleMembership(group)}
                isLoading={busyGroupId === group.id}
              >
                {group.is_member ? t("community.leave") : t("community.join")}
              </Button>
            </CardHeader>
            {group.description && (
              <CardContent>
                <p className="text-small text-foreground" dir="auto">
                  {group.description}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
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
        <p className="text-caption text-muted-foreground">{t("community.form.ownerNotice")}</p>
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
