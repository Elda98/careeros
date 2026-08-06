"use client";

import { Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n/config";
import { useTranslations } from "@/lib/i18n/locale-provider";

/** Switches between English and Arabic — available in both the marketing nav and the product Topbar, and (as a control only) in Settings, per the brand direction's "switch available in navigation and Settings." */
export function LanguageToggle() {
  const { locale, setLocale, t } = useTranslations();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("common.language")}>
          <Languages className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((l) => (
          <DropdownMenuItem key={l} onClick={() => setLocale(l)} aria-current={l === locale}>
            <span className={l === locale ? "font-semibold text-primary" : ""}>{LOCALE_LABELS[l]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
