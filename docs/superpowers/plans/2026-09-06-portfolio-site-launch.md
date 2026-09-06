# 4차 계획: 마감 (README 최종, 검색 등록 준비, 미세 마무리, 최종 Lighthouse)

스펙 §13 7단계. 목표: 레포와 사이트를 "지금 이 링크를 보내도 된다"는 상태로 만든다. 코드 변경은 작고, 문서와 체크리스트가 중심이다.
브랜치 `chore/launch` (main `d9c19f7`에서). 각 태스크는 서브에이전트(워크플로우)가 수행하고, 검토 후 컨트롤러가 커밋한다.

## 사실 (작성 근거, 바꾸지 말 것)

- 라이브: https://hello-iam-doik.vercel.app · 레포: https://github.com/LeeDoik/hello-iam-doik · 라이선스: `LICENSE` 파일 참조(내용 그대로 인용).
- 프로젝트 3개: heart-of-steel(코드네임: 태엽새, status archived, Railway 재배포 대기), pixelarious(레포 비공개·라이브만), aetheria-online(보고서 기반 수치). 스크린샷 존재: 태엽새 `02-prison-puzzle@desktop.png`, `03-banner@desktop.png`, `architecture.png`; pixelarious 4장(+sidecar); aetheria `architecture.svg`. `01-title@desktop.png`는 **없다** — README 배너는 `03-banner@desktop.png` 유지.
- `content/experience.yaml`에 `[채워 주세요]` 5곳이 남아 있고 라이브에 그대로 렌더된다 (사용자가 직접 채움). 마감 문서는 이것을 "공유 전 차단 항목"으로 명시한다.
- 스크립트: dev/build/preview/check/lint/format/test/test:watch/test:build/e2e/adr/capture/content:status/fonts:vendor. CI 워크플로우 이름 `ci`(job `verify`), `links`.
- ADR 0001~0010. 0004에 "sample-project → 실제 프로젝트 교체" 개정 있음. 0005·0009에는 아직 sample-project 언급(각각 35행 부근)이 남아 있다.
- Pretendard는 동적 서브셋 92개 woff2를 `public/fonts/pretendard/`에 셀프호스팅하며 `pretendard.css`를 `<link rel=stylesheet>`로 싣는다. 폰트 관련 ADR은 0009(OG)뿐이다.
- Lighthouse CI(treosh, desktop preset, 4 URL) 예산: 카테고리 ≥0.95, LCP 2500, TBT 200, CLS 0.1. 최근 main 통과.
- 환경변수는 현재 없음(`.env.example`). Astro 7은 `astro:env`(`envField`)로 타입 있는 환경변수를 지원한다.

## Task 1 — README 최종본 (docs 에이전트)

`README.md` 전면 개정. 한국어 본문 + 맨 아래 짧은 영어 절(3~5문장).
포함: 한 줄 정의 + 라이브 링크 + CI 배지(`https://github.com/LeeDoik/hello-iam-doik/actions/workflows/ci.yml/badge.svg`), 배너(`03-banner@desktop.png`), "무엇이 들어 있나"(프로젝트 3개 한 줄씩, 라이브/레포 공개 여부 정직하게), 스택 표(Astro 7·React 19 아일랜드·Tailwind 4·TS 6·Vitest·Playwright·Lighthouse CI·Biome; 근거 ADR 번호 링크), 레포 구조 트리(실제 폴더만: content/, src/{components,islands,i18n,layouts,lib,pages,styles}, docs/{adr,superpowers}, scripts/, tests/, public/), 콘텐츠 흐름 3줄, 실행 방법, 품질 게이트(스크립트별 한 줄), 문서 지도(architecture, content-guide, how-this-was-built, launch-checklist, ADR README), 라이선스 한 줄.
금지: 없는 파일·스크립트·수치 언급, 과장 형용사, "AI가 만들었다"를 숨기기(how-this-was-built 링크로 정직하게).

## Task 2 — 문서 정리와 마감 체크리스트 (docs 에이전트)

