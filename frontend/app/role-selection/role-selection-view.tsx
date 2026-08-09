"use client";

import { useAuth } from "@clerk/nextjs";
import { AlertCircle, Briefcase, Building2, GraduationCap, HandHeart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/logo";
import { apiFetch, extractApiErrorMessage } from "@/lib/api";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { destinationForAccountType } from "@/lib/role-routing";
import type { AccountType, AccountTypeRead } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLES: { type: AccountType; icon: typeof GraduationCap; key: "student" | "graduate" | "company" | "serviceProvider" }[] = [
  { type: "student", icon: GraduationCap, key: "student" },
  { type: "graduate", icon: Briefcase, key: "graduate" },
  { type: "company", icon: Building2, key: "company" },
  { type: "service_provider", icon: HandHeart, key: "serviceProvider" },
];

/**
 * "How will you use Orbit?" — shown once, to a signed-in user whose
 * account_type is still null (page.tsx already redirected away anyone who
 * has already chosen). Each card is a real <button>, not a styled <div
 * onClick>, for full keyboard/screen-reader accessibility, matching the
 * rest of the app's standard.
 */
export function RoleSelectionView() {
  const { t } = useTranslations();
  const { getToken } = useAuth();
  const router = useRouter();

  const [submitting, setSubmitting] = useState<AccountType | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function selectRole(accountType: AccountType) {
    setError(null);
    setSubmitting(accountType);
    try {
      const token = await getToken();
      await apiFetch<AccountTypeRead>("/account/type", {
        method: "PUT",
        body: JSON.stringify({ account_type: accountType }),
        token,
      });
      router.push(destinationForAccountType(accountType));
    } catch (e) {
      setError(e instanceof Error ? extractApiErrorMessage(e.message) : t("roleSelection.error"));
      setSubmitting(null);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col justify-center px-6 py-12 sm:px-8">
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo size={40} animated />
        <h1 className="mt-3 text-title text-foreground">{t("roleSelection.title")}</h1>
        <p className="mt-2 max-w-md text-small text-muted-foreground">{t("roleSelection.description")}</p>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <p className="text-small text-foreground">{error}</p>
        </div>
      )}

      <div className="grid animate-fade-in gap-4 sm:grid-cols-2">
        {ROLES.map(({ type, icon: Icon, key }) => {
          const isSubmittingThis = submitting === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => selectRole(type)}
              disabled={submitting !== null}
              className={cn(
                "flex flex-col items-start gap-3 rounded-xl border border-border-subtle bg-surface p-5 text-start shadow-xs",
                "transition-all duration-200 hover:border-primary/40 hover:shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-60",
                isSubmittingThis && "border-primary/40",
              )}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-heading text-foreground">{t(`roleSelection.${key}.name`)}</span>
              <span className="text-small text-muted-foreground">{t(`roleSelection.${key}.description`)}</span>
              {isSubmittingThis && (
                <span className="text-caption text-primary" role="status">
                  {t("roleSelection.continue")}…
                </span>
              )}
            </button>
          );
        })}
      </div>
    </main>
  );
}
