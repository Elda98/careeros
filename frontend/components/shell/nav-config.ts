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

import type { AccountType } from "@/lib/types";

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
 * navigation specifically — Company and Service Provider get their own,
 * much shorter set below (COMPANY_NAV_GROUPS / PROVIDER_NAV_GROUPS), since
 * none of the career-seeker tools (Skill Gap Analysis, Roadmap, CV
 * Feedback, Interview Prep, a personal Profile/Goal) apply to them; they
 * still get the same persistent Sidebar/Topbar shell (sign-out, Settings,
 * Notifications, language/theme toggles), not a bare unshelled page.
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

/** Company's own nav: their job/internship postings live on their Home
 * itself (CompanyOpportunitiesPanel), not a separate route, so it's one
 * short ungrouped list rather than the Student/Graduate nav's four
 * sections — there's nothing here to group. */
export const COMPANY_NAV_GROUPS: NavGroup[] = [
  {
    labelKey: null,
    items: [
      { href: "/company", labelKey: "nav.dashboard", icon: LayoutDashboard },
      { href: "/community", labelKey: "nav.community", icon: Users },
      { href: "/notifications", labelKey: "nav.notifications", icon: Bell },
      { href: "/settings", labelKey: "nav.settings", icon: Settings },
    ],
  },
];

/** Service Provider's own nav — same shape as Company's, their listings
 * likewise live on their Home (ProviderServicesPanel). */
export const PROVIDER_NAV_GROUPS: NavGroup[] = [
  {
    labelKey: null,
    items: [
      { href: "/provider", labelKey: "nav.dashboard", icon: LayoutDashboard },
      { href: "/community", labelKey: "nav.community", icon: Users },
      { href: "/notifications", labelKey: "nav.notifications", icon: Bell },
      { href: "/settings", labelKey: "nav.settings", icon: Settings },
    ],
  },
];

/** Flattened view — used wherever a lookup across all items is needed
 * regardless of grouping (e.g. Topbar's current-page-title derivation). */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

/** account_type is null for a signed-in user who hasn't picked a role yet
 * (role-selection redirects them away before any shelled page renders, but
 * this stays total rather than partial so a stray render can't crash). */
export function navGroupsForAccountType(accountType: AccountType | null): NavGroup[] {
  switch (accountType) {
    case "company":
      return COMPANY_NAV_GROUPS;
    case "service_provider":
      return PROVIDER_NAV_GROUPS;
    default:
      return NAV_GROUPS;
  }
}