- `docs/how-this-was-built.md` 확장(40~80행): 실제 절차 — 브레인스토밍 질문 → 설계안 3개·심사 → 스펙(`docs/superpowers/specs/`) → 계획 4개(`docs/superpowers/plans/`) → 태스크별 서브에이전트 구현 + 독립 검토 + 원장(`.superpowers/sdd/progress.md`는 gitignore 여부 확인 후 언급) → 디자인 패스는 워크플로우(감사→3안→심사→구현→다관점 QA). 사람이 결정한 것(테마 다크 우선, 공개 범위, 병합, 사실 표 검토)과 AI가 한 것을 구분. ADR의 "What I learned"는 사람이 쓴다는 관행. 자리표시가 남아 있다는 사실도 숨기지 않는다.
- `docs/architecture.md` 갱신: 디자인 토큰(`src/styles/global.css` 다크 우선, `prefers-color-scheme: light` 전환), 히어로 품질 단계(`decideQuality`: reducedMotion/저장 선호/WebGL 없음/소프트웨어 렌더러/저사양), 배포 푸터(`deploy-cache`), `llms.txt`. 기존 CSP 문장의 "3차 계획에서 검토한다"는 현재 상태(여전히 unsafe-inline 허용, 이유)로 고친다.
- `docs/launch-checklist.md` 신규: (A) 공유 전 차단 — experience 자리표시 5곳, 태엽새 Railway 재배포 후 `pnpm capture heart-of-steel` + `status: live` + `links.live`; (B) 네이버 서치어드바이저 — 사이트 등록 → 소유 확인은 HTML 태그 방식 → 토큰을 Vercel 환경변수 `NAVER_SITE_VERIFICATION`에 넣고 재배포 → 사이트맵 `https://hello-iam-doik.vercel.app/sitemap-index.xml` 제출 → 웹페이지 수집 요청; (C) 구글 서치 콘솔 동일 패턴(`GOOGLE_SITE_VERIFICATION`); (D) 카카오 — 개발자 사이트 공유 디버거(https://developers.kakao.com/tool/debugger/sharing)에서 URL 캐시 초기화, 랜딩·프로젝트·/en/ 각각; (E) 배포 후 확인 — PageSpeed Insights 링크, 푸터 sha, OG 이미지 URL 열기. `docs/content-guide.md`의 "지원 전 수동 체크" 절은 이 파일 링크로 대체.

## Task 3 — 코드 미세 마무리 (code 에이전트)

- `astro.config.mjs`(실제 확장자 확인)에 `env.schema`: `NAVER_SITE_VERIFICATION`, `GOOGLE_SITE_VERIFICATION` 둘 다 `envField.string({ context: "server", access: "public", optional: true })`. `src/layouts/Base.astro`에서 `astro:env/server`로 읽어 값이 있을 때만 `<meta name="naver-site-verification">` / `<meta name="google-site-verification">` 렌더. `.env.example`에 두 변수와 한 줄 설명. 단위 테스트가 어려우면 `pnpm build` 시 환경변수 넣고 `dist/index.html`에 메타가 있는지 셸로 확인하고 결과를 보고에 적는다.
- `src/components/Header.astro` nav 링크 탭 타겟 44px: 링크에 `inline-flex min-h-11 items-center` (헤더 `min-h-16` 유지, 모바일 줄바꿈 시 `gap-y-0`으로 높이 폭주 방지).
- `src/pages/[...lang]/index.astro` `#projects` 섹션 리듬을 다른 섹션과 같은 규칙으로(`py-16 md:py-24`). 히어로와의 간격이 무너지지 않는지 빌드 후 스크린샷(Playwright)으로 확인.
- ADR 개정(본문 수정 금지, 끝에 `## Amendment 2026-09-06` 추가): 0005 — 예시 slug는 당시 샘플이며 현재는 `pnpm capture pixelarious --stale 90`처럼 실제 slug를 쓴다; 0009 — 폰트 프리로드를 하지 않는 결정 기록: 동적 서브셋 92개 중 어떤 파일이 필요한지는 브라우저가 unicode-range로 고르므로 프리로드는 불필요한 파일까지 받게 하고, Lighthouse 예산이 이미 통과한다는 근거. `dist/og/projects/sample-project` 언급도 현재 slug로 정정하는 개정문 한 줄.
- `docs/adr/README.md`의 "0005, 0008, 0009는 예약" 문장을 과거형으로(이미 작성됨).

## Task 4 — 검증과 배포 (컨트롤러)

`pnpm check && pnpm lint && pnpm test && pnpm test:build && pnpm build && pnpm e2e` 통과 → PR → CI(ci + links) 초록 → main 병합 → 배포 확인(푸터 sha) → PageSpeed Insights API로 라이브 `/`, `/en/`, `/projects/heart-of-steel/` 모바일·데스크톱 점수 기록(원장에 수치) → 사용자 안내: 네이버·구글 토큰 발급과 카카오 캐시 초기화는 사용자 계정이 필요하므로 체크리스트 (B)(C)(D)를 따라 직접 수행.

## 완료 기준

- README만 읽어도 무엇을 어떻게 왜 만들었는지, 어디에 더 자세한 문서가 있는지 알 수 있다.
- 검색 엔진 소유 확인 토큰이 코드 수정 없이 환경변수만으로 붙는다.
- 남은 사용자 작업이 `docs/launch-checklist.md`에 순서대로 적혀 있다.
- CI·Lighthouse 예산 통과, 라이브 PSI 수치가 원장에 있다.
