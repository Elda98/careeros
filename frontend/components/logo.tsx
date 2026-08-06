import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

interface LogoProps {
  /** Pixel size of the mark (square). Wordmark, if shown, scales with it. */
  size?: number;
  /** Render the "Orbit" wordmark next to the mark. Off for tight spaces. */
  showWordmark?: boolean;
  /** Slow continuous ring rotation — reserved for hero/loading contexts; off by default so it doesn't distract in a persistent nav/sidebar. */
  animated?: boolean;
  className?: string;
}

/**
 * The official Orbit mark — two intersecting orbit rings (royal purple
 * primary, soft rose secondary) around a purple core, with satellite dots
 * at the ring intersections. Pure inline SVG (no image asset) so it's
 * crisp at any size and themes automatically via CSS variables.
 */
export function Logo({ size = 28, showWordmark = true, animated = false, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
        className={cn("shrink-0", animated && "animate-orbit-spin-slow")}
        style={{ transformOrigin: "50% 50%" }}
      >
        <ellipse
          cx="14"
          cy="14"
          rx="12"
          ry="5.2"
          transform="rotate(-32 14 14)"
          stroke="hsl(var(--accent-rose))"
          strokeWidth="1.6"
          opacity="0.85"
        />
        <ellipse
          cx="14"
          cy="14"
          rx="12"
          ry="5.2"
          transform="rotate(32 14 14)"
          stroke="hsl(var(--primary))"
          strokeWidth="1.6"
        />
        <circle cx="14" cy="14" r="3.2" fill="hsl(var(--primary))" />
        <circle cx="24.3" cy="9.4" r="1.6" fill="hsl(var(--primary))" />
        <circle cx="3.7" cy="18.6" r="1.6" fill="hsl(var(--accent-rose))" />
      </svg>
      {showWordmark && (
        <span className="text-body font-bold tracking-tight text-foreground">{BRAND.name}</span>
      )}
    </span>
  );
}
