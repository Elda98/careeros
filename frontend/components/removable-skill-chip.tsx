"use client";

import { X } from "lucide-react";

import { badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * A real <button>, not a clickable <Badge> (a <div>) — extracted from
 * Profile (its first caller) when Onboarding needed the identical
 * keyboard-accessible skill-removal control a second time. Keeps the
 * exact Badge look via the exported `badgeVariants()` while getting
 * native keyboard/focus semantics for free — the old pages' skill chips
 * (Profile, Onboarding) were both keyboard-inoperable divs before this.
 */
export function RemovableSkillChip({
  skill,
  onRemove,
  disabled,
  removeLabel,
}: {
  skill: string;
  onRemove: () => void;
  disabled?: boolean;
  removeLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      disabled={disabled}
      className={cn(
        badgeVariants({ variant: "outline" }),
        "gap-1 transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
      aria-label={removeLabel}
    >
      {skill}
      <X className="h-3 w-3" aria-hidden="true" />
    </button>
  );
}
