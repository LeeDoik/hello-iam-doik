# Hello, I am Doik

[![ci](https://github.com/LeeDoik/hello-iam-doik/actions/workflows/ci.yml/badge.svg)](https://github.com/LeeDoik/hello-iam-doik/actions/workflows/ci.yml)

웹·AI 개발자 이도익의 포트폴리오 사이트. Astro로 만든 완전 정적 사이트이며, 한국어(`/`)와 영어(`/en/`)를 템플릿 한 벌로 빌드한다.

- 라이브: https://hello-iam-doik.vercel.app
- 레포: https://github.com/LeeDoik/hello-iam-doik

![코드네임: 태엽새 타이틀 배너](content/projects/heart-of-steel/screens/03-banner@desktop.png)
_코드네임: 태엽새의 타이틀 배너_

## 무엇이 들어 있나

프로젝트 3개의 케이스 스터디, 이력서(`/resume/`), 결정 기록(`/colophon/`), 그리고 `/llms.txt`.

| 프로젝트 | 한 줄 | 공개 상태 |
|---|---|---|
| 코드네임: 태엽새 · HEART OF STEEL | 자유 대화로 동료를 찾고 신분을 위조해 탈출하는 AI 잠입 게임. 클리어 판정을 LLM이 한다 (2인, Phaser 3 + Express 5) | 레포 공개, 데모 영상 있음. 라이브 없음(archived, Railway 재배포 대기) |
| PIXELARIOUS | 직접 만든 Godot 게임을 브라우저에서 플레이하는 1인 픽셀 아케이드 (Next.js) | 라이브 공개(https://neo-kido.vercel.app), 레포 비공개 |
| Aetheria Online | IOCP 기반 미니 MMORPG 서버. 단일 머신에서 10,000 동접 부하 테스트 (C++) | 레포 공개, 라이브 없음(archived) |

프로젝트 페이지의 수치에는 측정 방법이 붙고, 공개 레포나 보고서가 있는 경우 근거 링크도 붙는다. `content/experience.yaml`에는 `[채워 주세요]` 자리표시 5곳이 아직 남아 있고 라이브에도 그대로 보인다. 공유 전에 채워야 할 항목은 [docs/launch-checklist.md](docs/launch-checklist.md)에 있다.

## 스택

| 계층 | 선택 | 근거 |
|---|---|---|
| 프레임워크 | Astro 7 (정적 출력, 서버 어댑터 없음) | [ADR-0001](docs/adr/0001-astro-over-nextjs.md), [ADR-0002](docs/adr/0002-static-only-and-the-ai-seam.md) |
| i18n | Astro 내장 라우팅. `/`는 한국어, `/en/`은 영어 | [ADR-0003](docs/adr/0003-korean-unprefixed-english-prefixed-one-template-set.md) |
| 콘텐츠 | content collections + Zod. `content/`의 YAML(사실)과 Markdown(글) | [ADR-0004](docs/adr/0004-content-model-facts-strings-prose.md) |
| 인터랙션 | React 19 아일랜드 3개 (ProjectFilter, QualityToggle, Hero3D) | [ADR-0010](docs/adr/0010-what-react-islands-cost.md), [ADR-0008](docs/adr/0008-hero-only-3d-with-fallbacks.md) |
| 스타일 | Tailwind 4. 토큰은 `src/styles/global.css` 한 파일 | [docs/architecture.md](docs/architecture.md) |
| 타입·린트 | TypeScript 6 + `astro check`, Biome 2 + Prettier(.astro만) | [ADR-0006](docs/adr/0006-tooling-biome-prettier-ts6.md) |
| 테스트 | Vitest(콘텐츠 계약, 순수 로직), Playwright + axe(smoke, a11y, SEO) | [스펙 §2](docs/superpowers/specs/2026-09-02-portfolio-site-design.md), 게이트 방침은 [ADR-0007](docs/adr/0007-ci-is-the-gate-one-local-hook.md) |
| 성능 게이트 | Lighthouse CI(카테고리 0.95 이상, LCP 2.5s, TBT 200ms, CLS 0.1) + 클라이언트 JS 예산 테스트 | [ADR-0008](docs/adr/0008-hero-only-3d-with-fallbacks.md) |
| 자산 | 스크린샷 캡처 스크립트, 빌드 시 프로젝트별 OG 이미지 | [ADR-0005](docs/adr/0005-screenshot-pipeline-in-repo.md), [ADR-0009](docs/adr/0009-per-project-og-images-at-build.md) |

## 레포 구조

```
content/            프로젝트·프로필·경력·스킬 데이터 (YAML + Markdown + screens/)
src/
  components/       Astro 컴포넌트. 자체 클라이언트 JS는 없고, Header가 QualityToggle 아일랜드를 `client:idle`로 싣는다
  islands/          React 아일랜드 3개
  i18n/             로케일 정의와 UI 문자열 사전
  layouts/          Base.astro (메타, hreflang, OG, JSON-LD)
  lib/              순수 로직과 그 테스트 (*.test.ts)
  pages/            [...lang]/ 템플릿 한 벌, og/ 이미지 라우트, llms.txt
  styles/           global.css (디자인 토큰)
docs/
  adr/              결정 기록 0001~0010. /colophon/에 그대로 렌더
  superpowers/      설계 스펙 1개와 구현 계획 4개
scripts/            adr, capture, content:status, fonts:vendor
tests/              build/ (JS 예산), e2e/ (Playwright)
public/             favicon, robots.txt, 셀프호스팅 Pretendard 서브셋
```

## 콘텐츠 흐름

1. `content/projects/<slug>/`에 `meta.yaml`(사실), `ko.md`와 `en.md`(글), `screens/`를 둔다.
2. 빌드 시 `src/content/schemas.ts`의 Zod 스키마가 검증한다. 누락 필드나 없는 이미지는 빌드 실패다.
3. `src/lib/content.ts`가 뷰 객체로 바꾸고, `src/pages/[...lang]/`의 템플릿 한 벌이 `/`와 `/en/`을 만든다. 절차는 [docs/content-guide.md](docs/content-guide.md).

## 실행

Node 24(`.nvmrc`), pnpm 10(`packageManager`). 환경변수 없이 빌드된다.

```bash
corepack enable && pnpm install
pnpm dev                     # http://localhost:4321
pnpm build && pnpm preview
```

## 품질 게이트

| 명령 | 검사 |
|---|---|
| `pnpm check` | `astro check` 타입 검사 (.astro, .ts) |
| `pnpm lint` | Biome + Prettier(.astro) |
| `pnpm test` | Vitest. 콘텐츠 계약, i18n 키, URL·날짜·필터 같은 순수 로직 |
| `pnpm build` | Astro 빌드. 스키마 위반이면 여기서 실패 |
| `pnpm test:build` | 빌드 후 `dist/_astro` gzip 예산(총 250KB, 청크 200KB)과 히어로 청크가 랜딩에만 실리는지 |
| `pnpm e2e` | Playwright. 로케일 토글, 필터, llms.txt, 히어로 폴백, canonical/hreflang, OG PNG, 사이트맵 전 페이지 axe |
| `pnpm capture <slug>` | 프로젝트 스크린샷 재캡처. sidecar JSON으로 stale 판정 (`--stale <days>`) |
| `pnpm content:status` | 프로젝트별 콘텐츠 누락 표 |
| `pnpm adr "제목"` | 새 ADR 파일 생성 |
| `pnpm fonts:vendor` | Pretendard 동적 서브셋 92개와 `pretendard.css`를 `public/fonts/pretendard/`에, OG 렌더용 woff 2개를 `src/assets/fonts/og/`에 내려받기 |

CI(`ci` 워크플로우)가 PR과 main 푸시마다 check → lint → test → build → test:build → Lighthouse CI → e2e → gitleaks 순서로 돌고, PR에서는 commitlint까지 본다. `links` 워크플로우는 매주, 그리고 `content/**`를 건드리는 PR마다 lychee로 링크를 검사한다. 로컬 훅은 commit-msg 하나뿐이다.

## 문서 지도

- [docs/architecture.md](docs/architecture.md): 데이터 흐름, 아일랜드, 디자인 토큰, 히어로 품질 단계, CSP
- [docs/content-guide.md](docs/content-guide.md): 프로젝트 추가 절차
- [docs/how-this-was-built.md](docs/how-this-was-built.md): 제작 절차와 AI 활용 범위. 이 사이트는 Claude Code와 함께 만들었다
- [docs/launch-checklist.md](docs/launch-checklist.md): 공유 전 차단 항목, 검색 엔진 등록, 카카오 캐시, 배포 후 확인
- [docs/adr/README.md](docs/adr/README.md): ADR 규칙과 템플릿

## 라이선스

MIT. [LICENSE](LICENSE) 참조.

## English

This is the source of my portfolio site, built with Astro 7 as a fully static site that serves Korean at `/` and English at `/en/` from one set of templates. Content lives in `content/` as YAML and Markdown and is validated by Zod at build time, so a missing field or image fails the build rather than the live site. The main stack choices (framework, static output, i18n, content model, screenshot pipeline, tooling, CI, hero 3D, OG images, islands) each have a recorded reason in `docs/adr/`, which the site also renders at `/colophon/`; the full per-dependency reasoning table is in `docs/superpowers/specs/`. The site was built together with Claude Code; `docs/how-this-was-built.md` says what the AI did and what I decided. MIT licensed.
