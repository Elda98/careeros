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
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  /** Dot-path into the i18n dictionary (see lib/i18n/messages) — resolved via useTranslations()'s t(). */
  labelKey: string;
  icon: LucideIcon;
}

/**
 * Single source of truth for the primary navigation — the Sidebar renders
 * this, and the Topbar derives the current page title from it, so the two
 * can never drift out of sync with each other.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/skill-gap-analysis", labelKey: "nav.skillGapAnalysis", icon: Target },
  { href: "/roadmap", labelKey: "nav.roadmap", icon: Route },
  { href: "/opportunities", labelKey: "nav.opportunities", icon: Briefcase },
  { href: "/services", labelKey: "nav.services", icon: HandHeart },
  { href: "/cv-feedback", labelKey: "nav.cvFeedback", icon: FileText },
  { href: "/notifications", labelKey: "nav.notifications", icon: Bell },
  { href: "/progress", labelKey: "nav.progress", icon: TrendingUp },
  { href: "/profile", labelKey: "nav.profileGoal", icon: UserCircle },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];
