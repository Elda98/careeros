"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

import { LanguageToggle } from "@/components/language-toggle";
import { NAV_ITEMS, type NavItem } from "@/components/shell/nav-config";
import { UserMenu } from "@/components/shell/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { useTranslations } from "@/lib/i18n/locale-provider";

interface TopbarProps {
  onMenuClick: () => void;
  /** Defaults to the Student/Graduate nav's flattened items — Company/
   * Provider pass their own, so the derived page title still matches
   * whichever Sidebar they're actually seeing. */
  navItems?: NavItem[];
}

export function Topbar({ onMenuClick, navItems = NAV_ITEMS }: TopbarProps) {
  const pathname = usePathname();
  const { t } = useTranslations();

  const match = pathname
    ? navItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    : undefined;
  const title = match ? t(match.labelKey) : BRAND.name;

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border-subtle bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick} aria-label={t("nav.openMenu")}>
          <Menu className="h-4 w-4" />
        </Button>
        <h1 className="text-heading text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-1">
        <LanguageToggle />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
