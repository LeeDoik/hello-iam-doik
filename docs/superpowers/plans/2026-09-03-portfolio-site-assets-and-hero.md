# 포트폴리오 사이트 2차 구현 계획: 자산 파이프라인 + 히어로 3D

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 스펙 §13의 4~5단계. 폰트 self-host, 프로젝트별 OG 이미지, 재현 가능한 스크린샷 캡처 스크립트, Lighthouse 예산 게이트, 히어로 3D 아일랜드(폴백·예산 포함)를 추가하고, 1차 최종 검토에서 미룬 항목(영어 콜로폰 폴백 안내, llms.txt, Biome preset, README 스크린샷)을 정리한다.

**Architecture:** 1차에서 만든 경계는 그대로다. 순수 로직은 `src/lib/`(Vitest), 표현은 `.astro`, 클라이언트 JS는 `src/islands/`. 새로 생기는 것은 빌드 시 실행되는 정적 엔드포인트(`src/pages/og/*.png.ts`, `src/pages/llms.txt.ts`), 레포 안의 스크립트(`scripts/capture-screens.ts`), 두 번째 아일랜드(`Hero3D`), 그리고 빌드 산출물을 검사하는 테스트(`tests/build/`)다. 폰트와 OG용 폰트 파일은 레포에 커밋한다(총 약 4MB).

**Tech Stack (추가분):** satori 0.33.4, @resvg/resvg-js 2.6.2, three 0.185.1 + @types/three 0.185.4, Pretendard 1.3.9(파일만 벤더링, npm 의존성 아님), treosh/lighthouse-ci-action@v12. 기존: Astro 7.2.10, React 19.2.8, Playwright 1.62.1, Vitest 4.1.11, Biome 2.5.11.

**현재 상태 (main `3c3cb98` 기준):** 1차 계획 완료. 라이브: https://hello-iam-doik.vercel.app. 페이지 `/`, `/projects/<slug>/`, `/resume/`, `/colophon/`, `/colophon/<adr-id>/` (ko/en). `Base.astro` props `{ locale, path, title, description, ogImage?, jsonLd? }`이며 `ogImage`가 있을 때만 `og:image`와 `twitter:card=summary_large_image`를 낸다. `src/lib/urls.ts`에 `REPO_URL`, `localePath`, `swapLocale`. `src/i18n/ui.ts`의 `ko`/`en`(`satisfies`), `ui-keys` 테스트가 키 동등성을 강제. 스키마 `screenSchema(image)` = `{ src, alt, device, capturedAt, commit? }`. `content/projects/sample-project/`에 샘플 1개. CI: check → lint → test → build → playwright → e2e → gitleaks → commitlint(봇 제외). 액션 버전: checkout@v7, pnpm/action-setup@v6, setup-node@v7, gitleaks@v3.

## Global Constraints

- 정적 사이트. 어댑터 설치 금지. `src/pages/api/` 만들지 않음. 정적 엔드포인트(`*.png.ts`, `llms.txt.ts`)는 빌드 시 파일로 떨어져야 한다(`prerender` 기본값 true).
- 새 의존성은 이 문서에 적힌 것만, 정확한 버전으로 고정(캐럿 없음): `satori 0.33.4`, `@resvg/resvg-js 2.6.2`, `three 0.185.1`, `@types/three 0.185.4`. `pretendard` npm 패키지는 설치하지 않는다(72MB). 폰트 파일은 jsDelivr에서 한 번 내려받아 커밋한다.
- `src/lib/*.ts`는 `astro:*`와 `Astro` 전역을 import하지 않는다(예외: 기존 `src/lib/content.ts`). 노드 내장 모듈은 `scripts/`와 `tests/build/`에서만, `src/lib/`에서는 순수 함수만.
- `src/components/*.astro`는 `getCollection`/`getEntry`를 호출하지 않는다. `{ko,en}`은 `pick()`으로만 연다. UI 문자열은 `t()`로만. 새 키는 `ko`에 먼저, `en`에 같은 순서로.
- 클라이언트 JS 예산: `dist/_astro/*.js` gzip 합계 250KB 이하, 히어로 청크(three 포함) gzip 200KB 이하. `tests/build/js-budget.test.ts`가 강제한다.
- Lighthouse 예산: LCP ≤ 2500ms, TBT ≤ 200ms, CLS ≤ 0.1, 카테고리 performance/accessibility/best-practices/seo ≥ 0.95. INP는 필드 지표라 넣지 않는다.
- 3D는 `src/islands/Hero3D.tsx` 한 곳. `prefers-reduced-motion: reduce`면 애니메이션 없음. 저사양 감지 시 해상도·프레임 축소. 화면 밖이면 rAF 정지. 텍스트는 HTML로 캔버스 위에 둔다.
- 스크린샷 PNG 1.5MB 이하. 파일명 `NN-<what>@<device>.png`. 각 PNG 옆에 같은 이름의 `.json` sidecar.
- 모든 YAML 날짜·쉼표 포함 문자열은 따옴표로 쓴다(`localized`가 strictObject라 잘못된 키는 빌드 실패).
- ADR 번호: 0005(캡처), 0008(히어로 3D), 0009(OG), 0010(React 아일랜드의 대가). 생성기는 max+1이므로 이 네 개는 파일을 손으로 만든다. 템플릿은 `docs/adr/README.md`. `title`·`date`는 따옴표.
- 커밋: Conventional Commits, 끝에 빈 줄 후 `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. 브랜치 `feat/assets-hero`에서 작업.
- Windows 11, Git Bash. `pnpm e2e`는 `playwright.config.ts`가 `ASTRO_PREVIEW_BACKGROUND=1`을 이미 설정. 첫 `pnpm build`가 드물게 exit 3221226505로 죽으면 한 번 재실행.
- `포트폴리오 참고 자료/`는 읽지 않는다.

---

## File Structure (이 계획이 만드는/바꾸는 파일)

```
public/fonts/pretendard/                       # Task 1: 동적 서브셋 woff2 92개 + css + LICENSE (약 3MB)
src/assets/fonts/og/Pretendard-{Regular,Bold}.woff   # Task 1: satori용 (woff, 각 ~700KB)
scripts/vendor-fonts.ts                        # Task 1: jsDelivr에서 위 파일들을 내려받는 1회성 스크립트
src/lib/og.ts  src/lib/og.test.ts              # Task 2: OG 카드 요소 트리(순수)
src/lib/og-render.ts                           # Task 2: satori+resvg 호출(노드 전용, 엔드포인트만 사용)
src/pages/og/[...path].png.ts                  # Task 2: /og/ko.png, /og/en.png, /og/projects/<slug>/<locale>.png
docs/adr/0009-per-project-og-images-at-build.md
src/content/capture-schema.ts  src/lib/capture.ts  src/lib/capture.test.ts   # Task 3
scripts/capture-screens.ts                     # Task 3: pnpm capture <slug> [--stale N] [--video]
content/projects/sample-project/capture.yaml   # Task 3: 라이브 사이트를 캡처하는 샘플
content/projects/sample-project/screens/01-home@desktop.json               # Task 3: sidecar
docs/adr/0005-screenshot-pipeline-in-repo.md
lighthouserc.json  .github/workflows/ci.yml(수정)  biome.json(수정)        # Task 4
tests/build/js-budget.test.ts  vitest.build.config.ts  package.json(test:build)   # Task 4
src/lib/motion-prefs.ts  src/lib/motion-prefs.test.ts                     # Task 5
src/islands/Hero3D.tsx  src/islands/QualityToggle.tsx  src/islands/QualityToggle.test.tsx   # Task 5
src/lib/hero-scene.ts                          # Task 5: three 장면 생성(브라우저 전용, 아일랜드만 import)
docs/adr/0008-hero-only-3d-with-fallbacks.md  docs/adr/0010-what-react-islands-cost.md
src/pages/llms.txt.ts  src/lib/llms.ts  src/lib/llms.test.ts             # Task 6
src/pages/[...lang]/colophon/[id].astro(수정)  README.md(수정)              # Task 6
```

책임:
- `src/lib/og.ts`: 제목·요약·로케일을 받아 satori 요소 트리를 만든다. 텍스트 자르기 규칙 포함. Vitest.
- `src/lib/og-render.ts`: 폰트 파일을 읽고 satori → resvg → PNG Buffer. 노드 fs 사용. 엔드포인트만 import.
- `src/lib/capture.ts`: capture.yaml 파싱 결과 → 실행 계획(어떤 URL을 어떤 뷰포트로 어디에 저장) + sidecar 생성 + stale 판단. 순수. Vitest.
- `scripts/capture-screens.ts`: Playwright로 실행 계획을 수행. 로컬 서버 기동 옵션.
- `src/lib/motion-prefs.ts`: 입력(감속모션, 코어 수, 메모리, 저장된 선택)→ 품질 등급. 순수. Vitest.
- `src/lib/hero-scene.ts`: three 장면·uniform·리사이즈·dispose. 브라우저 전용. 아일랜드가 마운트/언마운트에서 호출.
- `tests/build/`: `dist/`를 읽는 테스트. `pnpm build` 뒤에 `pnpm test:build`로 실행.

---

### Task 1: Pretendard self-host (동적 서브셋) + OG용 폰트 벤더링

**Files:**
- Create: `scripts/vendor-fonts.ts`, `public/fonts/pretendard/` (스크립트가 채움), `src/assets/fonts/og/Pretendard-Regular.woff`, `src/assets/fonts/og/Pretendard-Bold.woff`, `src/lib/fonts.ts`, `src/lib/fonts.test.ts`
- Modify: `src/layouts/Base.astro`, `src/styles/global.css`, `package.json`, `.gitattributes`

**Interfaces:**
- Produces `src/lib/fonts.ts`:
  - `export const PRETENDARD_VERSION = "1.3.9"`
  - `export const PRETENDARD_CDN = \`https://cdn.jsdelivr.net/npm/pretendard@${PRETENDARD_VERSION}/dist\``
  - `export function subsetCssToLocal(css: string): string` — CSS 안의 `url(./woff2-dynamic-subset/…)`를 `url(/fonts/pretendard/woff2-dynamic-subset/…)`로 바꾼다
  - `export function subsetFileNames(css: string): string[]` — CSS가 참조하는 woff2 파일명 목록(중복 제거, 순서 유지)
