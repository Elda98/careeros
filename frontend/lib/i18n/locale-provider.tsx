"use client";

import { useAuth } from "@clerk/nextjs";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import { DEFAULT_LOCALE, LOCALE_COOKIE, dirFor, type Locale } from "@/lib/i18n/config";
import en from "@/lib/i18n/messages/en.json";
import ar from "@/lib/i18n/messages/ar.json";

type Dictionary = typeof en;
const DICTIONARIES: Record<Locale, Dictionary> = { en, ar: ar as Dictionary };

interface LocaleContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

/**
 * Locale is decided server-side (RootLayout reads the NEXT_LOCALE cookie
 * so `<html lang/dir>` is correct on first paint, no flash) and handed in
 * here as `initialLocale` — this provider only owns *changing* it
 * afterward. A cookie (read by the server on next navigation) is the
 * source of truth; localStorage is a same-tab fallback only.
 */
export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const { getToken, isSignedIn } = useAuth();

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
      try {
        localStorage.setItem(LOCALE_COOKIE, next);
      } catch {
        // Storage can be unavailable (private browsing); the cookie is the real source of truth.
      }
      document.documentElement.lang = next;
      document.documentElement.dir = dirFor(next);

      // Fire-and-forget: the cookie above stays the source of truth for
      // the UI chrome itself (rendered instantly, no network round trip
      // needed); this persists the same choice to the account so every
      // AI-generating agent call and backend-constructed message
      // (notifications, confidence reasons) picks it up too — see
      // backend/app/api/routers/account.py's /account/locale docstring.
      if (isSignedIn) {
        getToken()
          .then((token) =>
            token ? apiFetch("/account/locale", { method: "PUT", token, body: JSON.stringify({ locale: next }) }) : null,
          )
          .catch(() => {
            // Best-effort — the UI itself already switched via the cookie
            // above; a failed sync here just means the next AI-generated
            // result may lag one step behind until it succeeds (e.g. next
            // language switch, or next sign-in).
          });
      }
    },
    [getToken, isSignedIn],
  );

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const value = getByPath(DICTIONARIES[locale], key) ?? getByPath(DICTIONARIES[DEFAULT_LOCALE], key);
      const text = typeof value === "string" ? value : key;
      if (!vars) return text;
      return Object.entries(vars).reduce((acc, [name, val]) => acc.replaceAll(`{{${name}}}`, String(val)), text);
    },
    [locale],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, dir: dirFor(locale), setLocale, t }),
    [locale, setLocale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useTranslations() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useTranslations must be used within a LocaleProvider");
  return ctx;
}
