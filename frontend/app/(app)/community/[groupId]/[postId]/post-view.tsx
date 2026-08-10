"use client";

import { useAuth } from "@clerk/nextjs";
import { AlertCircle, Heart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, extractApiErrorMessage } from "@/lib/api";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { CommunityPostDetailRead, CommunityPostType, CommunityReactionToggleRead } from "@/lib/types";

const POST_TYPE_KEY: Record<CommunityPostType, string> = {
  general: "community.postType.general",
  question: "community.postType.question",
  experience: "community.postType.experience",
  project: "community.postType.project",
};

export function PostView({
  groupId,
  initialPost,
  error,
}: {
  groupId: string;
  initialPost: CommunityPostDetailRead | null;
  error: string | null;
}) {
  const { t } = useTranslations();
  const { getToken } = useAuth();

  const [post, setPost] = useState(initialPost);
  const [commentBody, setCommentBody] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (error || !post) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <p className="text-small text-foreground">{error ?? t("community.loadError")}</p>
        </CardContent>
      </Card>
    );
  }

  async function toggleReaction() {
    if (!post) return;
    setActionError(null);
    try {
      const token = await getToken();
      const result = await apiFetch<CommunityReactionToggleRead>(`/community/posts/${post.id}/react`, {
        method: "POST",
        token,
      });
      setPost((prev) => (prev ? { ...prev, user_has_reacted: result.reacted, reaction_count: result.reaction_count } : prev));
    } catch (e) {
      setActionError(e instanceof Error ? extractApiErrorMessage(e.message) : t("community.actionError"));
    }
  }

  async function handleAddComment() {
    if (!post) return;
    setActionError(null);
    setSubmittingComment(true);
    try {
      const token = await getToken();
      const updated = await apiFetch<CommunityPostDetailRead>(`/community/posts/${post.id}/comments`, {
        method: "POST",
        token,
        body: JSON.stringify({ body: commentBody }),
      });
      setPost(updated);
      setCommentBody("");
    } catch (e) {
      setActionError(e instanceof Error ? extractApiErrorMessage(e.message) : t("community.commentError"));
    } finally {
      setSubmittingComment(false);
    }
  }

  return (
    <>
      <Link href={`/community/${groupId}`} className="text-small font-medium text-primary hover:underline">
        {t("community.backToGroup")}
      </Link>

      <Card className="mt-3 animate-fade-in">
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-title">{post.title || t(POST_TYPE_KEY[post.post_type])}</CardTitle>
            <p className="mt-1 text-caption text-muted-foreground">
              {post.author.display_label} · {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
          <Badge variant="outline">{t(POST_TYPE_KEY[post.post_type])}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap text-body text-foreground">{post.body}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleReaction}
            className={post.user_has_reacted ? "text-primary" : "text-muted-foreground"}
          >
            <Heart className={`h-4 w-4 ${post.user_has_reacted ? "fill-current" : ""}`} aria-hidden="true" />
            {t("community.reactionCount", { count: post.reaction_count })}
          </Button>
        </CardContent>
      </Card>

      {actionError && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <p className="text-small text-foreground">{actionError}</p>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-heading text-foreground">{t("community.commentCount", { count: post.comments.length })}</h2>
        <div className="mt-3 space-y-2">
          {post.comments.map((comment) => (
            <div key={comment.id} className="rounded-xl border border-border-subtle bg-surface p-3.5">
              <p className="text-caption font-medium text-foreground">
                {comment.author.display_label}{" "}
                <span className="font-normal text-muted-foreground">{new Date(comment.created_at).toLocaleDateString()}</span>
              </p>
              <p className="mt-1 text-small text-foreground">{comment.body}</p>
            </div>
          ))}
        </div>

        <Card className="mt-4">
          <CardContent className="space-y-3 pt-6">
            <Textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder={t("community.form.commentPlaceholder")}
              disabled={submittingComment}
              rows={3}
            />
            <Button onClick={handleAddComment} disabled={submittingComment || !commentBody.trim()} isLoading={submittingComment}>
              {t("community.form.commentSubmit")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