- Produces `public/fonts/pretendard/pretendard.css`(변환된 CSS), `public/fonts/pretendard/woff2-dynamic-subset/*.woff2`(92개), `public/fonts/pretendard/LICENSE.txt`.
- `Base.astro` `<head>`에 `<link rel="stylesheet" href="/fonts/pretendard/pretendard.css" />`. `global.css`의 `--font-sans`는 이미 `"Pretendard Variable"`을 첫 후보로 둔다.

- [ ] **Step 1: 실패하는 테스트**

`src/lib/fonts.test.ts`:
```ts
import { describe, expect, test } from "vitest";
import { subsetCssToLocal, subsetFileNames } from "./fonts";

const css = `@font-face{font-family:'Pretendard Variable';src:url(./woff2-dynamic-subset/PretendardVariable.subset.0.woff2) format('woff2-variations');unicode-range:U+f9ca-fa0b;}
@font-face{src:url(./woff2-dynamic-subset/PretendardVariable.subset.1.woff2) format('woff2-variations');}
@font-face{src:url(./woff2-dynamic-subset/PretendardVariable.subset.0.woff2) format('woff2-variations');}`;

describe("subsetFileNames", () => {
  test("lists referenced files once, in order", () => {
    expect(subsetFileNames(css)).toEqual([
      "PretendardVariable.subset.0.woff2",
      "PretendardVariable.subset.1.woff2",
    ]);
  });
});

describe("subsetCssToLocal", () => {
  test("rewrites relative urls to the public path", () => {
    const out = subsetCssToLocal(css);
    expect(out).toContain("url(/fonts/pretendard/woff2-dynamic-subset/PretendardVariable.subset.0.woff2)");
    expect(out).not.toContain("url(./");
  });
});
```

```bash
pnpm test src/lib/fonts.test.ts
```
Expected: FAIL (module not found).

- [ ] **Step 2: 구현 `src/lib/fonts.ts`**

```ts
export const PRETENDARD_VERSION = "1.3.9";
export const PRETENDARD_CDN = `https://cdn.jsdelivr.net/npm/pretendard@${PRETENDARD_VERSION}/dist`;
export const LOCAL_FONT_BASE = "/fonts/pretendard/woff2-dynamic-subset";

const URL_RE = /url\(\.\/woff2-dynamic-subset\/([^)]+\.woff2)\)/g;

export function subsetFileNames(css: string): string[] {
  const seen = new Set<string>();
  for (const m of css.matchAll(URL_RE)) {
    const name = m[1];
    if (name) seen.add(name);
  }
  return [...seen];
}

export function subsetCssToLocal(css: string): string {
  return css.replace(URL_RE, (_, name: string) => `url(${LOCAL_FONT_BASE}/${name})`);
}
```
왜 CSS를 그대로 쓰나: Pretendard 배포본은 한글을 유니코드 범위 92조각으로 나눠 `unicode-range`로 선언한다. 브라우저는 페이지에 실제로 나오는 글자가 속한 조각만 내려받는다. 2MB 변수 폰트 하나를 통째로 받는 대신 보통 100~300KB만 받는다. 이것이 한글 사이트의 LCP를 지키는 표준 기법이다.

```bash
pnpm test src/lib/fonts.test.ts
```
Expected: PASS.

- [ ] **Step 3: 벤더링 스크립트**

`scripts/vendor-fonts.ts`:
```ts
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LOCAL_FONT_BASE, PRETENDARD_CDN, subsetCssToLocal, subsetFileNames } from "../src/lib/fonts";

async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

const publicDir = join(process.cwd(), "public", "fonts", "pretendard");
const subsetDir = join(publicDir, "woff2-dynamic-subset");
const ogDir = join(process.cwd(), "src", "assets", "fonts", "og");
mkdirSync(subsetDir, { recursive: true });
mkdirSync(ogDir, { recursive: true });

const cssUrl = `${PRETENDARD_CDN}/web/variable/pretendardvariable-dynamic-subset.css`;
const css = new TextDecoder().decode(await fetchBytes(cssUrl));
writeFileSync(join(publicDir, "pretendard.css"), subsetCssToLocal(css));
writeFileSync(join(publicDir, "LICENSE.txt"), await fetchBytes(`${PRETENDARD_CDN}/LICENSE.txt`));

const names = subsetFileNames(css);
for (const name of names) {
  writeFileSync(join(subsetDir, name), await fetchBytes(`${PRETENDARD_CDN}/web/variable/woff2-dynamic-subset/${name}`));
}
for (const weight of ["Regular", "Bold"]) {
  writeFileSync(join(ogDir, `Pretendard-${weight}.woff`), await fetchBytes(`${PRETENDARD_CDN}/web/static/woff/Pretendard-${weight}.woff`));
}
console.log(`vendored ${names.length} subset files to ${LOCAL_FONT_BASE}, 2 woff files for OG`);
```
`package.json` scripts: `"fonts:vendor": "tsx scripts/vendor-fonts.ts"`.

```bash
pnpm fonts:vendor && ls public/fonts/pretendard/woff2-dynamic-subset | wc -l && du -sh public/fonts/pretendard src/assets/fonts/og && head -c 300 public/fonts/pretendard/pretendard.css
```
Expected: 92, 약 3MB + 약 1.4MB, CSS 첫 줄에 라이선스 주석.

`.gitattributes`에 추가: `*.woff binary`, `*.woff2 binary`(이미 있으면 생략).

왜 npm 패키지가 아니라 파일을 커밋하나: `pretendard` 패키지는 72MB라 CI마다 설치하기 아깝다. 필요한 4MB만 레포에 두고, 버전과 출처는 `src/lib/fonts.ts` 상수와 이 스크립트가 기록한다. 라이선스는 OFL이라 재배포 가능하며 LICENSE.txt를 함께 둔다.

- [ ] **Step 4: 레이아웃 연결과 확인**

`src/layouts/Base.astro` `<head>`의 `<link rel="icon" …>` 앞에:
```astro
<link rel="stylesheet" href="/fonts/pretendard/pretendard.css" />
```

```bash
pnpm check && pnpm build && ls dist/fonts/pretendard/woff2-dynamic-subset | wc -l && grep -c 'pretendard.css' dist/index.html
```
Expected: 92, 1.

브라우저 확인(선택): `pnpm preview` 후 DevTools Network에서 woff2 요청이 10개 안팎이고 각 수십 KB인지.

- [ ] **Step 5: 게이트와 커밋**

```bash
pnpm format && pnpm lint && pnpm test && pnpm check && pnpm build
git add -A && git commit -m "feat(fonts): self-host pretendard dynamic subset and vendor og fonts"
```

---

### Task 2: 프로젝트별·로케일별 OG 이미지 (satori + resvg)

**Files:**
- Create: `src/lib/og.ts`, `src/lib/og.test.ts`, `src/lib/og-render.ts`, `src/pages/og/[...path].png.ts`, `docs/adr/0009-per-project-og-images-at-build.md`
- Modify: `package.json`, `src/pages/[...lang]/index.astro`, `src/pages/[...lang]/projects/[slug].astro`, `src/lib/seo.ts`, `src/lib/seo.test.ts`, `tests/e2e/seo.spec.ts`

**Interfaces:**
- Produces `src/lib/og.ts` (순수):
  - `export const OG_WIDTH = 1200; export const OG_HEIGHT = 630;`
  - `export type OgInput = { title: string; subtitle: string; locale: Locale; kicker: string }` — kicker는 상단 작은 글자(사이트 이름 또는 "Project")
  - `export function truncate(text: string, max: number): string` — 초과 시 `…`
  - `export function ogElement(input: OgInput): SatoriNode` — JSX 없는 객체 트리. `SatoriNode = { type: string; props: { style?: Record<string, string | number>; children?: SatoriNode | SatoriNode[] | string } }`
- Produces `src/lib/seo.ts`: `export function ogImagePath(locale: Locale, slug?: string): string` — `/og/ko.png`, `/og/projects/<slug>/en.png`; `export function ogImageUrl(site, locale, slug?)` 절대 URL.
- Produces `src/lib/og-render.ts` (노드): `export async function renderOgPng(input: OgInput): Promise<Uint8Array>` — 폰트 파일 로드는 모듈 스코프에서 한 번.
- Produces `src/pages/og/[...path].png.ts`: `getStaticPaths` = `[{ path: "ko" }, { path: "en" }, ...projects×locales("projects/<slug>/<locale>")]`, props로 `OgInput`.
- 페이지: 랜딩은 `ogImage={ogImageUrl(site, locale)}`, 프로젝트는 `ogImage={ogImageUrl(site, locale, slug)}`를 `Base`에 넘긴다.

- [ ] **Step 1: 의존성**

```bash
pnpm add -D satori@0.33.4 @resvg/resvg-js@2.6.2
```
왜 devDependency인가: 둘 다 빌드 시에만 실행된다. 배포 산출물에는 PNG만 남는다. `@resvg/resvg-js`는 네이티브 바이너리라 `pnpm-workspace.yaml`의 `onlyBuiltDependencies`에 추가할 필요는 없다(prebuilt optional deps 방식). 설치 후 `pnpm build`가 실패하면 그때 추가한다.

- [ ] **Step 2: 실패하는 테스트**

`src/lib/og.test.ts`:
```ts
import { describe, expect, test } from "vitest";
import { OG_HEIGHT, OG_WIDTH, ogElement, truncate } from "./og";

