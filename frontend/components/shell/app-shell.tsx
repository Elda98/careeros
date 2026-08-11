"use client";

import { useState } from "react";

import { type NavGroup, NAV_GROUPS, NAV_ITEMS } from "@/components/shell/nav-config";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";

/**
 * The persistent chrome every authenticated page renders inside — one
 * Sidebar, one Topbar, reused everywhere rather than each page building its
 * own header/nav. Mobile-sidebar open/close state lives here since both
 * Topbar (the trigger) and Sidebar (the drawer) need to share it.
 *
 * `navGroups`/`homeHref` default to the Student/Graduate nav (the (app)
 * route group's only caller); Company and Service Provider dashboards pass
 * their own persona-specific set (nav-config.ts's navGroupsForAccountType)
 * so they get the same real chrome — sign-out, Settings, Notifications,
 * language/theme toggles — instead of a bare unshelled page.
 */
export function AppShell({
  children,
  navGroups = NAV_GROUPS,
  homeHref = "/dashboard",
}: {
  children: React.ReactNode;
  navGroups?: NavGroup[];
  homeHref?: string;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navItems = navGroups === NAV_GROUPS ? NAV_ITEMS : navGroups.flatMap((group) => group.items);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
        navGroups={navGroups}
        homeHref={homeHref}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} navItems={navItems} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
