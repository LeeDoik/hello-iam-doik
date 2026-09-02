# 포트폴리오 사이트 설계 스펙

- 날짜: 2026-09-02
- 상태: 사용자 승인된 설계를 문서화한 것. 구현 계획(plan)의 입력.
- 배경: 3개 설계안을 2명의 심사(멘토 관점, 국내 시니어 FE 면접관 관점)가 평가해 "Fewest Moving Parts(Astro 7)"안이 만장일치로 선정됨. 심사에서 나온 이식 아이디어를 반영한 결과가 이 문서다.

## 1. 목표와 제약

**목표.** 웹·AI 개발자 취업용 개인 포트폴리오 랜딩 사이트. 동시에 사용자가 각 기술 결정의 "왜"를 배우는 학습 프로젝트. 공개 GitHub 레포 자체가 면접관이 읽는 포트폴리오의 일부다.

**확정된 제약 (재논의 금지).**

| 항목 | 결정 |
|---|---|
| 렌더링 | 완전 정적. 서버 코드·DB·인증 없음. AI 채팅은 나중에 붙일 자리(seam)만 둠 |
| 언어 | 한국어 기본(`/`), 영어 토글(`/en/`) |
| 콘텐츠 원천 | 사용자의 GitHub 레포(README·코드·커밋) + Claude가 캡처하는 스크린샷. 이력서 PDF 없음 |
| 배포 | Vercel Hobby. 레포 공개 |
| 구조 | 콘텐츠와 표현 분리, 스키마 검증, 작은 단위, 테스트를 최우선 |
| 3D/모션 | 히어로 1곳에만 Three.js 아일랜드. 나머지는 HTML/CSS. 저사양·감속모션 폴백 필수 |
| 개발 환경 | Windows 11, PowerShell/Git Bash, Node 24, pnpm |

**성공 기준.**
- 프로젝트 추가 = `content/projects/<slug>/` 폴더 하나 편집 → `pnpm build` → push.
- 콘텐츠 오류(누락 필드, 없는 이미지, 영어 UI 문자열 누락)는 라이브 사이트가 아니라 빌드/타입체크에서 실패한다.
- 면접관이 레포를 5분 안에 읽을 수 있고, 모든 의존성에 한 줄 이유가 있으며, 결정마다 ADR이 있다.
- Lighthouse 카테고리 performance/accessibility/best-practices/seo 각 95 이상, 예산 LCP ≤ 2.5s, TBT ≤ 200ms, CLS ≤ 0.1.
- 2~3주 파트타임(약 30~45시간)에 사용자가 전부 설명할 수 있는 상태로 완성.

## 2. 기술 스택과 근거

각 항목은 "무엇 / 왜 / 기각한 대안" 형식. 이 표가 ADR의 초안이다.