describe("truncate", () => {
  test("keeps short text", () => expect(truncate("짧다", 10)).toBe("짧다"));
  test("cuts long text with an ellipsis within max", () => {
    const out = truncate("가".repeat(50), 20);
    expect(out.length).toBeLessThanOrEqual(20);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("ogElement", () => {
  const el = ogElement({ title: "샘플 프로젝트", subtitle: "한 줄 요약", locale: "ko", kicker: "Doik Lee" });
  test("root is a full-size flex column", () => {
    expect(el.type).toBe("div");
    expect(el.props.style).toMatchObject({ width: OG_WIDTH, height: OG_HEIGHT, display: "flex" });
  });
  test("contains kicker, title and subtitle text", () => {
    const text = JSON.stringify(el);
    for (const s of ["Doik Lee", "샘플 프로젝트", "한 줄 요약"]) expect(text).toContain(s);
  });
  test("uses Pretendard for all text", () => {
    expect(JSON.stringify(el)).toContain('"fontFamily":"Pretendard"');
  });
});
```

`src/lib/seo.test.ts`에 추가:
```ts
import { ogImagePath, ogImageUrl } from "./seo";

test("ogImagePath", () => {
  expect(ogImagePath("ko")).toBe("/og/ko.png");
  expect(ogImagePath("en", "sample-project")).toBe("/og/projects/sample-project/en.png");
  expect(ogImageUrl("https://x.dev/", "en", "a")).toBe("https://x.dev/og/projects/a/en.png");
});
```

```bash
pnpm test src/lib/og.test.ts src/lib/seo.test.ts
```
Expected: FAIL.

- [ ] **Step 3: 구현**

`src/lib/og.ts`:
```ts
import type { Locale } from "../i18n/locales";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export type SatoriNode = {
  type: string;
  props: { style?: Record<string, string | number>; children?: SatoriNode | SatoriNode[] | string };
};
export type OgInput = { title: string; subtitle: string; locale: Locale; kicker: string };

export function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1))}…`;
}

const FONT = "Pretendard";

function text(content: string, style: Record<string, string | number>): SatoriNode {
  return { type: "div", props: { style: { fontFamily: FONT, ...style }, children: content } };
}

export function ogElement(input: OgInput): SatoriNode {
  return {
    type: "div",
    props: {
      style: {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#0f172a",
        color: "#f8fafc",
      },
      children: [
        text(input.kicker, { fontSize: 28, fontWeight: 400, opacity: 0.8 }),
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column", gap: 20 },
            children: [
              text(truncate(input.title, 40), { fontSize: 72, fontWeight: 700, lineHeight: 1.15 }),
              text(truncate(input.subtitle, 90), { fontSize: 34, fontWeight: 400, opacity: 0.85, lineHeight: 1.35 }),
            ],
          },
        },
        text(input.locale === "ko" ? "hello-iam-doik.vercel.app" : "hello-iam-doik.vercel.app · EN", {
          fontSize: 24,
          fontWeight: 400,
          opacity: 0.7,
        }),
      ],
    },
  };
}
```
색은 임시다. 시각 디자인 단계에서 `global.css` 토큰과 함께 바꾼다. satori는 CSS 변수를 모르므로 여기서는 리터럴을 쓴다.

`src/lib/seo.ts`에 추가:
```ts
export function ogImagePath(locale: Locale, slug?: string): string {
  return slug ? `/og/projects/${slug}/${locale}.png` : `/og/${locale}.png`;
}
export function ogImageUrl(site: string, locale: Locale, slug?: string): string {
  return abs(site, ogImagePath(locale, slug));
}
```

`src/lib/og-render.ts`:
```ts
import { readFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { OG_HEIGHT, OG_WIDTH, type OgInput, ogElement } from "./og";

// 빌드 프로세스당 한 번만 읽는다. URL 기준 경로라 Astro/Vite가 어디서 실행해도 같은 파일을 가리킨다.
const fontDir = new URL("../assets/fonts/og/", import.meta.url);
const fonts = [
  { name: "Pretendard", data: readFileSync(new URL("Pretendard-Regular.woff", fontDir)), weight: 400 as const, style: "normal" as const },
  { name: "Pretendard", data: readFileSync(new URL("Pretendard-Bold.woff", fontDir)), weight: 700 as const, style: "normal" as const },
];

export async function renderOgPng(input: OgInput): Promise<Uint8Array> {
  const svg = await satori(ogElement(input) as Parameters<typeof satori>[0], { width: OG_WIDTH, height: OG_HEIGHT, fonts });
  return new Resvg(svg, { fitTo: { mode: "width", value: OG_WIDTH } }).render().asPng();
}
```
왜 woff인가: satori는 TTF/OTF/WOFF만 읽고 WOFF2는 못 읽는다. Regular·Bold 두 굵기만 있으면 카드에 충분하다.

`src/pages/og/[...path].png.ts`:
```ts
import type { APIRoute } from "astro";
import { getCollection, getEntry } from "astro:content";
import { LOCALES, type Locale } from "../../i18n/locales";
import { pick } from "../../lib/localized";
import type { OgInput } from "../../lib/og";
import { renderOgPng } from "../../lib/og-render";

export async function getStaticPaths() {
  const profile = (await getCollection("profile"))[0];
  if (!profile) throw new Error("profile missing");
  const projects = await getCollection("projects");
  const landing = LOCALES.map((locale) => ({
    params: { path: locale },
    props: {
      title: pick(profile.data.name, locale),
      subtitle: pick(profile.data.tagline, locale),
      locale,
      kicker: locale === "ko" ? "포트폴리오" : "Portfolio",
    } satisfies OgInput,
  }));
  const perProject = projects.flatMap((p) =>
    LOCALES.map((locale: Locale) => ({
      params: { path: `projects/${p.id}/${locale}` },
      props: {
        title: pick(p.data.title, locale),
        subtitle: pick(p.data.summary, locale),
        locale,
        kicker: pick(profile.data.name, locale),
      } satisfies OgInput,
    })),
  );
  return [...landing, ...perProject];
}

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOgPng(props as OgInput);
  return new Response(png, { headers: { "Content-Type": "image/png" } });
};
```
`getEntry` import가 미사용이면 지운다(`noUnusedLocals`).

페이지 연결. `src/pages/[...lang]/index.astro`의 `<Base …>`에 `ogImage={ogImageUrl(site, locale)}`를 추가하고 frontmatter에 `import { ogImageUrl } from "../../lib/seo"; const site = Astro.site?.href ?? "https://hello-iam-doik.vercel.app";`. `projects/[slug].astro`에는 `ogImage={ogImageUrl(site, locale, project.slug)}`.

- [ ] **Step 4: 테스트·빌드·눈으로 확인**

```bash
pnpm test && pnpm check && pnpm build && ls dist/og dist/og/projects/sample-project && grep -o '<meta property="og:image"[^>]*>' dist/index.html dist/en/projects/sample-project/index.html
```
Expected: `ko.png en.png`, `ko.png en.png`, og:image가 절대 URL로 두 페이지에 존재. `dist/og/ko.png`를 열어 한글이 네모(tofu)가 아닌지 확인한다. 네모면 폰트 로드 경로 문제다.

`tests/e2e/seo.spec.ts`에 테스트 추가:
```ts
test("every page's og:image resolves to a png", async ({ page, request, baseURL }) => {
  const base = baseURL ?? "http://localhost:4321";
  for (const path of await sitemapPaths(base)) {
    await page.goto(path);
    const og = await page.locator('meta[property="og:image"]').getAttribute("content");
    if (!og) continue; // resume/colophon은 이미지 없음
    const res = await request.get(new URL(og).pathname);
    expect(res.status(), `${path} → ${og}`).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  }
});
```

- [ ] **Step 5: ADR-0009**

`docs/adr/0009-per-project-og-images-at-build.md` (title `"Per-project OG images at build"`, `status: "accepted"`, `date: "2026-09-03"`). 요지: 카톡·슬랙 미리보기가 국내 채용 담당자의 첫인상. 빌드 시 satori(HTML 유사 객체 → SVG) + resvg(SVG → PNG)로 로케일별 카드 생성. Vercel의 런타임 OG 기능 대신 정적 파일을 택한 이유: 서버 없음 원칙, 캐시 걱정 없음. WOFF2 미지원 때문에 woff 벤더링. Try it: `pnpm build && start dist/og/ko.png`(Windows) 또는 파일 열기. 되돌리는 조건: 프로젝트 수 × 로케일이 수백을 넘어 빌드가 느려질 때 → 요청 시 생성으로 전환.

- [ ] **Step 6: 게이트와 커밋**

```bash
pnpm format && pnpm lint && pnpm test && pnpm check && pnpm build && pnpm e2e
git add -A && git commit -m "feat(og): per-project, per-locale open graph images rendered at build"
```

---

### Task 3: 스크린샷 캡처 스크립트 (재현 가능, sidecar, stale 검사)

**Files:**
- Create: `src/content/capture-schema.ts`, `src/lib/capture.ts`, `src/lib/capture.test.ts`, `scripts/capture-screens.ts`, `content/projects/sample-project/capture.yaml`, `content/projects/sample-project/screens/01-home@desktop.json`, `docs/adr/0005-screenshot-pipeline-in-repo.md`
- Modify: `package.json`, `src/lib/content-contract.test.ts`, `content/projects/sample-project/screens/01-home@desktop.png`(재캡처), `content/projects/sample-project/meta.yaml`(capturedAt/commit 갱신), `docs/content-guide.md`

**Interfaces:**
- Produces `src/content/capture-schema.ts` (Zod, `astro/zod`):
  ```ts
  captureSchema = z.strictObject({
    base: z.url().optional(),                       // 라이브 URL
    local: z.strictObject({ cwd: z.string(), command: z.string(), port: z.number().int() }).optional(),
    login: z.strictObject({ path: z.string(), steps: z.array(z.strictObject({ fill: z.string().optional(), value: z.string().optional(), click: z.string().optional() })) }).optional(),
    shots: z.array(z.strictObject({
      name: z.string().regex(/^\d{2}-[a-z0-9-]+$/),
      route: z.string().startsWith("/"),
      devices: z.array(z.enum(["desktop", "mobile"])).min(1),
      waitFor: z.string().optional(),
    })).min(1),
  }).refine((c) => c.base || c.local, { message: "base 또는 local 중 하나는 필요" })
  ```
  `login.steps[].value`는 시드 데모 계정 값만. `${ENV}` 형태 문자열은 거부(스펙 §7 보안 규칙): `.refine(v => !/\$\{?[A-Z_]+\}?/.test(v))`.
- Produces `src/lib/capture.ts` (순수):
  - `export const VIEWPORTS = { desktop: { width: 1440, height: 900, deviceScaleFactor: 2 }, mobile: { width: 393, height: 852, deviceScaleFactor: 3, isMobile: true, hasTouch: true } } as const`
  - `export type Sidecar = { capturedAt: string; sourceCommit?: string; url: string; viewport: { width: number; height: number; deviceScaleFactor: number }; playwright: string }`
  - `export function planShots(config: CaptureConfig, baseUrl: string): { file: string; url: string; device: Device; waitFor?: string }[]` — file = `screens/<name>@<device>.png`
  - `export function sidecarPath(pngPath: string): string` — `.png` → `.json`
  - `export function isStale(capturedAt: string, today: string, maxDays: number): boolean`
  - `export function staleReport(screens: { file: string; capturedAt: string }[], today: string, maxDays: number): string[]` — 오래된 파일 목록
  - `export function metaYamlSnippet(shots: { file: string; device: Device }[], capturedAt: string, commit?: string): string` — meta.yaml에 붙여 넣을 YAML(따옴표 규칙 준수)
- Produces `pnpm capture <slug> [--stale <days>] [--video]`.
- Produces contract test: 모든 `screens[].src` PNG 옆에 sidecar가 있으면 `capturedAt`이 meta.yaml과 같고, `commit`이 있으면 sidecar의 `sourceCommit`과 같다. sidecar가 없는 PNG는 경고만(Claude가 브라우저로 캡처한 경우).

- [ ] **Step 1: 실패하는 테스트**

`src/lib/capture.test.ts`:
```ts
import { describe, expect, test } from "vitest";
import { captureSchema } from "../content/capture-schema";
import { isStale, metaYamlSnippet, planShots, sidecarPath, staleReport } from "./capture";

const config = captureSchema.parse({
  base: "https://example.dev",
  shots: [
    { name: "01-home", route: "/", devices: ["desktop", "mobile"] },
    { name: "02-chat", route: "/chat/", devices: ["mobile"], waitFor: "[data-ready]" },
  ],
});

describe("captureSchema", () => {
  test("requires base or local", () => {
    expect(() => captureSchema.parse({ shots: [{ name: "01-a", route: "/", devices: ["desktop"] }] })).toThrow(/base 또는 local/);
  });
  test("rejects credential-looking env placeholders in login steps", () => {
    expect(() =>
      captureSchema.parse({ base: "https://x.dev", login: { path: "/login", steps: [{ fill: "#pw", value: "${ADMIN_PASSWORD}" }] }, shots: [{ name: "01-a", route: "/", devices: ["desktop"] }] }),
    ).toThrow();
  });
  test("rejects bad shot names", () => {
    expect(() => captureSchema.parse({ base: "https://x.dev", shots: [{ name: "home", route: "/", devices: ["desktop"] }] })).toThrow();
  });
});

describe("planShots", () => {
  test("expands devices and builds file names and urls", () => {
    expect(planShots(config, "https://example.dev")).toEqual([
      { file: "screens/01-home@desktop.png", url: "https://example.dev/", device: "desktop", waitFor: undefined },
      { file: "screens/01-home@mobile.png", url: "https://example.dev/", device: "mobile", waitFor: undefined },
      { file: "screens/02-chat@mobile.png", url: "https://example.dev/chat/", device: "mobile", waitFor: "[data-ready]" },
    ]);
  });
});

test("sidecarPath", () => expect(sidecarPath("screens/01-home@desktop.png")).toBe("screens/01-home@desktop.json"));

describe("stale", () => {
  test("isStale by day difference", () => {
    expect(isStale("2026-06-01", "2026-09-03", 90)).toBe(true);
    expect(isStale("2026-08-01", "2026-09-03", 90)).toBe(false);
  });
  test("staleReport lists only stale files", () => {
    const r = staleReport([{ file: "a.png", capturedAt: "2026-01-01" }, { file: "b.png", capturedAt: "2026-09-01" }], "2026-09-03", 90);
    expect(r).toEqual(["a.png (captured 2026-01-01)"]);
  });
});

test("metaYamlSnippet quotes dates and keeps order", () => {
  const y = metaYamlSnippet([{ file: "screens/01-home@desktop.png", device: "desktop" }], "2026-09-03", "abc1234");
  expect(y).toContain('src: ./screens/01-home@desktop.png');
  expect(y).toContain('capturedAt: "2026-09-03"');
  expect(y).toContain('commit: "abc1234"');
  expect(y).toContain("device: desktop");
});
```

```bash
pnpm test src/lib/capture.test.ts
```
Expected: FAIL.

- [ ] **Step 2: 구현**

`src/content/capture-schema.ts`:
```ts
import { z } from "astro/zod";

const noEnvPlaceholder = z.string().refine((v) => !/\$\{?[A-Z_]{3,}\}?/.test(v), {
  message: "환경변수처럼 보이는 값은 금지: 시드 데모 계정 값만 적는다",
});

export const captureSchema = z
  .strictObject({
    base: z.url().optional(),
    local: z.strictObject({ cwd: z.string().min(1), command: z.string().min(1), port: z.number().int().positive() }).optional(),
    login: z
      .strictObject({
        path: z.string().startsWith("/"),
        steps: z.array(z.strictObject({ fill: z.string().optional(), value: noEnvPlaceholder.optional(), click: z.string().optional() })).min(1),
      })
      .optional(),
    shots: z
      .array(
        z.strictObject({
          name: z.string().regex(/^\d{2}-[a-z0-9-]+$/, "NN-kebab-case"),
          route: z.string().startsWith("/"),
          devices: z.array(z.enum(["desktop", "mobile"])).min(1),
          waitFor: z.string().optional(),
        }),
      )
      .min(1),
  })
  .refine((c) => Boolean(c.base || c.local), { message: "base 또는 local 중 하나는 필요" });

export type CaptureConfig = z.infer<typeof captureSchema>;
export type Device = CaptureConfig["shots"][number]["devices"][number];
```

`src/lib/capture.ts`:
```ts
import type { CaptureConfig, Device } from "../content/capture-schema";

export const VIEWPORTS = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 2, isMobile: false, hasTouch: false },
  mobile: { width: 393, height: 852, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
} as const;

export type Sidecar = {
  capturedAt: string;
  sourceCommit?: string;
  url: string;
  viewport: { width: number; height: number; deviceScaleFactor: number };
  playwright: string;
};

export type PlannedShot = { file: string; url: string; device: Device; waitFor?: string };

export function planShots(config: CaptureConfig, baseUrl: string): PlannedShot[] {
  const base = baseUrl.replace(/\/$/, "");
  return config.shots.flatMap((s) =>
    s.devices.map((device) => ({ file: `screens/${s.name}@${device}.png`, url: `${base}${s.route}`, device, waitFor: s.waitFor })),
  );
}

export function sidecarPath(pngPath: string): string {
  return pngPath.replace(/\.png$/, ".json");
}

const DAY = 86_400_000;

export function isStale(capturedAt: string, today: string, maxDays: number): boolean {
  return (Date.parse(today) - Date.parse(capturedAt)) / DAY > maxDays;
}

export function staleReport(screens: { file: string; capturedAt: string }[], today: string, maxDays: number): string[] {
  return screens.filter((s) => isStale(s.capturedAt, today, maxDays)).map((s) => `${s.file} (captured ${s.capturedAt})`);
}

export function metaYamlSnippet(shots: { file: string; device: Device }[], capturedAt: string, commit?: string): string {
  return shots
    .map((s) =>
      [
        `  - src: ./${s.file}`,
        `    alt: { ko: "설명을 쓰세요", en: "Describe the screen" }`,
        `    device: ${s.device}`,
        `    capturedAt: "${capturedAt}"`,
        ...(commit ? [`    commit: "${commit}"`] : []),
      ].join("\n"),
    )
    .join("\n");
}
```

```bash
pnpm test src/lib/capture.test.ts
```
Expected: PASS.

- [ ] **Step 3: 스크립트**

`scripts/capture-screens.ts`:
```ts
import { execSync, spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, devices as pwDevices } from "@playwright/test";
import { parse } from "yaml";
import { captureSchema } from "../src/content/capture-schema";
import { VIEWPORTS, metaYamlSnippet, planShots, type Sidecar, sidecarPath, staleReport } from "../src/lib/capture";
import { projectDir, readYaml } from "../src/lib/content-files";

const [slug, ...flags] = process.argv.slice(2);
if (!slug) {
  console.error("usage: pnpm capture <slug> [--stale <days>] [--video]");
  process.exit(1);
}
const dir = projectDir(slug);
const staleIdx = flags.indexOf("--stale");
const today = new Date().toISOString().slice(0, 10);

if (staleIdx >= 0) {
  const days = Number(flags[staleIdx + 1] ?? "90");
  const meta = readYaml<{ screens: { src: string; capturedAt: string }[] }>(join(dir, "meta.yaml"));
  const report = staleReport(meta.screens.map((s) => ({ file: s.src, capturedAt: s.capturedAt })), today, days);
  console.log(report.length ? report.join("\n") : `no screenshots older than ${days} days`);
  process.exit(report.length ? 2 : 0);
}

const config = captureSchema.parse(parse(readFileSync(join(dir, "capture.yaml"), "utf8")));
const pwVersion = (JSON.parse(readFileSync(join(process.cwd(), "node_modules/@playwright/test/package.json"), "utf8")) as { version: string }).version;

let server: ReturnType<typeof spawn> | undefined;
let baseUrl = config.base ?? "";
let sourceCommit: string | undefined;
if (config.local) {
  const { cwd, command, port } = config.local;
  sourceCommit = execSync("git rev-parse --short HEAD", { cwd, encoding: "utf8" }).trim();
  server = spawn(command, { cwd, shell: true, stdio: "inherit" });
  baseUrl = `http://localhost:${port}`;
  await waitForServer(baseUrl);
}

