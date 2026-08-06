"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

import { useTranslations } from "@/lib/i18n/locale-provider";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/** App-wide toast host — themed to match the current dark/light mode rather than sonner's own defaults. */
function Toaster({ ...props }: ToasterProps) {
  const { resolvedTheme } = useTheme();
  const { dir } = useTranslations();

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps["theme"]}
      className="toaster group"
      position={dir === "rtl" ? "bottom-left" : "bottom-right"}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