| 계층 | 선택 (버전, 2026-09-02 기준) | 왜 | 기각한 대안 |
|---|---|---|---|
| 프레임워크 | Astro 7.2.x | 정적 HTML이 기본, JS는 컴포넌트 단위 opt-in. i18n 라우팅·Zod 콘텐츠 컬렉션·이미지 최적화·사이트맵이 내장이라 부품 수가 최소. AI seam이 파일 하나(`prerender = false`) | Next.js 16 static export: 콘텐츠 레이어·i18n 라이브러리·sharp 스크립트·루트 리다이렉트가 추가로 필요. 키워드 손실은 React 아일랜드 + ADR-0001로 상쇄 |
| 인터랙티브 | React 19.2 + @astrojs/react | 국내 JD가 요구하는 키워드. 클라이언트 상태가 필요한 것만 `src/islands/`에 두고 `client:visible`로 마운트 | React 없이 vanilla script: 시장이 묻는 스킬을 숨기고 향후 채팅 UI가 재작성됨 |
| 언어 | TypeScript 6.0.x + @astrojs/check | `astro check`가 .astro/.ts 전체를 타입검사. TS 7은 @astrojs/check peer 범위 밖이라 보류(ADR에 업그레이드 조건 기록) | TS 7.0 |
| 콘텐츠 | Astro content collections + Zod 4(astro/zod). YAML(사실) + Markdown(글) | 콘텐츠는 스키마가 있는 데이터. 빌드 시 검증 + 타입 생성. MDX 불필요(제목·코드블록·이미지만 씀) | content-collections/Velite(Next 전용), @astrojs/mdx(쓰는 페이지 없음) |
| i18n | Astro 내장 라우팅 + `src/i18n/ui.ts` 딕셔너리 | 로케일 2개, 복수형·ICU 불필요. URL 구조와 문자열 조회는 별개 문제이고 둘 다 타입 시스템으로 해결 | Paraglide(컴파일 단계 추가), next-intl(Next 전용) |
| 이미지 | astro:assets `<Picture>` (sharp) | `image()` 스키마 헬퍼로 존재 검증, 빌드 시 avif/webp 반응형 생성. Vercel 이미지 변환 쿼터 0 사용 | 별도 sharp 스크립트, Vercel 런타임 이미지 최적화 |
| 스타일 | Tailwind 4.3 + @tailwindcss/vite | CSS-first 설정, `@theme` 토큰 한 파일. 디자인 변경은 `src/styles/global.css`와 컴포넌트 클래스만 건드림 | scoped CSS만, shadcn(컨트롤 3개짜리 사이트에 과함) |
| 3D 히어로 | three (최신 r-릴리스, 시작 시 `pnpm view three version`으로 고정) + 얇은 React 아일랜드 | 레퍼런스 3사이트 공통 기술. 히어로 1곳 한정, 나머지는 CSS 전환 | GSAP(스크롤 연동은 IntersectionObserver + CSS로 충분), R3F(래퍼 하나로 히어로 하나 만들기엔 과함) |
| SEO | @astrojs/sitemap(i18n) + Base.astro의 hreflang/canonical/OG/JSON-LD | 검색엔진·카톡·슬랙 미리보기가 읽는 3가지를 한 레이아웃에서 강제 | astro-seo류 패키지 |
| 린트/포맷 | Biome 2.5 (ts/tsx/json/css) + Prettier + prettier-plugin-astro (.astro만) | 단일 바이너리, TS 버전과 결합 없음. Biome의 .astro 포맷은 실험 단계라 Prettier가 .astro 담당. 확장자로 분리해 충돌 없음 | ESLint + typescript-eslint + plugin-astro |
| 단위 테스트 | Vitest 4.1 | 콘텐츠 계약 테스트(§7). 스키마를 함수로 export해 Astro 없이 raw YAML에 실행 | Astro Container API(실험) |
| E2E/a11y/캡처 | @playwright/test 1.62 + @axe-core/playwright | 한 도구로 smoke, axe, 스크린샷 캡처 3가지. Chromium만 | @playwright/cli(재현 불가), Cypress |
| CI | GitHub Actions ci.yml + links.yml, treosh/lighthouse-ci-action, lycheeverse/lychee-action | CI가 단일 게이트. Lighthouse·링크체커는 npm 의존성이 아닌 Action | Unlighthouse, Vercel Checks |
| 패키지 매니저 | pnpm 10.x (`packageManager` 고정), Node 24 (`.nvmrc`, `engines`, `.npmrc engine-strict`) | Vercel이 lockfile v9로 자동 감지. `pnpm-workspace.yaml`에 `onlyBuiltDependencies: [sharp, esbuild]` | pnpm 11(Vercel Corepack 환경변수 필요), pnpm 12(출시 1주) |
| 호스팅 | Vercel Hobby, Astro 프리셋, 어댑터 없음 | 어댑터 부재 자체가 "서버 코드 금지" 가드레일. 서버 코드가 들어오면 빌드가 실패 | 미리 @astrojs/vercel 설치 |
| 결정 기록 | MADR 4.0 minimal, `docs/adr/`, `/colophon/`에 렌더 | 같은 파일이 레포와 사이트에 쓰여 복사 드리프트 없음 | 전체 MADR, 외부 위키 |