const browser = await chromium.launch({ args: ["--font-render-hinting=none"] });
try {
  const shots = planShots(config, baseUrl);
  for (const shot of shots) {
    const vp = VIEWPORTS[shot.device];
    const context = await browser.newContext({
      ...(shot.device === "mobile" ? pwDevices["iPhone 15"] : {}),
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.deviceScaleFactor,
      locale: "ko-KR",
      reducedMotion: "reduce",
      ...(flags.includes("--video") ? { recordVideo: { dir: join(dir, "video") } } : {}),
    });
    const page = await context.newPage();
    if (config.login) {
      await page.goto(`${baseUrl}${config.login.path}`);
      for (const step of config.login.steps) {
        if (step.fill && step.value !== undefined) await page.fill(step.fill, step.value);
        if (step.click) await page.click(step.click);
      }
    }
    await page.goto(shot.url, { waitUntil: "networkidle" });
    if (shot.waitFor) await page.waitForSelector(shot.waitFor);
    const out = join(dir, shot.file);
    await page.screenshot({ path: out, animations: "disabled", caret: "hide", scale: "device", fullPage: false });
    const sidecar: Sidecar = { capturedAt: today, sourceCommit, url: shot.url, viewport: { width: vp.width, height: vp.height, deviceScaleFactor: vp.deviceScaleFactor }, playwright: pwVersion };
    writeFileSync(join(dir, sidecarPath(shot.file)), `${JSON.stringify(sidecar, null, 2)}\n`);
    console.log(`captured ${shot.file}`);
    await context.close();
  }
  console.log("\n# meta.yaml screens: 아래를 붙여 넣고 alt를 채우세요\nscreens:");
  console.log(metaYamlSnippet(shots, today, sourceCommit));
} finally {
  await browser.close();
  server?.kill();
}

