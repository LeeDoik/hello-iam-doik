import type { Locale } from "../i18n/locales";

const PRESENT: Record<Locale, string> = { ko: "현재", en: "present" };

function ym(iso: string): string {
  return iso.slice(0, 7).replace("-", ".");
}

export function formatPeriod(from: string, to: string | undefined, locale: Locale): string {
  return `${ym(from)} – ${to ? ym(to) : PRESENT[locale]}`;
}
