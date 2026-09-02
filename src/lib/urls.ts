import { DEFAULT_LOCALE, isLocale, type Locale } from "../i18n/locales";

// 사이트 자체의 레포. 콘텐츠가 아니라 코드의 사실이므로 여기 상수로 둔다.
export const REPO_URL = "https://github.com/LeeDoik/hello-iam-doik";

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