버전은 프로젝트 시작 시점에 `pnpm view <pkg> version`으로 재확인한다.

## 3. 레포 구조

```
hello-iam-doik/
├─ .github/
│  ├─ workflows/
│  │  ├─ ci.yml                 # install → check → lint → test → build → e2e(smoke+axe) → lighthouse → gitleaks
│  │  └─ links.yml              # 주간 lychee: 죽은 데모/레포 링크 실패
│  ├─ dependabot.yml            # 주간, minor/patch 그룹화
│  └─ PULL_REQUEST_TEMPLATE.md  # ADR 필요? ko+en 갱신? 스크린샷 재캡처?
├─ content/                     # 콘텐츠를 편집하는 유일한 장소. 코드 없음
│  ├─ profile.yaml
│  ├─ skills.yaml
│  ├─ experience.yaml
│  └─ projects/<slug>/
│     ├─ meta.yaml              # 사실 + {ko,en} 한 줄 문자열 + 지표 + ai 블록
│     ├─ ko.md                  # 필수. ## 문제 / ## 접근 / ## 결과 / ## 배운 점
│     ├─ en.md                  # 선택. 없으면 /en/에서 한국어 본문 + 안내문
│     ├─ capture.yaml           # 스크린샷 캡처 입력
│     └─ screens/               # NN-<what>@<device>.png, architecture.svg
├─ docs/
│  ├─ adr/                      # README.md(템플릿) + NNNN-slug.md
│  ├─ architecture.md           # content/ → content.config.ts → pages → dist/ 한 장
│  ├─ content-guide.md          # "프로젝트 5분 추가" 체크리스트, 네이버/카카오 사전 점검
│  ├─ how-this-was-built.md     # AI 보조 개발 공개, 무엇을 직접 검토·테스트했는지
│  └─ superpowers/specs/        # 이 문서
├─ public/                      # robots.txt, favicon.svg 만
├─ scripts/
│  ├─ capture-screens.ts        # pnpm capture <slug> [--stale 90]
│  ├─ new-adr.ts                # pnpm adr "title"
│  └─ content-status.ts         # en.md/스크린샷/지표/증거 누락 표
├─ src/
│  ├─ content.config.ts         # 로더 ↔ 스키마 연결. 단일 검증 게이트
│  ├─ content/schemas.ts        # Zod 스키마. image 검증기를 인자로 받는 함수
│  ├─ i18n/{locales.ts, ui.ts}
│  ├─ lib/                      # 순수 함수 + 같은 폴더의 *.test.ts. Astro 전역 사용 금지
│  │  ├─ content.ts             # getProjects(locale), getStory(slug, locale), getAdrs()
│  │  ├─ localized.ts           # pick({ko,en}, locale): 이중언어 객체를 푸는 유일한 지점
│  │  ├─ urls.ts                # localePath, swapLocale, siteUrl
│  │  └─ deploy.ts              # 배포 날짜·커밋 sha (VERCEL_GIT_COMMIT_SHA → git log 폴백)
│  ├─ layouts/Base.astro        # <html lang>, hreflang×3, canonical, OG, JSON-LD, 헤더/푸터
│  ├─ components/               # .astro, 표현 전용, 클라이언트 JS 0
│  ├─ islands/                  # React. 클라이언트 상태가 필요한 것만
│  │  ├─ Hero3D.tsx             # 유일한 Three.js. 폴백 포함
│  │  └─ ProjectFilter.tsx
│  ├─ pages/
│  │  ├─ [...lang]/             # lang=undefined → '/', 'en' → '/en/'. 템플릿 한 벌
│  │  │  ├─ index.astro
│  │  │  ├─ projects/[slug].astro
│  │  │  ├─ resume.astro        # 인쇄용
│  │  │  └─ colophon.astro      # 제작 방식 + ADR 목록
│  │  ├─ og/[...path].png.ts    # 프로젝트별·로케일별 OG 이미지 (satori + resvg)
│  │  └─ llms.txt.ts            # 콘텐츠 컬렉션에서 생성
│  └─ styles/global.css
├─ tests/e2e/{smoke,a11y,seo}.spec.ts
├─ .editorconfig  .gitattributes(eol=lf)  .gitignore  .nvmrc  .npmrc  .env.example
├─ .husky/commit-msg            # commitlint 하나만
├─ astro.config.ts  biome.json  .prettierrc  lighthouserc.json  playwright.config.ts  vitest.config.ts
├─ pnpm-workspace.yaml  package.json  tsconfig.json  vercel.json(보안 헤더만)
├─ CONTRIBUTING.md  LICENSE  README.md
```

