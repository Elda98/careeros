import { Bell, Clock, FileText, Route as RouteIcon, Sparkles, Target, TrendingUp } from "lucide-react";

import type { BadgeProps } from "@/components/ui/badge";

/**
 * Shared category taxonomy — extracted from Notifications (its first
 * caller) when Progress needed the exact same icon/color/label mapping a
 * second time for its milestones timeline. The backend's authoritative,
 * complete list of category strings it will ever actually write
 * (backend/app/schemas/settings.py's NOTIFICATION_CATEGORIES) is exactly
 * three: analysis_complete, roadmap_updated, cv_feedback_complete —
 * everything else here (reminder/progress_update/goal_update/
 * system_message) is a forward-compatible visual slot, not a live
 * category: nothing in this codebase produces them today. See
 * frontend/README.md's Notifications section for the full reasoning.
 */
export const CATEGORY_ICON: Record<string, typeof Bell> = {
  analysis_complete: Sparkles,
  roadmap_updated: RouteIcon,
  cv_feedback_complete: FileText,
  reminder: Clock,
  progress_update: TrendingUp,
  goal_update: Target,
  system_message: Bell,
};

export const CATEGORY_BADGE_VARIANT: Record<string, BadgeProps["variant"]> = {
  analysis_complete: "primary",
  roadmap_updated: "rose",
  cv_feedback_complete: "success",
  reminder: "warning",
  progress_update: "success",
  goal_update: "primary",
  system_message: "outline",
};

// Every category that currently exists also implies exactly one place to
// go look — deliberately not extended to the forward-compatible-only
// categories above; a href for a category that never occurs would be
// untestable dead code.
export const CATEGORY_HREF: Record<string, string> = {
  analysis_complete: "/skill-gap-analysis",
  roadmap_updated: "/roadmap",
  cv_feedback_complete: "/cv-feedback",
};

const KNOWN_CATEGORIES = new Set(Object.keys(CATEGORY_ICON));

export function categoryKey(category: string): string {
  return KNOWN_CATEGORIES.has(category) ? category : "system_message";
}
