import type { Localized } from "../content/schemas";
import type { Locale } from "../i18n/locales";

/** {ko,en} 객체를 푸는 유일한 지점. 템플릿은 이 함수만 쓴다. */
export function pick(v: Localized, locale: Locale): string {
  return v[locale];
}
