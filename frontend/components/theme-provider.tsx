"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Thin client-boundary wrapper — next-themes reads/writes `data-theme` on
 * `<html>` before hydration (via an inlined script) so there is no
 * light/dark flash on first paint, matching globals.css's `:root` (dark) /
 * `[data-theme="light"]` (override) token split.
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
