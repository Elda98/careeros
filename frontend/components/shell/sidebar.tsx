"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { Logo } from "@/components/logo";
import { NAV_ITEMS } from "@/components/shell/nav-config";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslations();

  useEffect(() => {
    if (!mobileOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onMobileClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onMobileClose]);

  return (
    <>
      {/* Backdrop — mobile only, closes the drawer on outside click. */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* `start-0`/`border-e` are logical (inline-start/inline-end) so the
          sidebar sits on the correct side automatically in RTL; the mobile
          drawer's slide direction is physical (translate-x has no logical
          equivalent in CSS), so it gets an explicit rtl: override. */}
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 flex w-64 shrink-0 flex-col border-e border-border-subtle bg-sidebar",
          "transition-transform duration-300 ease-out lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full",
        )}
        aria-label="Primary navigation"
      >
        <div className="flex h-14 shrink-0 items-center justify-between px-4">
          <Link href="/dashboard" className="rounded-md px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Logo size={24} />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMobileClose}
            aria-label={t("nav.closeNavigation")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-full px-3 py-2 text-small font-medium transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-sidebar-active text-sidebar-active-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-active/60 hover:text-sidebar-active-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border-subtle px-4 py-3">
          <p className="text-caption text-muted-foreground">{BRAND.name} · Phase 0</p>
        </div>
      </aside>
    </>
  );
}
