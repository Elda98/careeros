import {
  LayoutDashboard,
  Target,
  Route,
  FileText,
  Bell,
  TrendingUp,
  UserCircle,
  Settings,
  Briefcase,
  HandHeart,
  Mic,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  /** Dot-path into the i18n dictionary (see lib/i18n/messages) — resolved via useTranslations()'s t(). */
  labelKey: string;
  icon: LucideIcon;
}

export interface NavGroup {
  /** Dot-path for the group's section heading, or null for the first
   * (Home/Career) group, which reads as the natural top of the list
   * without needing a label of its own. */
  labelKey: string | null;
  items: NavItem[];
}

/**
 * Single source of truth for the primary navigation — the Sidebar renders
 * this, and the Topbar derives the current page title from it, so the two
 * can never drift out of sync with each other.
 *
 * Grouped by what the user is actually trying to do, not flattened into
 * one list of every route — "Home & Career" (the day-to-day loop),
 * "Career Tools" (things you do occasionally, not daily), "Explore"
 * (outward-facing: opportunities, people, services), "Profile" (account-
 * level, not career-content). This is the Student/Graduate ("Individual")
 * navigation specifically — Company and Service Provider each have their
 * own minimal dashboard shell (app/company, app/provider), not this one.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: null,
    items: [
      { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
      { href: "/skill-gap-analysis", labelKey: "nav.skillGapAnalysis", icon: Target },
      { href: "/roadmap", labelKey: "nav.roadmap", icon: Route },
      { href: "/progress", labelKey: "nav.progress", icon: TrendingUp },
      { href: "/notifications", labelKey: "nav.notifications", icon: Bell },
    ],
  },
  {
    labelKey: "nav.group.careerTools",
    items: [
      { href: "/cv-feedback", labelKey: "nav.cvFeedback", icon: FileText },
      { href: "/interview", labelKey: "nav.interview", icon: Mic },
    ],
  },
  {
    labelKey: "nav.group.explore",
    items: [
      { href: "/opportunities", labelKey: "nav.opportunities", icon: Briefcase },
      { href: "/community", labelKey: "nav.community", icon: Users },
      { href: "/services", labelKey: "nav.services", icon: HandHeart },
    ],
  },
  {
    labelKey: "nav.group.profile",
    items: [
      { href: "/profile", labelKey: "nav.profileGoal", icon: UserCircle },
      { href: "/settings", labelKey: "nav.settings", icon: Settings },
    ],
  },
];

/** Flattened view — used wherever a lookup across all items is needed
 * regardless of grouping (e.g. Topbar's current-page-title derivation). */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);
