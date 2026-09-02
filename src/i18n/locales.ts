export const LOCALES = ["ko", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ko";
export const LANG_TAG: Record<Locale, string> = { ko: "ko-KR", en: "en-US" };

export function isLocale(x: unknown): x is Locale {
  return typeof x === "string" && (LOCALES as readonly string[]).includes(x);
}

/** `[...lang]` 라우트 파라미터를 로케일로. undefined = 접두 없는 기본 로케일. */
export function localeFromParam(param: string | undefined): Locale {
  if (param === undefined) return DEFAULT_LOCALE;
  if (isLocale(param) && param !== DEFAULT_LOCALE) return param;
  throw new Error(`Unknown locale segment: ${param}`);
}

export function otherLocale(l: Locale): Locale {
  return l === "ko" ? "en" : "ko";
}

/** 모든 [...lang] 페이지의 getStaticPaths가 쓰는 공통 목록. */
export function localeStaticPaths(): { params: { lang: string | undefined } }[] {
  return LOCALES.map((l) => ({ params: { lang: l === DEFAULT_LOCALE ? undefined : l } }));
}