경계 규칙:
- `components/`는 `getCollection`을 직접 호출하지 않는다. 페이지가 `lib/content.ts`를 통해 조회해 props로 넘긴다.
- 템플릿은 `{ko, en}` 객체를 직접 열지 않는다. `pick()`만 쓴다.
- `lib/`는 Astro 전역(`Astro.*`, `astro:content`)을 import하지 않는다. 그래야 Vitest에서 그대로 돈다. 단, `lib/content.ts`는 예외적으로 `astro:content`를 쓰므로 그 파일의 순수 로직은 `lib/story.ts` 같은 순수 모듈로 분리해 테스트한다.
- 콘텐츠를 바꾸려고 `content/` 밖을 편집하면 버그다.

## 4. 콘텐츠 모델

원칙: 언어 무관한 **사실**은 YAML에 한 번, 한 줄짜리 **문자열**은 `{ko, en}` 쌍으로 나란히(둘 다 필수), 긴 **글**은 로케일별 Markdown 파일(영어는 지연 허용). 변경 빈도가 다르기 때문에 저장 방식이 다르다.

컬렉션:

| 컬렉션 | 로더 | id |
|---|---|---|
| profile | glob `profile.yaml` | singleton |
| skills | file `skills.yaml` | 항목 id |
| experience | file `experience.yaml` | 항목 id |
| projects | glob `*/meta.yaml` base `./content/projects`, generateId = 폴더명 | slug |
| stories | glob `*/{ko,en}.md` base `./content/projects` | `<slug>/<locale>` |
| adrs | glob `docs/adr/[0-9]*.md` | 파일명 |

`src/content/schemas.ts` (요지, Zod 4):

```ts
export const localized = z.object({ ko: z.string().min(1), en: z.string().min(1) });
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const shortSha = z.string().regex(/^[0-9a-f]{7,40}$/);
const url = z.url();

export const projectSchema = (image: () => z.ZodTypeAny) => z.object({
  title: localized, summary: localized,
  status: z.enum(["live", "archived", "wip"]),
  period: z.object({ from: isoDate, to: isoDate.optional() }),
  role: z.object({ teamSize: z.number().int().min(1), owned: localized }),
  stack: z.array(z.string()).min(1),                       // skills.yaml id, 단위테스트로 교차검증
  links: z.object({
    repo: url, live: url.optional(), demoVideo: url.optional(),
    demoCredentials: z.object({ id: z.string(), password: z.string() }).optional(), // 시드 데모 계정만
    keyCommits: z.array(z.object({ label: localized, url, why: localized })).default([]),
  }),
  metrics: z.array(z.object({
    label: localized, before: z.string().optional(), after: z.string(), unit: z.string().optional(),
    method: localized, evidence: url.optional(),
  })).max(4),
  screens: z.array(z.object({
    src: image(), alt: localized, device: z.enum(["desktop", "mobile"]),
    capturedAt: isoDate, commit: shortSha.optional(),
  })).min(1),
  ai: z.object({
    models: z.array(z.string()).min(1),                     // 정확한 model id
    architecture: image().optional(), promptFile: url.optional(),
    evals: z.array(z.object({
      name: z.string(), metric: z.string(), n: z.number().int(),
      baseline: z.string(), final: z.string(),
      judge: z.enum(["exact", "llm-judge", "human"]),
    })).default([]),
    rejectedTradeoff: z.object({ option: localized, reasonWithNumbers: localized }).optional(),
    costPerRequest: z.string().optional(), latencyP50: z.string().optional(),
    failureModes: z.array(localized).default([]),
  }).optional(),
  featured: z.boolean().default(false), order: z.number().int(), updatedAt: isoDate,
});

export const skillSchema = z.object({
  id: z.string(), name: z.string(),
  group: z.enum(["frontend", "ai", "backend", "tooling"]),
  builtWithIt: localized,                                   // 스킬 주장의 유일한 허용 형식
  projects: z.array(reference("projects")).min(1),          // 프로젝트 없는 스킬은 존재 불가
  since: z.number().int().min(2015),
});
export const experienceSchema = z.object({
  id: z.string(), kind: z.enum(["work", "education", "bootcamp"]),
  org: localized, role: localized, from: isoDate, to: isoDate.optional(),
  bullets: z.array(localized).max(4),
});
export const profileSchema = z.object({
  name: localized, tagline: localized, bio: localized, location: localized,
  email: z.email(), links: z.object({ github: url, linkedin: url.optional() }),
});
```

