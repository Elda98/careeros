import { cn } from "@/lib/utils";

/**
 * Shimmer loading placeholder — replaces the ad hoc `animate-pulse` divs
 * that were hand-duplicated per page. A single implementation so every
 * loading state in the app moves the same way.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("relative overflow-hidden rounded-md bg-muted", className)} {...props}>
      <div
        className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-surface-hover/70 to-transparent"
        aria-hidden="true"
      />
    </div>
  );
}

export { Skeleton };