async function waitForServer(url: string): Promise<void> {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`server at ${url} did not start`);
}
```
`package.json`: `"capture": "tsx scripts/capture-screens.ts"`. `existsSync`가 미사용이면 제거.

왜 sidecar인가: 스크린샷은 언제·어느 커밋·어느 URL에서 찍었는지가 없으면 "2022년 스크린샷"이 된다. PNG 옆 JSON에 그 사실을 남기고, 테스트가 meta.yaml과 대조한다. 이력은 기억이 아니라 파일이 갖는다.

- [ ] **Step 4: 샘플 프로젝트를 라이브 사이트 캡처로 교체**

`content/projects/sample-project/capture.yaml`:
```yaml
base: "https://hello-iam-doik.vercel.app"
shots:
  - { name: "01-home", route: "/", devices: [desktop] }
```
```bash
pnpm capture sample-project
```
Expected: `content/projects/sample-project/screens/01-home@desktop.png`가 실제 사이트 화면으로 교체되고 `01-home@desktop.json`이 생김. 출력된 YAML의 `capturedAt`을 `meta.yaml`의 해당 항목에 반영(`alt`는 `{ ko: "포트폴리오 랜딩 페이지", en: "Portfolio landing page" }`로). PNG 크기 확인(≤1.5MB; 넘으면 `fullPage:false`인지 확인).

- [ ] **Step 5: 계약 테스트 확장**

`src/lib/content-contract.test.ts`에 추가:
```ts
import { sidecarPath } from "./capture";

test.each(projects)("$slug sidecars agree with meta.yaml", ({ slug, data }) => {
  for (const s of data.screens) {
    const png = join(projectDir(slug), s.src);
    const side = sidecarPath(png);
    if (!existsSync(side)) {
      console.info(`no sidecar for ${png} (captured outside the script)`);
      continue;
    }
    const meta = JSON.parse(readFileSync(side, "utf8")) as { capturedAt: string; sourceCommit?: string };
    expect(meta.capturedAt, side).toBe(s.capturedAt);
    if (s.commit && meta.sourceCommit) expect(meta.sourceCommit.startsWith(s.commit) || s.commit.startsWith(meta.sourceCommit), side).toBe(true);
  }
});
```
`pnpm test` → PASS. 일부러 sidecar의 `capturedAt`을 바꿔 실패하는지 확인 후 복구.

- [ ] **Step 6: 문서와 ADR-0005**

`docs/content-guide.md`의 4단계를 "`capture.yaml`을 쓰고 `pnpm capture <slug>` 실행 → 출력된 YAML을 meta.yaml에 붙여 alt 작성. 로컬 실행 레포는 `local: { cwd, command, port }`. 90일 넘은 스크린샷은 `pnpm capture <slug> --stale 90`"로 갱신.

`docs/adr/0005-screenshot-pipeline-in-repo.md` (title `"Screenshot pipeline lives in the repo"`, `status: "accepted"`, `date: "2026-09-03"`). 요지: 스크린샷은 데이터다(스키마 `image()` 검증, sidecar, 캡처 날짜 캡션). 재현 가능성: 누구나 `pnpm capture`로 같은 뷰포트·같은 설정으로 다시 찍을 수 있다. 데모 계정 값만 허용하고 환경변수 모양은 스키마가 거부. Try it: `pnpm capture sample-project --stale 0` → 오늘 찍은 것도 stale로 나오는지.

- [ ] **Step 7: 게이트와 커밋**

```bash
pnpm format && pnpm lint && pnpm test && pnpm check && pnpm build
git add -A && git commit -m "feat(capture): reproducible screenshot script with sidecars and stale check"
```

---

### Task 4: Lighthouse 예산, 클라이언트 JS 예산 테스트, Biome preset

**Files:**
- Create: `lighthouserc.json`, `tests/build/js-budget.test.ts`, `vitest.build.config.ts`
- Modify: `.github/workflows/ci.yml`, `package.json`, `biome.json`, `tsconfig.json`(include `tests/**/*`는 이미 있음)

**Interfaces:**
- Produces `pnpm test:build` — `dist/`가 있어야 실행. CI에서 `pnpm build` 뒤에 실행.
- Produces `tests/build/js-budget.test.ts`: `dist/_astro/*.js` gzip 합계 ≤ 250KB, 파일 중 가장 큰 청크(three가 들어갈 히어로 청크) gzip ≤ 200KB. 히어로 도입 전인 지금은 React 런타임(gzip 약 60KB)만 있어 통과.
- CI에 Lighthouse 단계: `treosh/lighthouse-ci-action@v12`, `configPath: ./lighthouserc.json`, `uploadArtifacts: true`, `temporaryPublicStorage: true`, `runs: 1`. 실패하면 CI 실패.

- [ ] **Step 1: 실패하는 빌드 테스트**

`vitest.build.config.ts`:
```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["tests/build/**/*.test.ts"], environment: "node" } });
```
`package.json`: `"test:build": "vitest run --config vitest.build.config.ts"`.

`tests/build/js-budget.test.ts`:
```ts
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, test } from "vitest";

const TOTAL_BUDGET = 250 * 1024;
const CHUNK_BUDGET = 200 * 1024;
const dir = join(process.cwd(), "dist", "_astro");

