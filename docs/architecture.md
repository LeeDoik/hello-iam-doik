# Architecture

```
content/  ──(Zod: src/content/schemas.ts)──▶  src/content.config.ts  ──▶  src/lib/content.ts  ──▶  src/pages/[...lang]/*  ──▶  dist/
  YAML + Markdown                          컬렉션 정의                   뷰 객체(ProjectView)      템플릿 한 벌 → / 와 /en/
```

- 클라이언트 JS가 있는 곳: `src/islands/` 세 개뿐이다. `ProjectFilter`(랜딩, `client:visible`), `Hero3D`(랜딩, `client:visible`), `QualityToggle`(히어로 안, `client:idle`, 랜딩만). 랜딩 밖의 페이지는 아일랜드 스크립트를 싣지 않는다. 나머지는 HTML. 비용은 ADR-0010에, 예산은 `tests/build/js-budget.test.ts`에 있다(gzip 총 250KB, 청크 200KB, 히어로 청크는 랜딩 HTML에서만 참조).
- 로케일: URL이 유일한 신호. `src/i18n/locales.ts`, `src/lib/urls.ts`. 문자열은 `src/i18n/ui.ts`.
- SEO 메타 전부: `src/layouts/Base.astro` + `src/lib/seo.ts` (canonical, hreflang, OG, JSON-LD, `<link rel="sitemap">`). 검색 엔진 소유 확인 메타(`naver-site-verification`, `google-site-verification`)는 `astro.config.ts`의 `env.schema`에 선언된 `NAVER_SITE_VERIFICATION`, `GOOGLE_SITE_VERIFICATION`(`astro:env/server`)이 설정된 빌드에서만 렌더한다. 값을 넣는 절차는 `docs/launch-checklist.md`.
- 디자인 토큰: `src/styles/global.css` 한 파일. Tailwind 4의 `@theme`에 색(`paper`, `paper-2`, `ink`, `ink-2`, `line`, `accent`, `accent-ink`), 반경 하나(`radius-sm`), 글자 크기별 행간을 정의한다. 기본값이 다크이고, `@media (prefers-color-scheme: light)`에서 같은 커스텀 프로퍼티를 라이트 팔레트로 재정의한다. 테마 토글 UI는 없고 OS 설정을 따른다. 팔레트별 대비 수치는 파일 상단 주석에 있다. 히어로 셰이더는 CSS 필터 없이 `uLight` 유니폼으로 라이트 팔레트를 직접 그리고, 캔버스가 꺼진 상태는 `.hero-ground` 그라디언트가 받친다. 본문은 `html`에 `word-break: keep-all`(어절 단위 줄바꿈)과 `overflow-wrap: anywhere`를 둔다. 코드 블록은 Shiki 듀얼 테마(`--shiki-dark`/`--shiki-light`)를 팔레트별로 고르고 배경은 `paper-2`로 통일한다.
- 히어로 품질 단계: `src/lib/motion-prefs.ts`의 `decideQuality`가 `off | low | high`를 정한다. 순서는 `prefers-reduced-motion`이면 무조건 off → localStorage(`hero-quality`)에 저장된 사용자 선택 → WebGL 없음이면 off → 소프트웨어 렌더러(SwiftShader, llvmpipe 등, `WEBGL_debug_renderer_info`로 판별)면 off → 코어 4개 이하 또는 메모리 4GB 이하면 low, 아니면 high. low는 렌더 스케일 0.5에 약 30fps, high는 1에 약 60fps. `src/lib/hero-scene.ts`(three.js 셰이더 평면)는 `Hero3D.tsx`가 동적 import하므로 off면 내려받지 않고, 씬 생성이나 모듈 로드가 실패하면 off로 내려간다. 탭이 숨겨지거나 캔버스가 화면 밖이면 프레임을 건너뛴다.
- 배포 푸터: `src/lib/deploy.ts`가 `VERCEL_GIT_COMMIT_SHA`(없으면 `git rev-parse HEAD`)와 빌드 날짜를 읽고, `src/lib/deploy-cache.ts`가 빌드당 한 번만 계산해 모든 페이지의 `Footer.astro`에 짧은 sha와 커밋 링크로 찍는다. 배포가 됐는지는 이 sha로 확인한다.
- `llms.txt`: `src/pages/llms.txt.ts`가 프로필, 프로젝트, ADR 목록을 영어 URL 기준으로 `text/plain`에 쓴다(`src/lib/llms.ts`).
- 테스트: `src/lib/*.test.ts`(순수 로직, 콘텐츠 계약), `tests/build/`(빌드 산출물 예산), `tests/e2e/*`(preview 서버 대상 smoke, SEO, 사이트맵 전 페이지 axe).
- AI seam: 없음이 곧 가드레일. 절차는 ADR-0002.
- 보안 헤더(`vercel.json`)의 CSP는 `script-src`와 `style-src`에 `'unsafe-inline'`을 여전히 허용한다. 이유: Astro가 아일랜드 하이드레이션 로더(`client:idle`, `client:visible`)와 `astro-island{display:contents}` 스타일, 그리고 이력서 인쇄 버튼처럼 작은 `<script>`를 HTML에 인라인으로 내보내며, 정적 호스팅이라 요청마다 nonce를 붙일 서버가 없다. 해시 목록으로 대체하면 Astro 업그레이드마다 깨질 수 있어 4차 계획에서도 그대로 두었다. 다시 볼 조건은 Astro가 인라인 없이 아일랜드를 싣는 옵션을 제공하거나, AI seam이 열려 서버가 생길 때다.
- OG 이미지: `src/pages/og/[...path].png.ts`가 콘텐츠 컬렉션에서 페이지마다(랜딩 + 프로젝트 × 로케일) 정적 PNG를 렌더한다.
- 스크린샷: `scripts/capture-screens.ts`(`pnpm capture`)가 `capture.yaml`을 읽어 실제 사이트를 캡처하고 sidecar로 stale 여부를 추적한다.
- 폰트: Pretendard 동적 서브셋 woff2 92개를 `public/fonts/pretendard/`에 셀프호스팅한다. `pretendard.css`의 `@font-face` 92개는 `Base.astro`가 `?raw`로 읽어 `<style>`로 인라인하고, Tailwind 결과 CSS도 `build.inlineStylesheets: "always"`로 인라인해 렌더 차단 요청이 0개다(ADR-0011). `unicode-range`로 브라우저가 필요한 파일만 고르므로 프리로드는 하지 않는다(ADR-0009 개정).