`image`를 인자로 받는 이유: 빌드에서는 Astro의 `image()`, Vitest에서는 `z.string()`을 주입해 같은 스키마를 두 런타임에서 돌린다.

스크린샷 파일 규칙: `NN-<what>@<device>.png`. 다이어그램은 `architecture.svg`. alt는 meta.yaml에 이중언어로, 파일명에는 넣지 않는다. 원본 PNG를 커밋하되 파일당 1.5MB 초과는 테스트 실패.

## 5. i18n

- 라우팅: `i18n: { defaultLocale: 'ko', locales: ['ko','en'], routing: { prefixDefaultLocale: false } }`. 한국어 `/`, `/projects/<slug>/`, `/resume/`, `/colophon/`. 영어는 `/en/` 접두. 루트 리다이렉트 없음.
- 템플릿 한 벌: `src/pages/[...lang]/`. 각 페이지의 `getStaticPaths()`가 `[{ params: { lang: undefined } }, { params: { lang: 'en' } }]`(프로젝트 페이지는 로케일 × slug 곱)을 반환. `localeFromParam(undefined) → 'ko'`.
- UI 문자열: `ui.ts`에서 `ko`가 원천, `en`은 `satisfies Record<UIKey, string>`. 영어 키 누락은 컴파일 에러.
- 토글: `LanguageToggle.astro`는 `<a href={swapLocale(pathname, other)}>`. JS·쿠키·localStorage 없음. 현재 페이지 유지.
- 메타: Base.astro가 `<html lang>`, canonical(현재 로케일 URL), hreflang ko/en/x-default(→ko), og:locale + alternate, JSON-LD Person(랜딩만)을 출력. 사이트맵은 `i18n` 옵션으로 hreflang 포함.
- 영어 본문 폴백: `getStory(slug,'en')`이 en.md 없으면 한국어 본문 + `isFallback: true`. 페이지는 `/en/projects/<slug>/`에 렌더되고 사실 필드는 전부 영어, 본문 위에 안내문. 한국어는 폴백 불가(ko.md 없으면 빌드 실패). Astro의 `fallback` 옵션은 쓰지 않는다(페이지 누락용이지 본문 누락용이 아님).
- Day-one 스파이크(2시간, 콘텐츠 쓰기 전): (a) `[...lang]` rest 파라미터 + 중첩 동적 세그먼트 + `prefixDefaultLocale: false`, (b) YAML glob 로더 + `generateId`, (c) `content/`가 `src/` 밖일 때 `image()` 해석. 결과를 ADR-0003/0004에 기록. 실패 시 대안: `src/content/`로 이동, 또는 `src/pages/en/` 폴더 미러 + parity 테스트.

## 6. 자산 파이프라인

