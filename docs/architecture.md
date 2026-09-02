# Architecture

```
content/  ──(Zod: src/content/schemas.ts)──▶  src/content.config.ts  ──▶  src/lib/content.ts  ──▶  src/pages/[...lang]/*  ──▶  dist/
  YAML + Markdown                          컬렉션 정의                   뷰 객체(ProjectView)      템플릿 한 벌 → / 와 /en/
```

- 클라이언트 JS가 있는 곳: `src/islands/` (ProjectFilter). 나머지는 HTML.
- 로케일: URL이 유일한 신호. `src/i18n/locales.ts`, `src/lib/urls.ts`. 문자열은 `src/i18n/ui.ts`.
- SEO 메타 전부: `src/layouts/Base.astro` + `src/lib/seo.ts`.
- 테스트: `src/lib/*.test.ts`(순수 로직·콘텐츠 계약), `tests/e2e/*`(빌드 결과).
- AI seam: 없음이 곧 가드레일. 절차는 ADR-0002.
- 보안 헤더(`vercel.json`)의 CSP는 `'unsafe-inline'`을 허용한다: 이력서 인쇄 버튼의 인라인 스크립트와 Tailwind 인라인 스타일 때문이며, 2차 계획에서 해시 기반으로 좁히는 것을 검토한다.
