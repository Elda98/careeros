import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";
import { careerSeekerRedirectTarget } from "@/lib/role-routing";
import type { InterviewSessionDetailRead, InterviewSessionReportRead } from "@/lib/types";

import { InterviewSessionView } from "./interview-session-view";

export default async function InterviewSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) {
    redirect("/sign-in");
  }

  const redirectTarget = await careerSeekerRedirectTarget(token);
  if (redirectTarget) {
    redirect(redirectTarget);
  }

  let session: InterviewSessionDetailRead | null = null;
  let report: InterviewSessionReportRead | null = null;
  let error: string | null = null;
  try {
    session = await apiFetch<InterviewSessionDetailRead>(`/interview/sessions/${sessionId}`, { token });
    if (session.status === "completed") {
      report = await apiFetch<InterviewSessionReportRead>(`/interview/sessions/${sessionId}/report`, { token });
    }
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      redirect("/interview");
    }
    error = e instanceof Error ? e.message : "Failed to load this interview session";
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 sm:px-8">
      <InterviewSessionView initialSession={session} initialReport={report} error={error} />
    </div>
  );
}
