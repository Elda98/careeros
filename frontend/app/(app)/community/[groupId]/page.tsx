import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";
import type { CommunityGroupRead, CommunityPostRead } from "@/lib/types";

import { GroupView } from "./group-view";

export default async function CommunityGroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) {
    redirect("/sign-in");
  }

  let group: CommunityGroupRead | null = null;
  let posts: CommunityPostRead[] = [];
  let error: string | null = null;
  try {
    [group, posts] = await Promise.all([
      apiFetch<CommunityGroupRead>(`/community/groups/${groupId}`, { token }),
      apiFetch<CommunityPostRead[]>(`/community/groups/${groupId}/posts`, { token }),
    ]);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      redirect("/community");
    }
    error = e instanceof Error ? e.message : "Failed to load this community";
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 sm:px-8">
      <GroupView initialGroup={group} initialPosts={posts} error={error} />
    </div>
  );
}
