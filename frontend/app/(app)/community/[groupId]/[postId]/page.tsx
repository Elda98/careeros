import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";
import type { CommunityPostDetailRead } from "@/lib/types";

import { PostView } from "./post-view";

export default async function CommunityPostPage({
  params,
}: {
  params: Promise<{ groupId: string; postId: string }>;
}) {
  const { groupId, postId } = await params;
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) {
    redirect("/sign-in");
  }

  let post: CommunityPostDetailRead | null = null;
  let error: string | null = null;
  try {
    post = await apiFetch<CommunityPostDetailRead>(`/community/posts/${postId}`, { token });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      redirect(`/community/${groupId}`);
    }
    error = e instanceof Error ? e.message : "Failed to load this post";
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 sm:px-8">
      <PostView groupId={groupId} initialPost={post} error={error} />
    </div>
  );
}
