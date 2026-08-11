import { AppShell } from "@/components/shell/app-shell";

/**
 * Shared chrome for every Student/Graduate screen. A route group
 * (`(app)`), so it changes nothing about the URLs those pages already
 * respond to. Company and Service Provider get the same AppShell with
 * their own nav (see app/company/page.tsx, app/provider/page.tsx) — they
 * live outside this route group since their pages aren't part of the
 * Student/Graduate URL space, not because they lack a shell.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
