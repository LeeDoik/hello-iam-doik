import { LOCALES, type Locale } from "../i18n/locales";
import { localePath } from "./urls";

export type SeoInput = {
  locale: Locale;
  path: string;
  site: string;
  title: string;
  description: string;
  ogImage?: string;
};

function abs(site: string, path: string): string {
  return `${site.replace(/\/$/, "")}${path}`;
}

export function canonical(site: string, locale: Locale, path: string): string {
  return abs(site, localePath(locale, path));
}

export function alternates(site: string, path: string): { hreflang: string; href: string }[] {
  return [
    ...LOCALES.map((l) => ({ hreflang: l, href: abs(site, localePath(l, path)) })),
    { hreflang: "x-default", href: abs(site, localePath("ko", path)) },
  ];
}

export function ogImagePath(locale: Locale, slug?: string): string {
  return slug ? `/og/projects/${slug}/${locale}.png` : `/og/${locale}.png`;
}

export function ogImageUrl(site: string, locale: Locale, slug?: string): string {
  return abs(site, ogImagePath(locale, slug));
}
