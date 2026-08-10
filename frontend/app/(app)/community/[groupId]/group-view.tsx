"use client";

import { useAuth } from "@clerk/nextjs";
import { AlertCircle, Heart, MessageCircle, Pencil, Plus, Trash2, Users } from "lucide-react";
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
import type { CommunityGroupRead, CommunityGroupType, CommunityPostRead, CommunityPostType } from "@/lib/types";

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

const POST_TYPE_KEY: Record<CommunityPostType, string> = {
  general: "community.postType.general",
  question: "community.postType.question",
  experience: "community.postType.experience",
  project: "community.postType.project",
};

export function GroupView({
  initialGroup,
  initialPosts,
  error,
}: {
  initialGroup: CommunityGroupRead | null;
  initialPosts: CommunityPostRead[];
  error: string | null;
}) {
  const { t } = useTranslations();
  const { getToken } = useAuth();

  const [group, setGroup] = useState(initialGroup);
  const [posts, setPosts] = useState(initialPosts);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [membershipBusy, setMembershipBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (error || !group) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <p className="text-small text-foreground">{error ?? t("community.loadError")}</p>
        </CardContent>
      </Card>
    );
  }

  async function withAuth<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await getToken();
    return apiFetch<T>(path, { ...init, token });
  }

  async function toggleMembership() {
    if (!group) return;
    setActionError(null);
    setMembershipBusy(true);
    try {
      await withAuth(`/community/groups/${group.id}/join`, { method: group.is_member ? "DELETE" : "POST" });
      setGroup((prev) =>
        prev ? { ...prev, is_member: !prev.is_member, member_count: prev.member_count + (prev.is_member ? -1 : 1) } : prev,
      );
    } catch (e) {
      setActionError(e instanceof Error ? extractApiErrorMessage(e.message) : t("community.actionError"));
    } finally {
      setMembershipBusy(false);
    }
  }

  async function toggleReaction(post: CommunityPostRead) {
    setActionError(null);
    try {
      const result = await withAuth<{ reacted: boolean; reaction_count: number }>(`/community/posts/${post.id}/react`, {
        method: "POST",
      });
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, user_has_reacted: result.reacted, reaction_count: result.reaction_count } : p)),
      );
    } catch (e) {
      setActionError(e instanceof Error ? extractApiErrorMessage(e.message) : t("community.actionError"));
    }
  }

  async function moderateDeletePost(post: CommunityPostRead) {
    setActionError(null);
    try {
      await withAuth(`/community/posts/${post.id}`, { method: "DELETE" });
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      setGroup((prev) => (prev ? { ...prev, post_count: Math.max(0, prev.post_count - 1) } : prev));
    } catch (e) {
      setActionError(e instanceof Error ? extractApiErrorMessage(e.message) : t("community.actionError"));
    }
  }

  return (
    <>
      <Link href="/community" className="text-small font-medium text-primary hover:underline">
        {t("community.backToList")}
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-title text-foreground">{group.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-caption text-muted-foreground">
            {group.is_owner && <Badge variant="primary">{t("community.owner")}</Badge>}
            <Badge variant="outline">{t(GROUP_TYPE_KEY[group.group_type])}</Badge>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" aria-hidden="true" />
              {t("community.memberCount", { count: group.member_count })}
            </span>
            <span>{t("community.postCount", { count: group.post_count })}</span>
          </p>
          {group.description && <p className="mt-2 text-small text-foreground">{group.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {group.is_owner && (
            <Button variant="outline" size="sm" onClick={() => setShowEditForm((v) => !v)}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              {t("community.edit")}
            </Button>
          )}
          <Button variant={group.is_member ? "outline" : "default"} onClick={toggleMembership} isLoading={membershipBusy}>
            {group.is_member ? t("community.leave") : t("community.join")}
          </Button>
        </div>
      </div>

      {showEditForm && (
        <EditGroupForm
          group={group}
          withAuth={withAuth}
          onSaved={(updated) => {
            setGroup(updated);
            setShowEditForm(false);
          }}
        />
      )}

      {actionError && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <p className="text-small text-foreground">{actionError}</p>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-heading text-foreground">{t("community.posts")}</h2>
        {group.is_member && (
          <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("community.newPost")}
          </Button>
        )}
      </div>

      {!group.is_member && <p className="mt-2 text-small text-muted-foreground">{t("community.joinToPost")}</p>}

      {showForm && (
        <CreatePostForm
          groupId={group.id}
          withAuth={withAuth}
          onCreated={(created) => {
            setPosts((prev) => [created, ...prev]);
            setGroup((prev) => (prev ? { ...prev, post_count: prev.post_count + 1 } : prev));
            setShowForm(false);
          }}
        />
      )}

      <div className="mt-4 space-y-3">
        {posts.length === 0 && !showForm && <p className="text-small text-muted-foreground">{t("community.noPostsYet")}</p>}
        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <Link href={`/community/${group.id}/${post.id}`} className="text-body font-semibold text-foreground hover:underline">
                  {post.title || t(POST_TYPE_KEY[post.post_type])}
                </Link>
                <p className="mt-0.5 text-caption text-muted-foreground">
                  {post.author.display_label} · {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
              <Badge variant="outline">{t(POST_TYPE_KEY[post.post_type])}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="line-clamp-3 text-small text-foreground">{post.body}</p>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleReaction(post)}
                  className={post.user_has_reacted ? "text-primary" : "text-muted-foreground"}
                >
                  <Heart className={`h-4 w-4 ${post.user_has_reacted ? "fill-current" : ""}`} aria-hidden="true" />
                  {post.reaction_count}
                </Button>
                <Link
                  href={`/community/${group.id}/${post.id}`}
                  className="flex items-center gap-1.5 text-small text-muted-foreground hover:text-foreground"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  {post.comment_count}
                </Link>
                {group.is_owner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => moderateDeletePost(post)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {t("community.moderateDelete")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

function EditGroupForm({
  group,
  withAuth,
  onSaved,
}: {
  group: CommunityGroupRead;
  withAuth: <T>(path: string, init?: RequestInit) => Promise<T>;
  onSaved: (group: CommunityGroupRead) => void;
}) {
  const { t } = useTranslations();
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    setSubmitting(true);
    try {
      const updated = await withAuth<CommunityGroupRead>(`/community/groups/${group.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name, description }),
      });
      onSaved(updated);
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
          <Label htmlFor="eg-name">{t("community.form.nameLabel")}</Label>
          <Input id="eg-name" value={name} onChange={(e) => setName(e.target.value)} disabled={submitting} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="eg-description">{t("community.form.descriptionLabel")}</Label>
          <Textarea
            id="eg-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
          />
        </div>
        <Button onClick={handleSave} disabled={submitting || !name.trim()} isLoading={submitting}>
          {t("community.form.save")}
        </Button>
      </CardContent>
    </Card>
  );
}

function CreatePostForm({
  groupId,
  withAuth,
  onCreated,
}: {
  groupId: string;
  withAuth: <T>(path: string, init?: RequestInit) => Promise<T>;
  onCreated: (post: CommunityPostRead) => void;
}) {
  const { t } = useTranslations();
  const [postType, setPostType] = useState<CommunityPostType>("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const created = await withAuth<CommunityPostRead>(`/community/groups/${groupId}/posts`, {
        method: "POST",
        body: JSON.stringify({ post_type: postType, title, body }),
      });
      onCreated(created);
      setTitle("");
      setBody("");
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
          <Label htmlFor="cp-type">{t("community.form.postTypeLabel")}</Label>
          <select
            id="cp-type"
            value={postType}
            onChange={(e) => setPostType(e.target.value as CommunityPostType)}
            disabled={submitting}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-small text-foreground"
          >
            {Object.entries(POST_TYPE_KEY).map(([value, key]) => (
              <option key={value} value={value}>
                {t(key)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cp-title">{t("community.form.postTitleLabel")}</Label>
          <Input id="cp-title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={submitting} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cp-body">{t("community.form.postBodyLabel")}</Label>
          <Textarea id="cp-body" value={body} onChange={(e) => setBody(e.target.value)} disabled={submitting} rows={4} />
        </div>
        <Button onClick={handleSubmit} disabled={submitting || !body.trim()} isLoading={submitting}>
          {t("community.form.postSubmit")}
        </Button>
      </CardContent>
    </Card>
  );
}
