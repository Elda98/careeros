import { AppShell } from "@/components/shell/app-shell";

/**
 * Shared chrome for every authenticated screen (Dashboard first, the rest
 * following as their own redesign slices — see PHASE0_EXECUTION_PLAN.md).
 * A route group (`(app)`), so it changes nothing about the URLs those
 * pages already respond to.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