- `pnpm capture <slug>`: `scripts/capture-screens.ts`가 `capture.yaml`(base URL 또는 `local: {cwd, command, port}`, 선택적 `login`(시드 데모 계정만), `shots[]`)을 읽고 Chromium으로 캡처. 데스크톱 1440×900 @2x, 모바일 iPhone 15 디스크립터, `animations: 'disabled'`, `caret: 'hide'`, `--font-render-hinting=none`.
- 각 PNG 옆에 JSON sidecar(`capturedAt`, `sourceCommit`, `url`, `viewport`, `playwright`) 기록. 단위 테스트가 meta.yaml의 `capturedAt/commit`과 sidecar 일치를 검사.
- `--stale 90`: 90일 넘은 스크린샷 목록.
- 로컬 실행도 라이브 URL도 없는 레포는 Claude가 브라우저로 캡처하되 같은 명명 규칙을 지킨다. 규칙이 계약이고 스크립트는 선호 생산자.
- 최적화는 레포에 없음. `<Picture formats={['avif','webp']} widths={[480,960,1440]}>`가 빌드 시 처리.
- OG 이미지: `src/pages/og/[...path].png.ts`가 satori + resvg로 프로젝트별·로케일별 1200×630 생성. Pretendard 서브셋 woff2를 명시적으로 전달. 랜딩용 ko/en 2장 + 프로젝트별.
- 폰트: Pretendard variable 서브셋 self-host. 한 번의 네트워크 요청.
- 데모 영상은 v1 범위 밖(레포 밖 저장, `links.demoVideo`만 스키마에 존재).

## 7. 품질 게이트

각 도구는 실제로 본 실패 하나를 막는다.

| 도구 | 막는 실패 |
|---|---|
| `astro check` (tsconfig `strictest` + noUnused*) | 없는 콘텐츠 필드 참조, 아일랜드 props 불일치 |
| Biome `ci` / Prettier `--check` (.astro) | "오토 포맷팅을 모르는구나" 판정, 미사용 import, JSX a11y |
| Vitest `src/lib/*.test.ts` | content-parity(ko.md 존재, {ko,en} 양쪽), skills-references(stack ↔ skills.yaml, 스킬→프로젝트), story-headings(H2 4개), screens-size(≤1.5MB), sidecar 일치, urls(swapLocale 왕복), ui-keys(빈 문자열 없음). 스키마는 raw YAML에 직접 실행 |
| Playwright smoke | 두 로케일 루트 렌더, 토글 왕복 시 페이지 유지, 프로젝트 페이지, /resume/ 인쇄 |
| Playwright a11y | 사이트맵의 모든 URL에 axe, serious/critical 실패 (WCAG 2.2 AA, KWCAG 2.2) |
| Playwright seo | 모든 페이지 hreflang 상호참조, canonical이 자기 로케일 URL |
| `pnpm build` | 어댑터 없음 → 서버 코드 빌드 실패. 모든 컬렉션 검증 |
| Lighthouse CI | `/`, `/en/`, 프로젝트 1개×로케일. LCP 2.5s, TBT 200ms, CLS 0.1, 카테고리 ≥95. INP는 필드 지표라 예산에 넣지 않음 |
| lychee (주간 + content/ 변경 PR) | 죽은 데모/레포 링크 |
| gitleaks (CI) + `.env.example` + push protection | 공개 레포 비밀 유출 |
| husky commit-msg + commitlint | 면접관이 읽는 커밋 로그의 형식(Conventional Commits). 유일한 로컬 훅. ADR-0007에 예외 기록 |
| Dependabot 주간 그룹 | TS 6/pnpm 10 고정이 눈에 띄게 낡는 것 |

CI 순서: `install --frozen-lockfile → check → lint → test → build → e2e → lighthouse → gitleaks`. Vercel은 PR마다 프리뷰를 독립 빌드.

수동 체크리스트(`docs/content-guide.md`): 네이버 서치어드바이저 사이트맵 제출, 카카오톡 인앱 브라우저 확인(`dvh/svh`, `100vh` 금지), 카카오 OG 캐시 갱신.