describe("client js budget (run after pnpm build)", () => {
  test("dist/_astro exists", () => expect(existsSync(dir), "run pnpm build first").toBe(true));

  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".js")) : [];
  const sizes = files.map((f) => ({ f, gz: gzipSync(readFileSync(join(dir, f))).length }));

  test("gzip total is within budget", () => {
    const total = sizes.reduce((a, s) => a + s.gz, 0);
    console.info(sizes.map((s) => `${s.f}: ${(s.gz / 1024).toFixed(1)}KB`).join("\n"), `\ntotal ${(total / 1024).toFixed(1)}KB`);
    expect(total).toBeLessThanOrEqual(TOTAL_BUDGET);
  });

  test("no single chunk exceeds the hero budget", () => {
    for (const s of sizes) expect(s.gz, s.f).toBeLessThanOrEqual(CHUNK_BUDGET);
  });

  test("only the landing page ships scripts other than the print button", () => {
    const html = (p: string) => readFileSync(join(process.cwd(), "dist", p), "utf8");
    expect((html("projects/sample-project/index.html").match(/<script/g) ?? []).length).toBe(0);
    expect((html("colophon/index.html").match(/<script/g) ?? []).length).toBe(0);
    expect((html("resume/index.html").match(/<script/g) ?? []).length).toBe(1);
  });
});
```
```bash
rm -rf dist && pnpm test:build
```
Expected: 첫 테스트 FAIL("run pnpm build first"). 그 다음 `pnpm build && pnpm test:build` → PASS, 콘솔에 청크별 크기.

- [ ] **Step 2: Lighthouse 설정**

`lighthouserc.json`:
```json
{
  "ci": {
    "collect": {
      "staticDistDir": "./dist",
      "url": [
        "http://localhost/index.html",
        "http://localhost/en/index.html",
        "http://localhost/projects/sample-project/index.html",
        "http://localhost/en/projects/sample-project/index.html"
      ],
      "numberOfRuns": 1,
      "settings": { "preset": "desktop" }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.95 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.95 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "total-blocking-time": ["error", { "maxNumericValue": 200 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    }
  }
}
```
왜 INP가 없나: INP는 실제 사용자 상호작용에서만 측정되는 필드 지표라 Lighthouse(랩)가 낼 수 없다. TBT가 랩에서의 대리 지표다.

`staticDistDir`와 `url`을 함께 쓰면 액션이 `dist/`를 로컬 서버로 띄우고 그 URL만 감사한다. `url`이 `localhost/…/index.html` 형식인 이유: 정적 서버가 디렉터리 인덱스를 해석하지 않을 수 있어 파일을 직접 가리킨다. 첫 실행에서 404가 나오면 `url`을 `http://localhost/`, `http://localhost/en/` 형식으로 바꿔 본다.

`.github/workflows/ci.yml`의 `pnpm build` 단계 바로 뒤에:
```yaml
      - run: pnpm test:build
      - uses: treosh/lighthouse-ci-action@v12
        with:
          configPath: ./lighthouserc.json
          uploadArtifacts: true
          temporaryPublicStorage: true
          runs: 1
```
(Playwright 설치와 e2e는 그 뒤에 그대로.)

- [ ] **Step 3: Biome preset 전환**

`biome.json`의 `"linter": { "enabled": true, "rules": { "recommended": true, "a11y": { "recommended": true } } }`를 Biome 2.5 문법으로:
```json
"linter": { "enabled": true, "rules": { "preset": "recommended", "a11y": { "recommended": true } } }
```
`pnpm lint` 실행. `preset` 키를 거부하면 Biome 2.5.11의 실제 스키마(`https://biomejs.dev/schemas/2.5.11/schema.json`)를 확인해 맞는 키를 쓰고 보고. 경고("recommended field has been deprecated")가 사라져야 한다.

- [ ] **Step 4: 로컬에서 Lighthouse 한 번**

CI 액션을 로컬에서 그대로 돌릴 수는 없으므로 Lighthouse 자체로 예산만 미리 본다(설치 없이):
```bash
pnpm build && pnpm dlx @lhci/cli@0.15.1 autorun --config=lighthouserc.json 2>&1 | tail -25
```
Expected: 4개 URL 감사, assertion 전부 통과. 실패하는 assertion이 있으면 원인(예: 폰트 CSS의 92개 @font-face로 인한 렌더 지연, 이미지 크기)을 고치고 다시 돌린다. 예산을 낮추지 않는다.

- [ ] **Step 5: 게이트와 커밋, CI 확인**

```bash
pnpm format && pnpm lint && pnpm test && pnpm check && pnpm build && pnpm test:build
git add -A && git commit -m "ci: lighthouse budgets, client js budget test, biome preset"
```
브랜치를 푸시해 PR을 열면 CI에서 Lighthouse 단계가 도는 것을 확인한다(이 계획의 병합 단계에서).

---

### Task 5: 히어로 3D 아일랜드 (three, 폴백 3단, 품질 토글, 예산)

**Files:**
- Create: `src/lib/motion-prefs.ts`, `src/lib/motion-prefs.test.ts`, `src/lib/hero-scene.ts`, `src/islands/Hero3D.tsx`, `src/islands/QualityToggle.tsx`, `src/islands/QualityToggle.test.tsx`, `docs/adr/0008-hero-only-3d-with-fallbacks.md`, `docs/adr/0010-what-react-islands-cost.md`
- Modify: `package.json`, `src/pages/[...lang]/index.astro`, `src/components/Header.astro`, `src/i18n/ui.ts`, `src/styles/global.css`, `tests/e2e/smoke.spec.ts`, `docs/adr/0001-astro-over-nextjs.md`(수정 아님, 0010이 보완)

**Interfaces:**
- Produces `src/lib/motion-prefs.ts` (순수):
  - `export type Quality = "off" | "low" | "high"`
  - `export const QUALITY_KEY = "hero-quality"` (localStorage 키)
  - `export type DeviceSignals = { reducedMotion: boolean; hardwareConcurrency?: number; deviceMemory?: number; webgl: boolean }`
  - `export function decideQuality(signals: DeviceSignals, stored: string | null): Quality` — 규칙: `reducedMotion` → `"off"` (저장값 무시). 저장값이 `"off"|"low"|"high"`면 그대로. `webgl=false` → `"off"`. 코어 ≤ 4 또는 메모리 ≤ 4 → `"low"`. 그 외 `"high"`.
  - `export function renderScale(q: Quality): number` — off 0, low 0.5, high 1
  - `export function frameInterval(q: Quality): number` — ms; low 33(≈30fps), high 16, off Infinity
- Produces `src/lib/hero-scene.ts` (브라우저 전용, three import; 아일랜드만 import; 테스트 없음):
  - `export function createHeroScene(canvas: HTMLCanvasElement, scale: number): { setPointer(x: number, y: number): void; setScroll(p: number): void; resize(): void; frame(t: number): void; dispose(): void }`
- Produces `src/islands/Hero3D.tsx`: props `{ initialQuality: Quality }`(SSR은 항상 `"off"`; 클라이언트 마운트 후 `decideQuality`로 결정 → 하이드레이션 불일치 없음). 캔버스 `<canvas aria-hidden="true">` + `data-quality` 속성. `IntersectionObserver`로 화면 밖이면 rAF 정지. `visibilitychange`로 탭 숨김 시 정지. 언마운트 시 dispose.
- Produces `src/islands/QualityToggle.tsx`: 헤더의 버튼 하나. 현재 품질을 순환(`high → low → off → high`), localStorage 저장, `window.dispatchEvent(new CustomEvent("hero-quality", { detail: q }))`로 Hero3D에 알림. `aria-pressed` 대신 텍스트 라벨(`t("quality.high")` 등)을 서버에서 props로 받는다.
- 랜딩 `#hero` 섹션: `position: relative`, 캔버스는 `absolute inset-0 -z-10`, 텍스트는 그대로 HTML. `client:visible` 마운트.
- ui.ts 키: `"quality.label"`(ko `배경 효과`/en `Background effect`), `"quality.high"`(`높음`/`High`), `"quality.low"`(`낮음`/`Low`), `"quality.off"`(`끔`/`Off`), `"hero.canvasHint"`(`마우스를 움직이거나 스크롤하면 배경이 반응합니다`/`Move the pointer or scroll to see the background react`).

- [ ] **Step 1: 의존성**

```bash
pnpm add three@0.185.1 && pnpm add -D @types/three@0.185.4
```
`three`는 런타임 의존성(브라우저 번들에 들어감). 트리셰이킹을 위해 `import { WebGLRenderer, Scene, … } from "three"`로 이름 지정 import만 쓴다. `import * as THREE` 금지.

- [ ] **Step 2: 실패하는 테스트 (순수 로직)**

`src/lib/motion-prefs.test.ts`:
```ts
import { describe, expect, test } from "vitest";
import { decideQuality, frameInterval, renderScale } from "./motion-prefs";

const fast = { reducedMotion: false, hardwareConcurrency: 8, deviceMemory: 8, webgl: true };

describe("decideQuality", () => {
  test("reduced motion always wins", () => expect(decideQuality({ ...fast, reducedMotion: true }, "high")).toBe("off"));
  test("stored preference wins over device signals", () => {
    expect(decideQuality({ ...fast, hardwareConcurrency: 2 }, "high")).toBe("high");
    expect(decideQuality(fast, "off")).toBe("off");
  });
  test("ignores garbage in storage", () => expect(decideQuality(fast, "ultra")).toBe("high"));
  test("no webgl → off", () => expect(decideQuality({ ...fast, webgl: false }, null)).toBe("off"));
  test("low-end signals → low", () => {
    expect(decideQuality({ ...fast, hardwareConcurrency: 4 }, null)).toBe("low");
    expect(decideQuality({ ...fast, deviceMemory: 4 }, null)).toBe("low");
    expect(decideQuality({ ...fast, hardwareConcurrency: undefined, deviceMemory: undefined }, null)).toBe("high");
  });
});

test("renderScale / frameInterval", () => {
  expect(renderScale("off")).toBe(0);
  expect(renderScale("low")).toBe(0.5);
  expect(renderScale("high")).toBe(1);
  expect(frameInterval("low")).toBeGreaterThan(frameInterval("high"));
  expect(frameInterval("off")).toBe(Number.POSITIVE_INFINITY);
});
```

```bash
pnpm test src/lib/motion-prefs.test.ts
```
Expected: FAIL.

- [ ] **Step 3: 구현 순수 모듈**

`src/lib/motion-prefs.ts`:
```ts
export type Quality = "off" | "low" | "high";
export const QUALITY_KEY = "hero-quality";
export const QUALITIES: readonly Quality[] = ["high", "low", "off"];

export type DeviceSignals = {
  reducedMotion: boolean;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  webgl: boolean;
};

function isQuality(x: unknown): x is Quality {
  return x === "off" || x === "low" || x === "high";
}

export function decideQuality(signals: DeviceSignals, stored: string | null): Quality {
  if (signals.reducedMotion) return "off";
  if (isQuality(stored)) return stored;
  if (!signals.webgl) return "off";
  const lowEnd = (signals.hardwareConcurrency ?? 8) <= 4 || (signals.deviceMemory ?? 8) <= 4;
  return lowEnd ? "low" : "high";
}

export function renderScale(q: Quality): number {
  return q === "off" ? 0 : q === "low" ? 0.5 : 1;
}

export function frameInterval(q: Quality): number {
  return q === "off" ? Number.POSITIVE_INFINITY : q === "low" ? 33 : 16;
}

export function nextQuality(q: Quality): Quality {
  return q === "high" ? "low" : q === "low" ? "off" : "high";
}
```
왜 감속 모션이 저장값보다 위인가: OS 설정은 사용자의 의학적·접근성 요구일 수 있다. 사이트 안의 토글이 그것을 덮어쓰면 안 된다.

```bash
pnpm test src/lib/motion-prefs.test.ts
```
Expected: PASS.

- [ ] **Step 4: three 장면**

`src/lib/hero-scene.ts`:
```ts
import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, WebGLRenderer } from "three";

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
`;

// 값 노이즈 두 겹으로 흐르는 그라디언트. 포인터가 밝은 점을, 스크롤이 위상을 민다.
const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime; uniform vec2 uPointer; uniform float uScroll; uniform vec2 uAspect;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  void main() {
    vec2 p = (vUv - 0.5) * uAspect;
    float t = uTime * 0.05 + uScroll * 0.6;
    float n = noise(p * 2.0 + t) * 0.6 + noise(p * 5.0 - t * 1.3) * 0.4;
    float d = distance(p, (uPointer - 0.5) * uAspect);
    float glow = smoothstep(0.6, 0.0, d) * 0.35;
    vec3 a = vec3(0.06, 0.09, 0.16), b = vec3(0.16, 0.30, 0.62);
    vec3 c = mix(a, b, n) + glow;
    gl_FragColor = vec4(c, 1.0);
  }
`;

export type HeroScene = {
  setPointer(x: number, y: number): void;
  setScroll(p: number): void;
  resize(): void;
  frame(t: number): void;
  dispose(): void;
};

export function createHeroScene(canvas: HTMLCanvasElement, scale: number): HeroScene {
  const renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2) * scale);
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const material = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: { uTime: { value: 0 }, uPointer: { value: new Vector2(0.5, 0.5) }, uScroll: { value: 0 }, uAspect: { value: new Vector2(1, 1) } },
  });
  const mesh = new Mesh(new PlaneGeometry(2, 2), material);
  scene.add(mesh);

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setSize(w, h, false);
    material.uniforms.uAspect?.value.set(w / Math.max(h, 1), 1);
  };
  resize();

  return {
    setPointer: (x, y) => material.uniforms.uPointer?.value.set(x, 1 - y),
    setScroll: (p) => {
      if (material.uniforms.uScroll) material.uniforms.uScroll.value = p;
    },
    resize,
    frame: (t) => {
      if (material.uniforms.uTime) material.uniforms.uTime.value = t / 1000;
      renderer.render(scene, camera);
    },
    dispose: () => {
      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
```
`noUncheckedIndexedAccess` 때문에 `uniforms.x?.value` 형태를 쓴다. 왜 OrthographicCamera + 평면 하나인가: 히어로가 원하는 것은 "반응하는 배경"이지 3D 오브젝트가 아니다. 삼각형 2개와 프래그먼트 셰이더 하나가 가장 싼 방법이고, GPU 비용은 해상도에 비례하므로 `scale`로 예산을 통제한다.

- [ ] **Step 5: 아일랜드 두 개 (테스트 포함)**

`src/islands/QualityToggle.test.tsx`:
```tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { QUALITY_KEY } from "../lib/motion-prefs";
import { QualityToggle } from "./QualityToggle";

const labels = { label: "Background effect", high: "High", low: "Low", off: "Off" };
beforeEach(() => localStorage.clear());

test("cycles high → low → off → high, persists and dispatches", async () => {
  const seen: string[] = [];
  window.addEventListener("hero-quality", (e) => seen.push((e as CustomEvent<string>).detail));
  render(<QualityToggle labels={labels} />);
  const btn = screen.getByRole("button", { name: /Background effect/ });
  expect(btn).toHaveTextContent("High");
  await userEvent.click(btn);
  expect(btn).toHaveTextContent("Low");
  expect(localStorage.getItem(QUALITY_KEY)).toBe("low");
  await userEvent.click(btn);
  await userEvent.click(btn);
  expect(btn).toHaveTextContent("High");
  expect(seen).toEqual(["low", "off", "high"]);
});

test("reads the stored value on mount", () => {
  localStorage.setItem(QUALITY_KEY, "off");
  render(<QualityToggle labels={labels} />);
  expect(screen.getByRole("button")).toHaveTextContent("Off");
});
```
```bash
pnpm test src/islands/QualityToggle.test.tsx
```
Expected: FAIL.

`src/islands/QualityToggle.tsx`:
```tsx
import { useEffect, useState } from "react";
import { QUALITY_KEY, type Quality, nextQuality } from "../lib/motion-prefs";

type Props = { labels: { label: string; high: string; low: string; off: string } };

function readStored(): Quality {
  try {
    const v = localStorage.getItem(QUALITY_KEY);
    return v === "low" || v === "off" ? v : "high";
  } catch {
    return "high";
  }
}

export function QualityToggle({ labels }: Props) {
  const [q, setQ] = useState<Quality>("high"); // SSR과 첫 렌더는 항상 high
  useEffect(() => setQ(readStored()), []);
  function cycle() {
    const next = nextQuality(q);
    setQ(next);
    try {
      localStorage.setItem(QUALITY_KEY, next);
    } catch {}
    window.dispatchEvent(new CustomEvent<Quality>("hero-quality", { detail: next }));
  }
  return (
    <button type="button" onClick={cycle} className="rounded border px-2 py-0.5 text-xs" aria-label={`${labels.label}: ${labels[q]}`}>
      {labels.label}: {labels[q]}
    </button>
  );
}
```

`src/islands/Hero3D.tsx`:
```tsx
import { useEffect, useRef, useState } from "react";
import { QUALITY_KEY, type Quality, decideQuality, frameInterval, renderScale } from "../lib/motion-prefs";

function hasWebgl(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

function readSignals() {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: nav.deviceMemory,
    webgl: hasWebgl(),
  };
}

export function Hero3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [quality, setQuality] = useState<Quality>("off"); // SSR = off → 서버/클라 첫 렌더 동일

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(QUALITY_KEY);
    } catch {}
    setQuality(decideQuality(readSignals(), stored));
    const onQuality = (e: Event) => {
      const q = (e as CustomEvent<Quality>).detail;
      setQuality(readSignals().reducedMotion ? "off" : q);
    };
    window.addEventListener("hero-quality", onQuality);
    return () => window.removeEventListener("hero-quality", onQuality);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || quality === "off") return;
    let scene: import("../lib/hero-scene").HeroScene | undefined;
    let raf = 0;
    let visible = true;
    let last = 0;
    const interval = frameInterval(quality);
    const cancelled = { current: false };

    import("../lib/hero-scene").then(({ createHeroScene }) => {
      if (cancelled.current) return;
      scene = createHeroScene(canvas, renderScale(quality));
      const loop = (t: number) => {
        raf = requestAnimationFrame(loop);
        if (!visible || document.hidden || t - last < interval) return;
        last = t;
        scene?.frame(t);
      };
      raf = requestAnimationFrame(loop);
    });

    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    io.observe(canvas);
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      scene?.setPointer((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    };
    const onScroll = () => scene?.setScroll(Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1));
    const onResize = () => scene?.resize();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      cancelled.current = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      scene?.dispose();
    };
  }, [quality]);

  return <canvas ref={canvasRef} aria-hidden="true" data-quality={quality} className="absolute inset-0 -z-10 h-full w-full" />;
}
```
왜 `import("../lib/hero-scene")`를 동적으로 하나: three(약 150KB gzip)는 품질이 `off`인 사용자(감속 모션, WebGL 없음, 끔 선택)에게는 내려받을 이유가 없다. 동적 import는 필요한 브라우저에서만 그 청크를 가져오게 하고, 예산 테스트는 "가장 큰 청크 ≤ 200KB"로 그 청크를 감시한다.

```bash
pnpm test
```
Expected: QualityToggle 테스트 PASS(Hero3D는 WebGL이 필요해 jsdom에서 테스트하지 않는다. e2e가 맡는다).

- [ ] **Step 6: 페이지·헤더·CSS 연결**

`src/i18n/ui.ts`에 위 5개 키 추가(ko 먼저, en 같은 순서).

`src/pages/[...lang]/index.astro`: `import { Hero3D } from "../../islands/Hero3D";` 후 `#hero` 섹션을
```astro
<section id="hero" class="relative overflow-hidden py-24">
  <Hero3D client:visible />
  <div class="relative">
    <h1 …>…</h1> …(기존 내용)…
    <p class="mt-2 text-xs opacity-60">{t(locale, "hero.canvasHint")}</p>
  </div>
</section>
```
텍스트 대비: 캔버스가 어두운 파랑이므로 히어로 텍스트에 `text-paper`(밝은색) 클래스를 준다. `quality=off`일 때도 배경이 보이도록 섹션에 `bg-[oklch(20%_0.05_260)]` 같은 폴백 배경을 준다. axe `color-contrast`가 e2e에서 검사한다.

`src/components/Header.astro`: `LanguageToggle` 앞에
```astro
<QualityToggle client:idle labels={{ label: t(locale, "quality.label"), high: t(locale, "quality.high"), low: t(locale, "quality.low"), off: t(locale, "quality.off") }} />
```
(`import { QualityToggle } from "../islands/QualityToggle";`). 이 토글은 모든 페이지 헤더에 있지만 아일랜드 자체는 2KB 수준이다. 랜딩이 아닌 페이지에 스크립트가 생기므로 Task 4의 "only the landing page ships scripts" 테스트를 갱신한다: 프로젝트·콜로폰 페이지의 `<script` 개수는 정확히 QualityToggle 하이드레이션 스크립트 수(빌드 후 실제 값을 확인해 고정, 보통 1)여야 하고, three 청크(`hero-scene`)는 랜딩 HTML에만 참조된다.

- [ ] **Step 7: e2e**

`tests/e2e/smoke.spec.ts`에 추가:
```ts
test("hero canvas respects reduced motion and the quality toggle", async ({ browser }) => {
  const reduced = await browser.newContext({ reducedMotion: "reduce" });
  const p1 = await reduced.newPage();
  await p1.goto("/");
  await expect(p1.locator("#hero canvas")).toHaveAttribute("data-quality", "off");
  await reduced.close();

  const normal = await browser.newContext({ reducedMotion: "no-preference" });
  const p2 = await normal.newPage();
  await p2.goto("/");
  await expect(p2.locator("#hero canvas")).toHaveAttribute("data-quality", /high|low/);
  const toggle = p2.getByRole("button", { name: /배경 효과/ });
  await toggle.click(); // high → low
  await toggle.click(); // low → off
  await expect(p2.locator("#hero canvas")).toHaveAttribute("data-quality", "off");
  await p2.reload();
  await expect(p2.locator("#hero canvas")).toHaveAttribute("data-quality", "off"); // localStorage
  await normal.close();
});
```
헤드리스 Chromium은 SwiftShader로 WebGL을 지원하므로 `high|low`가 나온다. 안 나오면(`off`) 헤드리스 WebGL이 꺼진 것이니 `playwright.config.ts`의 chromium `launchOptions.args`에 `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`를 추가하고 보고.

```bash
pnpm build && pnpm test:build && pnpm e2e
```
Expected: 예산 테스트 통과(콘솔에 hero-scene 청크 gzip 크기 출력, 200KB 이하), e2e 전부 통과.

- [ ] **Step 8: ADR-0008, ADR-0010**

`docs/adr/0008-hero-only-3d-with-fallbacks.md` (title `"Hero-only 3D with fallbacks and a JS budget"`, `date: "2026-09-03"`, accepted). 요지: 레퍼런스 3사이트(three + 스크롤 연동)에서 "히어로 배경 하나"만 가져왔다. 폴백 3단(감속 모션 → off, WebGL/저사양 → low, 사용자 토글). three는 동적 import라 off인 사용자는 내려받지 않는다. 예산: 청크 ≤ 200KB gzip, 총 ≤ 250KB, `tests/build`가 강제. Try it: DevTools에서 감속 모션을 켜고 새로고침 → 캔버스 `data-quality="off"`, 네트워크에 hero-scene 청크 없음. 되돌리는 조건: 예산 초과 또는 Lighthouse TBT 실패가 반복되면 CSS 그라디언트로 격하.

`docs/adr/0010-what-react-islands-cost.md` (title `"What React islands cost and why we pay it"`, `date: "2026-09-03"`, accepted). 요지: 아일랜드 3개(ProjectFilter 약 2KB, QualityToggle 약 2KB, Hero3D + three 약 150KB)를 위해 React 런타임 약 60KB gzip을 싣는다. 대안(vanilla script)은 국내 JD의 React 요구를 숨기고 향후 채팅 UI를 재작성하게 만든다. 실제 수치는 `pnpm test:build` 출력에서 가져와 표로 적는다. Try it: `pnpm build && pnpm test:build`. 되돌리는 조건: 아일랜드가 하나로 줄거나 React가 채용 시장에서 요구되지 않을 때.

- [ ] **Step 9: 게이트와 커밋**

```bash
pnpm format && pnpm lint && pnpm test && pnpm check && pnpm build && pnpm test:build && pnpm e2e
git add -A && git commit -m "feat(hero): three.js hero island with reduced-motion, low-end and user fallbacks"
```

---

### Task 6: 마무리 — 영어 콜로폰 폴백 안내, llms.txt, README 스크린샷, 문서

**Files:**
- Create: `src/lib/llms.ts`, `src/lib/llms.test.ts`, `src/pages/llms.txt.ts`
- Modify: `src/pages/[...lang]/colophon/[id].astro`, `src/i18n/ui.ts`, `README.md`, `docs/architecture.md`, `docs/content-guide.md`, `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Produces `src/lib/llms.ts` (순수): `export function llmsTxt(input: { siteName: string; site: string; tagline: string; projects: { title: string; summary: string; url: string; repo: string }[]; adrs: { title: string; url: string }[] }): string` — llms.txt 규약(`# 제목`, `> 한 줄`, `## Projects` 목록 `- [title](url): summary`, `## Decisions`).
- Produces `/llms.txt` (영어 기준, 한국어 프로젝트 요약은 en 필드 사용).
- ui.ts 키: `"colophon.adrLangNote"` (ko `설계 결정 기록은 한국어로만 작성되어 있습니다.` / en `Architecture decision records are written in Korean only.`).

- [ ] **Step 1: 실패하는 테스트**

`src/lib/llms.test.ts`:
```ts
import { expect, test } from "vitest";
import { llmsTxt } from "./llms";

test("llmsTxt follows the llms.txt shape", () => {
  const out = llmsTxt({
    siteName: "Doik Lee",
    site: "https://x.dev",
    tagline: "Web & AI developer",
    projects: [{ title: "Sample", summary: "One line", url: "https://x.dev/en/projects/sample/", repo: "https://github.com/a/b" }],
    adrs: [{ title: "Astro over Next.js", url: "https://x.dev/en/colophon/0001-astro-over-nextjs/" }],
  });
  const lines = out.split("\n");
  expect(lines[0]).toBe("# Doik Lee");
  expect(lines[2]).toBe("> Web & AI developer");
  expect(out).toContain("## Projects\n- [Sample](https://x.dev/en/projects/sample/): One line (repo: https://github.com/a/b)");
  expect(out).toContain("## Decisions\n- [Astro over Next.js](https://x.dev/en/colophon/0001-astro-over-nextjs/)");
  expect(out.endsWith("\n")).toBe(true);
});
```
```bash
pnpm test src/lib/llms.test.ts
```
Expected: FAIL.

- [ ] **Step 2: 구현**

`src/lib/llms.ts`:
```ts
export type LlmsInput = {
  siteName: string;
  site: string;
  tagline: string;
  projects: { title: string; summary: string; url: string; repo: string }[];
  adrs: { title: string; url: string }[];
};

export function llmsTxt(i: LlmsInput): string {
  return [
    `# ${i.siteName}`,
    "",
    `> ${i.tagline}`,
    "",
    `Site: ${i.site}`,
    "",
    "## Projects",
    ...i.projects.map((p) => `- [${p.title}](${p.url}): ${p.summary} (repo: ${p.repo})`),
    "",
    "## Decisions",
    ...i.adrs.map((a) => `- [${a.title}](${a.url})`),
    "",
  ].join("\n");
}
```

`src/pages/llms.txt.ts`:
```ts
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { pick } from "../lib/localized";
import { llmsTxt } from "../lib/llms";
import { localePath } from "../lib/urls";

