"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { LogOut, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "@/lib/i18n/locale-provider";

/**
 * Reads Clerk's own `useUser()` for identity display (real email/avatar,
 * independent of the backend's JIT-provisioned placeholder email) and calls
 * Clerk's existing `signOut()` — no auth logic added or changed here, only
 * a themed presentation over hooks Clerk already provides.
 */
export function UserMenu() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const { t } = useTranslations();

  if (!isLoaded) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-muted" aria-hidden="true" />;
  }

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initial = (user?.firstName ?? email).slice(0, 1).toUpperCase() || "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={t("common.accountMenu")}
        >
          <Avatar>
            <AvatarImage src={user?.imageUrl} alt="" />
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate font-normal text-foreground">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <SettingsIcon className="h-4 w-4" /> {t("nav.settings")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut(() => router.push("/"))} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" /> {t("common.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