## 8. 페이지와 훅 요소

페이지 4종 × 로케일 2: 랜딩, 프로젝트 케이스 스터디, 인쇄용 이력서, 콜로폰.

랜딩 순서: 히어로(3D) → 프로필 한 줄 → 대표 프로젝트 카드 → "무엇을 만들었는가"로 묶은 스킬 → 경력/교육 → 연락처. 이메일·GitHub 링크는 헤더와 푸터 양쪽에 항상 노출.

| 훅 | 내용 | 우선순위 |
|---|---|---|
| 고정 골격 케이스 스터디 | 요약+지표 → 역할(팀 규모, 내가 맡은 것) → 캡처 날짜 있는 스크린샷 → 문제/접근/결과/배운 점 → 링크(레포, 라이브, 핵심 커밋+이유). 스키마와 헤딩 테스트로 강제 | must |
| 증거 링크 지표 | 지표 최대 4개, `method`(측정 방법) 필수, `evidence` URL 있으면 링크로 | must |
| AI 증거 블록 | model id, 프롬프트 파일 링크, 평가표(n, 판정 방식, baseline→final), 비용/지연, 실패 모드, 기각한 트레이드오프, architecture.svg | must |
| 스킬 = "이걸로 만든 것" | 퍼센트 바 금지. 문장 + 프로젝트 참조 필수 | must |
| 히어로 3D 아일랜드 | §9 | must |
| 프로젝트별 OG 이미지 | §6 | must |
| 배포 푸터 | "Last deployed YYYY-MM-DD · sha" → GitHub 커밋 링크 | must |
| 프로젝트 필터 아일랜드 | 스택 그룹으로 카드 필터, aria-live 카운트, URL 해시에 상태, JS 없이도 전체 카드 표시. Testing Library 테스트 포함 | should |
| 인쇄용 /resume/ | 같은 컬렉션에서 A4 한 장, `@media print`, "PDF로 저장" 버튼. CI에서 Playwright `page.pdf()` 아티팩트 | should |
| 콜로폰 | 제작 방식, AI 보조 공개, ADR 목록 렌더 | should |
| llms.txt | 콘텐츠 컬렉션에서 생성. 향후 채팅의 코퍼스 | should |
| 커맨드 팔레트, 데모 영상, GitHub 잔디 | v1 제외 | 제외 |

## 9. 히어로 3D 아일랜드

레퍼런스(igloo, bruno-simon, samsy)는 모두 Three.js + 스크롤 연동 + rAF 루프이며 둘은 WebGPU를 쓴다. 이 사이트는 **히어로 한 곳**만 가져온다.

- `src/islands/Hero3D.tsx`: three만 사용, `client:visible`. 캔버스는 히어로 영역 배경. 스크롤 진행값(0~1)과 포인터 위치를 uniform으로 넘기는 단순 셰이더/지오메트리 1개. 텍스트는 HTML로 캔버스 위에 올림(접근성·SEO).
- 폴백 3단계: (1) `prefers-reduced-motion: reduce` → 정적 그라디언트, 애니메이션 없음. (2) WebGL 컨텍스트 실패 또는 `navigator.hardwareConcurrency <= 4`·`deviceMemory <= 4` → 저사양 모드(해상도 0.5배, 프레임 30). (3) 사용자 토글(Low/High)을 헤더에 제공, `localStorage`에 기억.
- 예산: 히어로 JS 청크(three 포함) gzip 200KB 이하, 랜딩 총 JS 250KB 이하. Lighthouse 예산에 `resourceSizes: script`로 명시. 화면 밖이면 rAF 정지(IntersectionObserver).
- 로딩: 아일랜드가 뜨기 전에는 CSS 그라디언트가 보이므로 LCP는 텍스트다. 3D는 향상이지 필수가 아니다.
- 나머지 섹션 전환은 CSS(`@starting-style`, `animation-timeline: view()`가 지원되는 브라우저에서만, 아니면 즉시 표시). GSAP 없음.
- 시각 방향(색·형태·타이포)은 별도 디자인 단계에서 정한다. 이 스펙은 구조와 예산만 고정한다.

