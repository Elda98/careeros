import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Cairo, Manrope } from "next/font/google";
import { cookies } from "next/headers";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DEFAULT_LOCALE, LOCALE_COOKIE, dirFor, isLocale } from "@/lib/i18n/config";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { BRAND } from "@/lib/brand";
import en from "@/lib/i18n/messages/en.json";
import ar from "@/lib/i18n/messages/ar.json";

import "./globals.css";

// Manrope: the logo's own typeface (see the brand-analysis note in
// frontend/README.md) — replaces the placeholder Inter used before the
// official logo existed. Cairo pairs with it for Arabic: a geometric,
// professional Arabic sans that reads as a genuine counterpart to
// Manrope's warmth rather than a bolted-on fallback.
const fontSans = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const fontArabic = Cairo({ subsets: ["arabic"], variable: "--font-arabic", display: "swap" });

const METADATA_DICTIONARIES = { en, ar };

/**
 * Dynamic (not static `export const metadata`) specifically so the <title>
 * and description are locale-aware from the very first response — reading
 * the same server-side cookie RootLayout itself reads, independently,
 * since generateMetadata and the page component don't share request state.
 */
export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  const meta = METADATA_DICTIONARIES[locale].meta;

  return {
    title: { default: meta.title, template: `%s — ${BRAND.name}` },
    description: meta.description,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Locale is decided here, server-side, from a cookie — not client-side
  // like next-themes' script-injection approach — because cookies (unlike
  // localStorage) are available during SSR, so <html lang/dir> is correct
  // on the very first byte sent, with zero flash of the wrong direction.
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return (
    <ClerkProvider>
      {/* suppressHydrationWarning covers next-themes' data-theme script AND
          is harmless here too; lang/dir themselves are resolved server-side
          above, so there's no client/server mismatch to suppress for them. */}
      <html lang={locale} dir={dirFor(locale)} suppressHydrationWarning>
        <body className={`${fontSans.variable} ${fontArabic.variable} font-sans`}>
          <LocaleProvider initialLocale={locale}>
            <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem disableTransitionOnChange>
              <TooltipProvider delayDuration={200}>
                {children}
                <Toaster />
              </TooltipProvider>
            </ThemeProvider>
          </LocaleProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
