import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const eslintConfig = [
  // next-env.d.ts is auto-generated/managed by Next.js itself (regenerated
  // on every `next dev`/`next build`) and triggers a triple-slash-reference
  // lint error the moment Next.js adds its routes.d.ts reference — excluded
  // rather than hand-edited, per Next.js's own "do not edit" notice in the file.
  { ignores: ["next-env.d.ts", ".next/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
