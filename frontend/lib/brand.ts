/**
 * Single source of truth for brand copy — the marketing site, the app
 * shell, and page metadata all read from here so the name/tagline can
 * never drift between surfaces. Product name only; does not rename the
 * engineering-facing "CareerOS" used in the backend, database, or the
 * PRD/SAS documents — this is a presentation-layer brand, not a project
 * rename (see frontend/README.md for the scoping rationale).
 */
export const BRAND = {
  name: "Orbit",
  fullName: "Orbit Career",
  tagline: "AI-Powered Career Intelligence",
  description:
    "Orbit is your AI Career Operating System — a persistent model of your career, worked on by a coordinated set of AI agents that identify gaps, build your roadmap, and improve your materials.",
} as const;
