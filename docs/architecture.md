# Architecture

```
content/  ──(Zod: src/content/schemas.ts)──▶  src/content.config.ts  ──▶  src/lib/content.ts  ──▶  src/pages/[...lang]/*  ──▶  dist/
  YAML + Markdown                          컬렉션 정의                   뷰 객체(ProjectView)      템플릿 한 벌 → / 와 /en/
```

- 클라이언트 JS가 있는 곳: `src/islands/` (ProjectFilter, QualityToggle, Hero3D). 나머지는 HTML.
- 로케일: URL이 유일한 신호. `src/i18n/locales.ts`, `src/lib/urls.ts`. 문자열은 `src/i18n/ui.ts`.
- SEO 메타 전부: `src/layouts/Base.astro` + `src/lib/seo.ts`.
- 테스트: `src/lib/*.test.ts`(순수 로직·콘텐츠 계약), `tests/e2e/*`(빌드 결과).
- AI seam: 없음이 곧 가드레일. 절차는 ADR-0002.
- 보안 헤더(`vercel.json`)의 CSP는 `'unsafe-inline'`을 허용한다: 이력서 인쇄 버튼의 인라인 스크립트와 Tailwind 인라인 스타일 때문이며, 3차 계획에서 검토한다.
- OG 이미지: `src/pages/og/[...path].png.ts`가 콘텐츠 컬렉션에서 페이지마다(랜딩 + 프로젝트 × 로케일) 정적 PNG를 렌더한다.
- 스크린샷: `scripts/capture-screens.ts`(`pnpm capture`)가 `capture.yaml`을 읽어 실제 사이트를 캡처하고 sidecar로 stale 여부를 추적한다.
- 히어로 아일랜드(`src/islands/Hero3D`, `QualityToggle`)는 `src/islands/`의 유일한 예외적 무거운 클라이언트 JS이며, `tests/build/js-budget.test.ts`가 청크·총합 예산을 강제한다.
