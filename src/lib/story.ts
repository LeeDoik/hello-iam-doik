import type { Locale } from "../i18n/locales";
import { t } from "../i18n/ui";

export const STORY_SECTIONS = ["problem", "approach", "result", "learned"] as const;

export function requiredHeadings(locale: Locale): string[] {
  return STORY_SECTIONS.map((s) => t(locale, `story.${s}`));
}

/** 본문에서 빠진 H2 제목을 필수 순서대로 반환. 빈 배열이면 통과. */
export function missingHeadings(markdown: string, locale: Locale): string[] {
  const h2 = new Set(
    markdown
      .split(/\r?\n/)
      .map((line) => /^##\s+(.+?)\s*$/.exec(line)?.[1])
      .filter((x): x is string => x !== undefined),
  );
  return requiredHeadings(locale).filter((h) => !h2.has(h));
}
