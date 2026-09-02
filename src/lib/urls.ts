import { DEFAULT_LOCALE, isLocale, type Locale } from "../i18n/locales";

function assertCanonicalPath(path: string): void {
  if (!path.startsWith("/") || !path.endsWith("/")) {
    throw new Error(`path must start and end with "/": ${path}`);
  }
}

export function localePath(locale: Locale, path: string): string {
  assertCanonicalPath(path);
  return locale === DEFAULT_LOCALE ? path : `/${locale}${path}`;
}

export function stripLocale(pathname: string): { locale: Locale; path: string } {
  const [, first = "", ...rest] = pathname.split("/");
  if (isLocale(first) && first !== DEFAULT_LOCALE) {
    const path = `/${rest.join("/")}`;
    return { locale: first, path: path.endsWith("/") ? path : `${path}/` };
  }
  return { locale: DEFAULT_LOCALE, path: pathname };
}

export function swapLocale(pathname: string, to: Locale): string {
  return localePath(to, stripLocale(pathname).path);
}
