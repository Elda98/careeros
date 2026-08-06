import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1440px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        "border-subtle": "hsl(var(--border-subtle))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          foreground: "hsl(var(--surface-foreground))",
          hover: "hsl(var(--surface-hover))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          active: "hsl(var(--sidebar-active))",
          "active-foreground": "hsl(var(--sidebar-active-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        "gradient-accent": "hsl(var(--gradient-accent))",
        "accent-rose": {
          DEFAULT: "hsl(var(--accent-rose))",
          foreground: "hsl(var(--accent-rose-foreground))",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        arabic: ["var(--font-arabic)", "var(--font-sans)", "ui-sans-serif", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        // A restrained scale — five text sizes plus a display size, not the
        // dozen Tailwind ships by default. Fewer choices, used consistently,
        // reads as more deliberate than a wide, inconsistently-applied range.
        hero: ["3rem", { lineHeight: "1.05", letterSpacing: "-0.03em", fontWeight: "700" }],
        display: ["2.25rem", { lineHeight: "2.5rem", letterSpacing: "-0.02em", fontWeight: "600" }],
        title: ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.01em", fontWeight: "600" }],
        heading: ["1.125rem", { lineHeight: "1.625rem", letterSpacing: "-0.006em", fontWeight: "600" }],
        body: ["0.9375rem", { lineHeight: "1.5rem", fontWeight: "400" }],
        small: ["0.8125rem", { lineHeight: "1.25rem", fontWeight: "400" }],
        caption: ["0.75rem", { lineHeight: "1.125rem", fontWeight: "500", letterSpacing: "0.01em" }],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        // Cool-tinted, low-opacity, multi-stop shadows — closer to how
        // Linear/Vercel elevate a dark surface than Tailwind's default
        // (neutral-black, single-stop) shadow scale.
        xs: "0 1px 2px 0 hsl(var(--shadow-color) / 0.30)",
        sm: "0 1px 3px 0 hsl(var(--shadow-color) / 0.35), 0 1px 2px -1px hsl(var(--shadow-color) / 0.3)",
        md: "0 4px 12px -2px hsl(var(--shadow-color) / 0.35), 0 2px 4px -2px hsl(var(--shadow-color) / 0.3)",
        lg: "0 12px 24px -4px hsl(var(--shadow-color) / 0.4), 0 4px 8px -4px hsl(var(--shadow-color) / 0.3)",
        xl: "0 24px 48px -8px hsl(var(--shadow-color) / 0.45), 0 8px 16px -8px hsl(var(--shadow-color) / 0.35)",
        glow: "0 0 0 1px hsl(var(--primary) / 0.4), 0 0 24px 0 hsl(var(--primary) / 0.25)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(24px, -32px) scale(1.06)" },
        },
        "orbit-spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 1.6s linear infinite",
        "float-slow": "float 14s ease-in-out infinite",
        "float-slower": "float 20s ease-in-out infinite",
        "orbit-spin-slow": "orbit-spin 8s linear infinite",
      },
      transitionTimingFunction: {
        // The "premium" easing curve used across Linear/Vercel/Arc — starts
        // fast, settles gently, never a linear or bouncy overshoot.
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