export const GET: APIRoute = async ({ site }) => {
  const base = (site?.href ?? "https://hello-iam-doik.vercel.app").replace(/\/$/, "");
  const profile = (await getCollection("profile"))[0];
  if (!profile) throw new Error("profile missing");
  const projects = (await getCollection("projects")).sort((a, b) => a.data.order - b.data.order);
  const adrs = (await getCollection("adrs")).sort((a, b) => a.id.localeCompare(b.id));
  const body = llmsTxt({
    siteName: pick(profile.data.name, "en"),
    site: base,
    tagline: pick(profile.data.tagline, "en"),
    projects: projects.map((p) => ({ title: pick(p.data.title, "en"), summary: pick(p.data.summary, "en"), url: `${base}${localePath("en", `/projects/${p.id}/`)}`, repo: p.data.links.repo })),
    adrs: adrs.map((a) => ({ title: a.data.title, url: `${base}${localePath("en", `/colophon/${a.id}/`)}` })),
  });
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
```
왜 llms.txt인가: AI 도구가 사이트를 요약할 때 읽는 관례적 파일이다. 콘텐츠 컬렉션에서 생성하므로 복사본이 아니고, 나중에 AI 채팅(ADR-0002)의 사전 코퍼스가 된다.

- [ ] **Step 3: 영어 콜로폰 ADR 페이지에 언어 안내**

`src/pages/[...lang]/colophon/[id].astro`: `locale === "en"`일 때 `<article>` 위에 `<p role="note" class="my-4 rounded border-l-4 border-accent bg-black/5 p-3 text-sm">{t(locale, "colophon.adrLangNote")}</p>`. 프로젝트 페이지의 `FallbackNotice`와 같은 시각 언어. `ui.ts`에 키 추가.

- [ ] **Step 4: README 스크린샷과 문서**

- `README.md`의 히어로 이미지는 Task 3에서 재캡처된 `content/projects/sample-project/screens/01-home@desktop.png`(실제 사이트)로 이미 바뀌어 있다. 캡션에 "captured by `pnpm capture`"를 한 줄 추가.
- `docs/architecture.md`에 세 줄 추가: OG 엔드포인트(`src/pages/og/`), 캡처 스크립트, 히어로 아일랜드와 예산 테스트(`tests/build/`).
- `docs/content-guide.md`: `pnpm capture` 절차(Task 3에서 갱신했으면 확인만).
- `tests/e2e/smoke.spec.ts`에 `llms.txt`가 200이고 `# `로 시작하는지 한 줄 테스트.

- [ ] **Step 5: 게이트와 커밋**

```bash
pnpm format && pnpm lint && pnpm test && pnpm check && pnpm build && pnpm test:build && pnpm e2e
git add -A && git commit -m "feat: llms.txt endpoint, english adr language note, docs for assets pipeline"
```

---

## 스펙 대조 (자체 검토)

| 스펙 항목 | 태스크 |
|---|---|
| §6 캡처 스크립트, capture.yaml, sidecar, `--stale`, 네이밍, 최적화 없음(`<Picture>`), OG 이미지, 폰트 | 3(캡처·sidecar·stale), 2(OG), 1(폰트). 데모 영상은 `--video` 플래그만(v1 범위 밖 유지) |
| §7 Lighthouse CI 예산(TBT) | 4 |
| §8 프로젝트별 OG(must), llms.txt(should) | 2, 6 |
| §9 히어로 3D: 아일랜드 1곳, 폴백 3단, 예산(청크 200KB·총 250KB), rAF 정지, 텍스트 HTML, CSS 전환 | 5 (`@starting-style` 섹션 전환은 시각 디자인 단계로 미룸) |
| §11 ADR 0005, 0008, 0009 + 최종 검토가 요구한 "왜 React" ADR(0010) | 3, 5, 2, 5 |
| 1차 최종 검토 잔여: `/en/colophon/<id>/` 안내, Biome preset, README 스크린샷 | 6, 4, 3+6 |
| Global Constraints 예산 강제 수단 | 4 (`tests/build/js-budget.test.ts`) |

의도적으로 뺀 것: 데모 영상 호스팅, 커맨드 팔레트, 다크 모드 토큰(시각 디자인 단계), CSP의 `'unsafe-inline'` 제거(Astro CSP 해시 기능 검토는 3차), 히어로의 최종 색·형태(시각 디자인 단계에서 셰이더 상수만 교체).

## 실행 순서와 의존

1 → 2 (OG가 woff 폰트 필요) → 3 → 4 (예산 테스트가 5 이전에 존재해야 5가 게이트를 통과하는지 증명) → 5 → 6. 브랜치 `feat/assets-hero`, 태스크마다 커밋, 끝나면 PR로 CI(Lighthouse 포함)를 확인하고 main에 병합.
