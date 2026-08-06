import type { Locale } from "@/lib/i18n/config";

/**
 * Shared date/grouping helpers — extracted from Notifications (its first
 * caller) when Progress needed the exact same "group a dated list into
 * Today/Yesterday/Earlier, with locale-correct relative/absolute labels"
 * behavior a second time. Uses native `Intl.RelativeTimeFormat`/
 * `Intl.DateTimeFormat` rather than translated strings — see
 * frontend/README.md's Language System section for why (correct Arabic
 * plural/dual agreement for free, zero new translation keys).
 */

export function relativeLabel(date: Date, locale: Locale): string {
  const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, "hour");
  return rtf.format(Math.round(diffHour / 24), "day");
}

export function timeOfDay(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(date);
}

export function fullDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export interface RecencyGroup<T> {
  key: "today" | "yesterday" | "earlier";
  labelKey: string;
  items: T[];
}

/** `getDate` reads the ISO timestamp off whatever list-item shape the caller has (notifications, analysis versions, ...). */
export function groupByRecency<T>(items: T[], getDate: (item: T) => string): RecencyGroup<T>[] {
  const now = new Date();
  const todayStart = startOfDay(now).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

  const today: T[] = [];
  const yesterday: T[] = [];
  const earlier: T[] = [];

  for (const item of items) {
    const t = new Date(getDate(item)).getTime();
    if (t >= todayStart) today.push(item);
    else if (t >= yesterdayStart) yesterday.push(item);
    else earlier.push(item);
  }

  const groups: RecencyGroup<T>[] = [
    { key: "today", labelKey: "notifications.today", items: today },
    { key: "yesterday", labelKey: "notifications.yesterday", items: yesterday },
    { key: "earlier", labelKey: "notifications.earlier", items: earlier },
  ];
  return groups.filter((g) => g.items.length > 0);
}

/** The label appropriate for an item's position within its recency group. */
export function labelForGroup(groupKey: RecencyGroup<unknown>["key"], date: Date, locale: Locale): string {
  if (groupKey === "today") return relativeLabel(date, locale);
  if (groupKey === "yesterday") return timeOfDay(date, locale);
  return fullDate(date, locale);
}
