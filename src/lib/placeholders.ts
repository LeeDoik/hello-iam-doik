import type { ExperienceData, Localized } from "../content/schemas";

/** "[채워 주세요: …]" / "[Fill in: …]" 자리표시자. 화면에 절대 내보내지 않는다 (content-contract.test.ts가 지킨다). */
export const PLACEHOLDER_RE = /^\[(채워 주세요|Fill in)/;

export function isPlaceholder(v: Localized): boolean {
  return PLACEHOLDER_RE.test(v.ko) || PLACEHOLDER_RE.test(v.en);
}

/** 자리표시자 항목/불릿은 걸러낸다: 채워지지 않은 학력이 "[채워 주세요]"로 렌더되는 것을 막는다. */
export function withoutPlaceholders(items: ExperienceData[]): ExperienceData[] {
  return items
    .filter((e) => !isPlaceholder(e.org))
    .map((e) => ({ ...e, bullets: e.bullets.filter((b) => !isPlaceholder(b)) }));
}