## 10. AI seam (지연된 결정, ADR-0002에 절차 기록)

현재: `src/pages/api/` 폴더도, 어댑터도 없다. 부재가 가드레일이다.

나중에 붙일 때 순서:
1. `pnpm astro add vercel` → `adapter: vercel()`. `output`은 `'static'` 유지.
2. `src/pages/api/chat.ts` 생성, `export const prerender = false`, `POST`가 스트리밍 응답. 요청 시 `getCollection('projects'|'stories')`로 같은 content/를 지식베이스로 사용.
3. `astro:env`로 `ANTHROPIC_API_KEY`(server, secret) 스키마 선언, Vercel 환경변수 설정, `.env.example` 갱신.
4. `src/islands/Chat.tsx` + `ui.ts`에 `chat.*` 키(타입이 양 언어 강제).
5. e2e(모킹된 /api/chat) + 요청/응답 Zod 테스트 + 랜딩 JS 예산 확인. 요청당 제한(레이트 리밋) 필수.

변하지 않는 것: content/, 스키마, i18n, lib, layouts, components, 기존 페이지, 테스트, CI.

## 11. ADR 목록 (v1)

템플릿: MADR minimal + "Try it(5분 실험)" + "What I learned". `pnpm adr "title"`로 생성. 수정하지 않고 supersede.

| 번호 | 제목 |
|---|---|
| 0001 | Astro over Next.js |
| 0002 | Static only and the AI seam |
| 0003 | Korean unprefixed, English prefixed; one template set |
| 0004 | Content model: facts vs strings vs prose; content/ outside src/ |
| 0005 | Screenshot pipeline in repo with sidecars |
| 0006 | Tooling: Biome + Prettier(.astro), TS 6 pin, deletion triggers |
| 0007 | CI is the gate; the one local hook (commit-msg) |
| 0008 | Hero-only 3D with fallbacks and a JS budget |
| 0009 | Per-project OG images at build |

## 12. 범위 밖 (v1)

커맨드 팔레트, 데모 영상 호스팅, GitHub 활동 위젯, MDX, 세 번째 로케일, 다크 모드 토글(시스템 설정 따름은 포함), 블로그, 서버 기능 일체, Safari/카카오 인앱 자동화 테스트(수동 체크리스트로 대체).

## 13. 구현 단계 (plan의 뼈대)

1. **부트스트랩 + 스파이크**: pnpm/Node 고정, Astro 초기화, §5 스파이크 3건, ADR 0001~0004, CI 골격, git 위생 파일. 성공 기준: 두 로케일 빈 페이지가 빌드·배포됨.
2. **콘텐츠 모델**: schemas.ts, content.config.ts, lib/(pick, urls, story), Vitest 계약 테스트, 샘플 프로젝트 1개.
3. **페이지와 컴포넌트**: Base.astro(SEO 전부), 랜딩, 프로젝트 페이지, resume, colophon, ProjectFilter 아일랜드. e2e smoke/a11y/seo.
4. **자산 파이프라인**: capture 스크립트 + sidecar, OG 엔드포인트, 폰트, Lighthouse 예산.
5. **히어로 3D**: Hero3D 아일랜드 + 폴백 + 예산 검증. ADR-0008.
6. **콘텐츠 채우기**: 사용자 자료·GitHub 레포로 실제 프로젝트 작성, 스크린샷 캡처, 영어 번역.
7. **마감**: README, CONTRIBUTING, content-guide, how-this-was-built, 네이버/카카오 체크리스트, 최종 Lighthouse.

디자인(색·타이포·레이아웃)은 3단계 전에 별도 세션에서 레퍼런스를 바탕으로 정하고, `global.css` 토큰과 컴포넌트 클래스로만 반영한다.
