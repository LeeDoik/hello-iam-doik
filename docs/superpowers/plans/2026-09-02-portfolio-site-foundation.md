# 포트폴리오 사이트 1차 구현 계획: 기반 + 콘텐츠 모델 + 페이지

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 스펙 §13의 1~3단계. 두 로케일로 빌드·배포되는 Astro 7 정적 사이트를 만들고, `content/` 폴더 하나로 프로젝트를 추가할 수 있는 검증된 콘텐츠 모델과 4개 페이지(랜딩, 프로젝트, 이력서, 콜로폰)를 완성한다.

**Architecture:** 모든 편집 가능한 진실은 `content/`(YAML + Markdown)에 있고 `src/content.config.ts`가 Zod로 빌드 시 검증한다. 페이지는 `src/pages/[...lang]/` 템플릿 한 벌이 `/`(ko)와 `/en/`을 만든다. 순수 로직은 `src/lib/`에 두고 Vitest로 테스트하며, 표현은 `.astro` 컴포넌트가 맡고 클라이언트 JS는 `src/islands/`의 React 컴포넌트에만 있다.

**Tech Stack:** Astro 7.2.10, React 19.2.8, TypeScript 6.0.3, Tailwind 4.3.3, Vitest 4.1.11, Playwright 1.62.1, Biome 2.5.11, pnpm 10.34.5, Node 24.

후속 계획(별도 문서): 2차 = 자산 파이프라인(캡처 스크립트, OG 이미지, 폰트, Lighthouse 예산) + 히어로 3D. 3차 = 실제 콘텐츠 채우기 + 문서 마감. 이 계획은 스펙 §6, §9의 캡처 스크립트·OG·Hero3D를 만들지 않는다. 다만 그 자리가 필요한 스키마 필드와 레이아웃 props는 여기서 만든다.

## Global Constraints

- 정적 사이트. 어댑터 설치 금지. `output`은 기본값(`'static'`) 유지. `src/pages/api/` 만들지 않음.
- Node `24.x` (`.nvmrc` = `24`, `engines.node` = `"24.x"`, `.npmrc` `engine-strict=true`). pnpm `10.34.5` (`packageManager` 필드).
- `pnpm-workspace.yaml`에 `onlyBuiltDependencies: [sharp, esbuild]`.
- 로케일: `ko`(기본, 접두 없음) / `en`(`/en/` 접두). `i18n.routing.prefixDefaultLocale: false`. 루트 리다이렉트 없음.
- 모든 URL은 trailing slash 사용 (`trailingSlash: 'always'`, `build.format: 'directory'`).
- `content/`는 프로젝트 루트(`src/` 밖). 콘텐츠를 바꾸려고 `content/` 밖을 편집하면 버그.
- `src/lib/*.ts`는 `astro:*` 가상 모듈과 `Astro` 전역을 import하지 않는다. 예외는 `src/lib/content.ts` 하나뿐이며 그 파일은 단위 테스트하지 않는다.
- `src/components/*.astro`는 `getCollection`을 호출하지 않는다. 템플릿은 `{ko,en}` 객체를 직접 열지 않고 `pick()`만 쓴다.
- 커밋 메시지는 Conventional Commits (`type(scope): subject`). 커밋 끝에 `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- 줄바꿈 LF (`.gitattributes`에 이미 `* text=auto eol=lf`).
- 스크린샷 PNG는 파일당 1.5MB 이하.
- Lighthouse 예산은 2차 계획. 이 계획에서는 랜딩 페이지 클라이언트 JS가 ProjectFilter 아일랜드 하나뿐이어야 한다.
- 셸: PowerShell 또는 Git Bash. 아래 명령은 Git Bash 기준. PowerShell에서는 `&&` 대신 `;`.
- 참고 자료 폴더 `포트폴리오 참고 자료/`는 읽지 않는다(gitignore 됨).

---

## File Structure (이 계획이 만드는 파일)

```
.editorconfig  .npmrc  .nvmrc  .prettierrc  .prettierignore
.husky/commit-msg  commitlint.config.mjs
astro.config.ts  biome.json  package.json  pnpm-workspace.yaml  tsconfig.json
vitest.config.ts  playwright.config.ts  vercel.json
.github/workflows/ci.yml  .github/dependabot.yml  .github/PULL_REQUEST_TEMPLATE.md
.env.example  README.md  CONTRIBUTING.md  LICENSE
content/profile.yaml  content/skills.yaml  content/experience.yaml
content/projects/sample-project/{meta.yaml, ko.md, en.md, screens/01-home@desktop.png}
docs/adr/README.md  docs/adr/0001~0007-*.md  docs/architecture.md  docs/content-guide.md
public/robots.txt  public/favicon.svg
scripts/new-adr.ts  scripts/content-status.ts
src/content.config.ts
src/content/schemas.ts
src/i18n/locales.ts  src/i18n/ui.ts
src/lib/localized.ts  src/lib/urls.ts  src/lib/story.ts  src/lib/deploy.ts  src/lib/content.ts  src/lib/adr.ts
src/lib/*.test.ts  (localized, urls, story, deploy, adr, ui-keys, schemas, content-parity, skills-references, screens-size)
src/layouts/Base.astro
src/components/{Header,Footer,LanguageToggle,ProjectCard,MetricStrip,RoleBlock,ScreenshotGallery,AiEvidence,SkillsByProject,ExperienceList,FallbackNotice,AdrList}.astro
src/islands/ProjectFilter.tsx  src/islands/ProjectFilter.test.tsx
src/pages/[...lang]/index.astro  src/pages/[...lang]/projects/[slug].astro
src/pages/[...lang]/resume.astro  src/pages/[...lang]/colophon.astro
src/styles/global.css
tests/e2e/smoke.spec.ts  tests/e2e/a11y.spec.ts  tests/e2e/seo.spec.ts
```

책임:
- `src/i18n/locales.ts` 로케일 타입과 파라미터 변환. `src/i18n/ui.ts` UI 문자열 딕셔너리.
- `src/lib/urls.ts` 로케일 URL 계산. `src/lib/localized.ts` `{ko,en}` 풀기. `src/lib/story.ts` 케이스 스터디 본문 규칙. `src/lib/deploy.ts` 배포 정보. `src/lib/adr.ts` ADR 파일명/상태 파싱. `src/lib/content.ts` 컬렉션 조회를 뷰 객체로.
- `src/content/schemas.ts` Zod 스키마(이미지 검증기 주입). `src/content.config.ts` 로더 연결.
- `src/layouts/Base.astro` 문서 골격 + SEO 메타 전부.
- `src/components/` 표현 전용. `src/islands/` 클라이언트 상태.

---

### Task 1: 툴체인 고정과 Astro 스캐폴드

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `.nvmrc`, `.npmrc`, `tsconfig.json`, `astro.config.ts`, `src/pages/index.astro`(임시, Task 4에서 삭제), `src/styles/global.css`, `src/env.d.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `pnpm dev/build/preview/check` 스크립트. 이후 모든 태스크가 `pnpm build`를 검증 수단으로 쓴다.

- [ ] **Step 1: pnpm 설치 (Corepack)**

```bash
corepack enable && corepack prepare pnpm@10.34.5 --activate && pnpm -v
```
Expected: `10.34.5`

왜: `packageManager` 필드 + Corepack이면 레포를 클론한 누구나 lockfile을 만든 것과 같은 pnpm을 쓴다. 재현성의 첫 단추다.

- [ ] **Step 2: package.json 작성**

```json
{
  "name": "hello-iam-doik",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.34.5",
  "engines": { "node": "24.x" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check"
  },
  "dependencies": {
    "astro": "7.2.10"
  },
  "devDependencies": {
    "@astrojs/check": "0.9.10",
    "typescript": "6.0.3"
  }
}
```

- [ ] **Step 3: 고정 파일들**

`pnpm-workspace.yaml`:
```yaml
onlyBuiltDependencies:
  - sharp
  - esbuild
```
왜: pnpm 10은 의존성의 postinstall 스크립트를 기본 차단한다. sharp(이미지)와 esbuild는 바이너리를 내려받아야 하므로 명시적으로 허용한다. "패키지 설치는 코드 실행"이라는 교훈을 파일로 남기는 것.

`.nvmrc`:
```
24
```
`.npmrc`:
```
engine-strict=true
```
`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strictest",
  "compilerOptions": {
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": [".astro/types.d.ts", "src/**/*", "scripts/**/*", "tests/**/*", "*.ts", "*.mjs"],
  "exclude": ["dist", "node_modules"]
}
```
`src/env.d.ts`:
```ts
/// <reference path="../.astro/types.d.ts" />
```
`astro.config.ts`:
```ts
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://hello-iam-doik.vercel.app",
  trailingSlash: "always",
  build: { format: "directory" },
});
```
`src/styles/global.css` (Tailwind는 Task 7에서 추가):
```css
:root { color-scheme: light dark; }
body { margin: 0; font-family: system-ui, sans-serif; }
```
`src/pages/index.astro`:
```astro
---
import "../styles/global.css";
---
<html lang="ko"><head><meta charset="utf-8" /><title>Hello, I am Doik</title></head>
<body><h1>bootstrap ok</h1></body></html>
```

`.gitignore`에 추가:
```
.astro/
*.tsbuildinfo
```

- [ ] **Step 4: 설치와 빌드**

```bash
pnpm install && pnpm check && pnpm build && ls dist
```
Expected: `pnpm check` 0 errors, `dist/index.html` 존재. sharp 관련 경고가 없어야 한다(있으면 `pnpm-workspace.yaml` 확인).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: scaffold astro 7 with pinned toolchain"
```

---

### Task 2: 품질 도구 (Biome, Prettier, Vitest, commitlint)

**Files:**
- Create: `biome.json`, `.prettierrc`, `.prettierignore`, `.editorconfig`, `vitest.config.ts`, `commitlint.config.mjs`, `.husky/commit-msg`, `src/lib/smoke.test.ts`(임시)
- Modify: `package.json`

**Interfaces:**
- Produces: `pnpm lint`, `pnpm format`, `pnpm test`, `pnpm test:watch`. 이후 태스크의 모든 `*.test.ts`가 Vitest로 실행된다.

- [ ] **Step 1: 의존성 추가**

```bash
pnpm add -D @biomejs/biome@2.5.11 prettier@3.9.6 prettier-plugin-astro@0.14.1 vitest@4.1.11 husky@9.1.7 @commitlint/cli@21.2.2 @commitlint/config-conventional@21.2.2
```

- [ ] **Step 2: 설정 파일**

`biome.json`:
```json
{
  "$schema": "https://biomejs.dev/schemas/2.5.11/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "includes": ["**", "!**/*.astro", "!dist", "!.astro"] },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
  "linter": { "enabled": true, "rules": { "recommended": true, "a11y": { "recommended": true } } },
  "javascript": { "formatter": { "quoteStyle": "double" } }
}
```
왜 .astro를 제외하나: Biome의 .astro 포맷은 아직 실험 단계다. Prettier가 .astro만 맡고, 두 도구는 확장자로 분리되어 절대 같은 파일을 두고 다투지 않는다.

`.prettierrc`:
```json
{ "plugins": ["prettier-plugin-astro"], "overrides": [{ "files": "*.astro", "options": { "parser": "astro" } }] }
```
`.prettierignore`:
```
*
!src/**/*.astro
```
`.editorconfig`:
```
root = true
[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
```
`vitest.config.ts`:
```ts
/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
    environment: "node",
  },
});
```
`commitlint.config.mjs`:
```js
export default { extends: ["@commitlint/config-conventional"] };
```

- [ ] **Step 3: package.json 스크립트**

`scripts`에 추가:
```json
"lint": "biome ci . && prettier --check \"src/**/*.astro\"",
"format": "biome check --write . && prettier --write \"src/**/*.astro\"",
"test": "vitest run",
"test:watch": "vitest",
"prepare": "husky"
```

- [ ] **Step 4: husky 훅**

```bash
pnpm exec husky init && printf 'pnpm exec commitlint --edit "$1"\n' > .husky/commit-msg && rm -f .husky/pre-commit
```
확인: `.husky/commit-msg` 내용이 위 한 줄. `pre-commit`은 없어야 한다(스펙 §7: 로컬 훅은 commit-msg 하나).

- [ ] **Step 5: 실패하는 임시 테스트로 Vitest 배선 확인**

`src/lib/smoke.test.ts`:
```ts
import { expect, test } from "vitest";
test("vitest runs", () => { expect(1 + 1).toBe(3); });
```
```bash
pnpm test
```
Expected: 1 failed (`expected 2 to be 3`). 실패를 봐야 테스트가 실제로 도는 걸 안다. 그 다음 `toBe(2)`로 고치고 다시 실행 → 1 passed. 파일은 Task 4에서 진짜 테스트가 생기면 삭제.

- [ ] **Step 6: 린트 통과 확인과 훅 동작 확인**

```bash
pnpm format && pnpm lint && git add -A && git commit -m "bad message"
```
Expected: 마지막 커밋이 commitlint에 의해 거부됨 (`subject may not be empty`/`type may not be empty`). 그 다음:
```bash
git commit -m "chore: add biome, prettier, vitest and commitlint"
```
Expected: 성공.

---

### Task 3: ADR 관행 (템플릿, 생성 스크립트, 첫 ADR 4개)

**Files:**
- Create: `docs/adr/README.md`, `scripts/new-adr.ts`, `src/lib/adr.ts`, `src/lib/adr.test.ts`, `docs/adr/0001-astro-over-nextjs.md`, `docs/adr/0002-static-only-and-the-ai-seam.md`, `docs/adr/0006-tooling-biome-prettier-ts6.md`, `docs/adr/0007-ci-is-the-gate-one-local-hook.md`
- Modify: `package.json`

**Interfaces:**
- Produces: `src/lib/adr.ts`
  - `nextAdrNumber(existing: string[]): number` — 파일명 배열에서 다음 번호
  - `slugify(title: string): string`
  - `adrFileName(n: number, title: string): string` → `0003-korean-unprefixed.md`
  - `parseAdrFrontmatter(md: string): { title: string; status: AdrStatus; date: string }`
  - `type AdrStatus = "proposed" | "accepted" | "deprecated" | "superseded"`
- Produces: `pnpm adr "title"`가 `docs/adr/NNNN-slug.md`를 오늘 날짜·`status: proposed`로 생성.

- [ ] **Step 1: 실패하는 테스트**

`src/lib/adr.test.ts`:
```ts
import { describe, expect, test } from "vitest";
import { adrFileName, nextAdrNumber, parseAdrFrontmatter, slugify } from "./adr";

describe("nextAdrNumber", () => {
  test("starts at 1 when empty", () => expect(nextAdrNumber([])).toBe(1));
  test("takes max + 1, ignoring non-adr files", () => {
    expect(nextAdrNumber(["README.md", "0001-a.md", "0007-b.md"])).toBe(8);
  });
});

test("slugify keeps ascii words, drops the rest", () => {
  expect(slugify("Korean unprefixed, English prefixed!")).toBe("korean-unprefixed-english-prefixed");
});

test("adrFileName zero-pads to 4", () => {
  expect(adrFileName(3, "Hero only 3D")).toBe("0003-hero-only-3d.md");
});

test("parseAdrFrontmatter reads title/status/date", () => {
  const md = `---\ntitle: Astro over Next.js\nstatus: accepted\ndate: 2026-09-02\n---\n\n# body`;
  expect(parseAdrFrontmatter(md)).toEqual({ title: "Astro over Next.js", status: "accepted", date: "2026-09-02" });
});

test("parseAdrFrontmatter rejects unknown status", () => {
  expect(() => parseAdrFrontmatter(`---\ntitle: x\nstatus: maybe\ndate: 2026-01-01\n---`)).toThrow(/status/);
});
```

- [ ] **Step 2: 실패 확인**

```bash
pnpm test src/lib/adr.test.ts
```
Expected: FAIL, `Cannot find module './adr'`.

- [ ] **Step 3: 구현**

`src/lib/adr.ts`:
```ts
export type AdrStatus = "proposed" | "accepted" | "deprecated" | "superseded";
const STATUSES: readonly AdrStatus[] = ["proposed", "accepted", "deprecated", "superseded"];
const ADR_FILE = /^(\d{4})-.*\.md$/;

export function nextAdrNumber(existing: string[]): number {
  const nums = existing.map((f) => ADR_FILE.exec(f)?.[1]).filter((n): n is string => n !== undefined);
  return nums.length === 0 ? 1 : Math.max(...nums.map(Number)) + 1;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function adrFileName(n: number, title: string): string {
  return `${String(n).padStart(4, "0")}-${slugify(title)}.md`;
}

export function parseAdrFrontmatter(md: string): { title: string; status: AdrStatus; date: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(md);
  if (!m) throw new Error("ADR is missing frontmatter");
  const fields = new Map<string, string>();
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) fields.set(line.slice(0, i).trim(), line.slice(i + 1).trim());
  }
  const title = fields.get("title");
  const status = fields.get("status");
  const date = fields.get("date");
  if (!title || !status || !date) throw new Error("ADR frontmatter needs title, status, date");
  if (!STATUSES.includes(status as AdrStatus)) throw new Error(`Unknown ADR status: ${status}`);
  return { title, status: status as AdrStatus, date };
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
pnpm test src/lib/adr.test.ts
```
Expected: 6 passed.

- [ ] **Step 5: 템플릿과 생성 스크립트**

`docs/adr/README.md`:
```markdown
# Architecture Decision Records

ADR은 결정 하나를 날짜·번호와 함께 기록한 짧은 문서다. 수정하지 않고, 바뀌면 새 ADR이 이전 것을 supersede한다.
면접관은 이 폴더를 60초 안에 읽고 "왜 이렇게 했는지"를 본다. 나(작성자)에게는 학습 노트다.

- 생성: `pnpm adr "제목"` → `NNNN-slug.md`, `status: proposed`
- 채택되면 `status: accepted`로 바꾸는 것만 허용
- 사이트의 `/colophon/`이 이 폴더를 그대로 렌더한다 (`src/content.config.ts`의 `adrs` 컬렉션)

## 템플릿 (MADR 4.0 minimal + Try it + What I learned)

```markdown
---
title: <제목>
status: proposed
date: YYYY-MM-DD
---

# <제목>

## Context and Problem Statement
어떤 문제였고 왜 지금 결정해야 했는가. 2~4문장.

## Considered Options
- 옵션 A
- 옵션 B

## Decision Outcome
선택: 옵션 A. 이유 한 문단.

### Consequences
- 좋은 점:
- 나쁜 점 / 감수한 것:
- 되돌리는 조건(deletion trigger):

## Try it (5분 실험)
이 결정을 눈으로 확인하는 명령 하나와 기대 결과.

## What I learned
이 결정으로 새로 이해한 기본 개념 한 문단.
```
```

`scripts/new-adr.ts`:
```ts
import { mkdirSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { adrFileName, nextAdrNumber } from "../src/lib/adr";

const title = process.argv.slice(2).join(" ").trim();
if (!title) {
  console.error('usage: pnpm adr "Decision title"');
  process.exit(1);
}
const dir = join(process.cwd(), "docs", "adr");
mkdirSync(dir, { recursive: true });
const n = nextAdrNumber(readdirSync(dir));
const file = join(dir, adrFileName(n, title));
if (existsSync(file)) throw new Error(`exists: ${file}`);
const date = new Date().toISOString().slice(0, 10);
writeFileSync(
  file,
  `---
title: ${title}
status: proposed
date: ${date}
---

# ${title}

## Context and Problem Statement

## Considered Options
- 

## Decision Outcome
선택: 

### Consequences
- 좋은 점:
- 나쁜 점 / 감수한 것:
- 되돌리는 조건(deletion trigger):

## Try it (5분 실험)

## What I learned

`,
);
console.log(`created ${file}`);
```

`package.json` scripts에 추가 후 tsx 설치:
```bash
pnpm add -D tsx@4.23.13
```
```json
"adr": "tsx scripts/new-adr.ts"
```

- [ ] **Step 6: 첫 ADR 4개 작성**

`pnpm adr "Astro over Next.js"`로 0001을 만든 뒤 내용을 채운다. 나머지 셋도 같은 방식. 번호를 맞추기 위해 순서대로 만들고, 0003~0005는 Task 4·6·2차 계획에서 만들므로 여기서는 0001, 0002 다음에 `pnpm adr`가 0003을 내놓는다. 따라서 0006, 0007은 파일명을 직접 정해 생성한다:

```bash
pnpm adr "Astro over Next.js"
pnpm adr "Static only and the AI seam"
```
`docs/adr/0006-tooling-biome-prettier-ts6.md`, `docs/adr/0007-ci-is-the-gate-one-local-hook.md`를 템플릿 그대로 손으로 만든다. 모두 `status: accepted`, `date: 2026-09-02`.

각 ADR의 Decision Outcome 요지 (스펙 §2 표에서 그대로):

0001 Astro over Next.js — 정적 콘텐츠 사이트 + 위젯 두세 개에는 Astro가 부품 4개(콘텐츠 레이어, i18n 라이브러리, sharp 스크립트, 루트 리다이렉트)를 줄여준다. 키워드 손실은 React 아일랜드와 이 문서로 상쇄. Try it: `pnpm build && ls dist/_astro` 에 JS 파일이 없음(아일랜드 추가 전). 되돌리는 조건: 사이트 절반 이상이 클라이언트 상태를 갖게 될 때.

0002 Static only and the AI seam — 어댑터를 설치하지 않은 것이 가드레일. 나중 절차 5단계(스펙 §10)를 그대로 적는다. Try it: `src/pages/api/x.ts`에 `export const prerender=false`를 넣고 `pnpm build` → "adapter required" 실패 확인 후 삭제.

0006 Tooling — Biome(ts/json/css) + Prettier(.astro), TS 6 고정. deletion trigger: Biome .astro 포맷이 stable이 되면 Prettier 제거, @astrojs/check가 TS 7을 peer로 허용하면 TS 7. Try it: `.astro` 파일 들여쓰기를 망가뜨리고 `pnpm lint` → Prettier가 잡음.

0007 CI is the gate — 로컬 훅은 commit-msg(commitlint) 하나. 포맷·테스트는 CI가 막는다. 이유: 훅은 규칙의 두 번째 복사본이라 드리프트하고 Windows에서 성가시다. 커밋 메시지만은 이미 히스토리에 박히면 CI가 늦으므로 예외. Try it: `git commit -m "bad"` 거부 확인.

- [ ] **Step 7: 검증과 커밋**

```bash
pnpm test && pnpm lint && ls docs/adr
```
Expected: 테스트 통과, `README.md 0001-astro-over-nextjs.md 0002-static-only-and-the-ai-seam.md 0006-... 0007-...`.
```bash
git add -A && git commit -m "docs: add ADR practice with generator and first four decisions"
```

---

### Task 4: i18n 기반 — 로케일, URL 함수, UI 딕셔너리, `[...lang]` 스파이크

**Files:**
- Create: `src/i18n/locales.ts`, `src/i18n/ui.ts`, `src/lib/urls.ts`, `src/lib/urls.test.ts`, `src/lib/locales.test.ts`, `src/lib/ui-keys.test.ts`, `src/pages/[...lang]/index.astro`, `docs/adr/0003-korean-unprefixed-english-prefixed-one-template-set.md`
- Modify: `astro.config.ts`
- Delete: `src/pages/index.astro`, `src/lib/smoke.test.ts`

**Interfaces:**
- Produces `src/i18n/locales.ts`:
  - `export const LOCALES = ["ko", "en"] as const; export type Locale = (typeof LOCALES)[number];`
  - `export const DEFAULT_LOCALE: Locale = "ko";`
  - `export function isLocale(x: unknown): x is Locale`
  - `export function localeFromParam(param: string | undefined): Locale` — `undefined` → `"ko"`, `"en"` → `"en"`, 그 외 throw
  - `export function otherLocale(l: Locale): Locale`
  - `export const LANG_TAG: Record<Locale, string> = { ko: "ko-KR", en: "en-US" }`
  - `export function localeStaticPaths(): { params: { lang: string | undefined } }[]`
- Produces `src/lib/urls.ts`:
  - `export function localePath(locale: Locale, path: string): string` — `path`는 `/`로 시작·끝. ko면 그대로, en이면 `/en` 접두
  - `export function stripLocale(pathname: string): { locale: Locale; path: string }`
  - `export function swapLocale(pathname: string, to: Locale): string`
- Produces `src/i18n/ui.ts`: `export type UIKey`, `export function t(locale: Locale, key: UIKey): string`, `export const ui: Record<Locale, Record<UIKey, string>>`

- [ ] **Step 1: 실패하는 테스트 3개 파일**

`src/lib/locales.test.ts`:
```ts
import { describe, expect, test } from "vitest";
import { DEFAULT_LOCALE, isLocale, localeFromParam, localeStaticPaths, otherLocale } from "../i18n/locales";

describe("localeFromParam", () => {
  test("undefined is the default locale", () => expect(localeFromParam(undefined)).toBe("ko"));
  test("en is en", () => expect(localeFromParam("en")).toBe("en"));
  test("anything else throws", () => expect(() => localeFromParam("fr")).toThrow(/locale/i));
});
test("isLocale", () => {
  expect(isLocale("ko")).toBe(true);
  expect(isLocale("EN")).toBe(false);
  expect(isLocale(undefined)).toBe(false);
});
test("otherLocale flips", () => {
  expect(otherLocale("ko")).toBe("en");
  expect(otherLocale("en")).toBe("ko");
});
test("localeStaticPaths yields undefined for default and prefix for others", () => {
  expect(localeStaticPaths()).toEqual([{ params: { lang: undefined } }, { params: { lang: "en" } }]);
  expect(DEFAULT_LOCALE).toBe("ko");
});
```

`src/lib/urls.test.ts`:
```ts
import { describe, expect, test } from "vitest";
import { localePath, stripLocale, swapLocale } from "./urls";

describe("localePath", () => {
  test("ko is unprefixed", () => expect(localePath("ko", "/projects/x/")).toBe("/projects/x/"));
  test("en is prefixed", () => expect(localePath("en", "/projects/x/")).toBe("/en/projects/x/"));
  test("root", () => {
    expect(localePath("ko", "/")).toBe("/");
    expect(localePath("en", "/")).toBe("/en/");
  });
  test("rejects paths without leading and trailing slash", () => {
    expect(() => localePath("ko", "projects/")).toThrow();
    expect(() => localePath("ko", "/projects")).toThrow();
  });
});

describe("stripLocale", () => {
  test("en prefix", () => expect(stripLocale("/en/projects/x/")).toEqual({ locale: "en", path: "/projects/x/" }));
  test("en root", () => expect(stripLocale("/en/")).toEqual({ locale: "en", path: "/" }));
  test("ko", () => expect(stripLocale("/projects/x/")).toEqual({ locale: "ko", path: "/projects/x/" }));
  test("a page that merely starts with en is not english", () =>
    expect(stripLocale("/english-notes/")).toEqual({ locale: "ko", path: "/english-notes/" }));
});

describe("swapLocale round-trips", () => {
  test("ko → en → ko", () => {
    const en = swapLocale("/projects/x/", "en");
    expect(en).toBe("/en/projects/x/");
    expect(swapLocale(en, "ko")).toBe("/projects/x/");
  });
  test("same locale is identity", () => expect(swapLocale("/en/resume/", "en")).toBe("/en/resume/"));
});
```

`src/lib/ui-keys.test.ts`:
```ts
import { expect, test } from "vitest";
import { LOCALES } from "../i18n/locales";
import { ui } from "../i18n/ui";

test("every UI string is non-empty in every locale", () => {
  for (const locale of LOCALES) {
    for (const [key, value] of Object.entries(ui[locale])) {
      expect(value.trim(), `${locale}.${key}`).not.toBe("");
    }
  }
});

test("en has exactly the ko keys", () => {
  expect(Object.keys(ui.en).sort()).toEqual(Object.keys(ui.ko).sort());
});
```

- [ ] **Step 2: 실패 확인**

```bash
pnpm test
```
Expected: 3개 파일 모두 `Cannot find module`로 FAIL.

- [ ] **Step 3: 구현**

`src/i18n/locales.ts`:
```ts
export const LOCALES = ["ko", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ko";
export const LANG_TAG: Record<Locale, string> = { ko: "ko-KR", en: "en-US" };

export function isLocale(x: unknown): x is Locale {
  return typeof x === "string" && (LOCALES as readonly string[]).includes(x);
}

/** `[...lang]` 라우트 파라미터를 로케일로. undefined = 접두 없는 기본 로케일. */
export function localeFromParam(param: string | undefined): Locale {
  if (param === undefined) return DEFAULT_LOCALE;
  if (isLocale(param) && param !== DEFAULT_LOCALE) return param;
  throw new Error(`Unknown locale segment: ${param}`);
}

export function otherLocale(l: Locale): Locale {
  return l === "ko" ? "en" : "ko";
}

/** 모든 [...lang] 페이지의 getStaticPaths가 쓰는 공통 목록. */
export function localeStaticPaths(): { params: { lang: string | undefined } }[] {
  return LOCALES.map((l) => ({ params: { lang: l === DEFAULT_LOCALE ? undefined : l } }));
}
```

`src/lib/urls.ts`:
```ts
import { DEFAULT_LOCALE, type Locale, isLocale } from "../i18n/locales";

function assertCanonicalPath(path: string): void {
  if (!path.startsWith("/") || !path.endsWith("/")) {
    throw new Error(`path must start and end with "/": ${path}`);
  }
}

export function localePath(locale: Locale, path: string): string {
  assertCanonicalPath(path);
  return locale === DEFAULT_LOCALE ? path : `/${locale}${path}`;
}

export function stripLocale(pathname: string): { locale: Locale; path: string } {
  const [, first = "", ...rest] = pathname.split("/");
  if (isLocale(first) && first !== DEFAULT_LOCALE) {
    const path = `/${rest.join("/")}`;
    return { locale: first, path: path.endsWith("/") ? path : `${path}/` };
  }
  return { locale: DEFAULT_LOCALE, path: pathname };
}

export function swapLocale(pathname: string, to: Locale): string {
  return localePath(to, stripLocale(pathname).path);
}
```

`src/i18n/ui.ts` (키는 이후 태스크에서 늘어난다. 늘릴 때 ko에 먼저 쓰고 en 누락은 컴파일 에러로 잡힌다):
```ts
import type { Locale } from "./locales";

const ko = {
  "site.title": "이도익 | 웹·AI 개발자",
  "nav.projects": "프로젝트",
  "nav.resume": "이력서",
  "nav.colophon": "이 사이트에 대해",
  "toggle.label": "English",
  "toggle.aria": "영어로 보기",
  "hero.cta.projects": "프로젝트 보기",
  "section.projects": "프로젝트",
  "section.skills": "이걸로 만들었습니다",
  "section.experience": "경력과 교육",
  "section.contact": "연락처",
  "project.role": "역할",
  "project.teamSize": "팀 규모",
  "project.owned": "내가 맡은 것",
  "project.metrics": "결과 지표",
  "project.method": "측정 방법",
  "project.evidence": "근거",
  "project.screens": "화면",
  "project.captured": "캡처",
  "project.links": "링크",
  "project.repo": "저장소",
  "project.live": "라이브",
  "project.keyCommits": "핵심 커밋",
  "project.demoCredentials": "데모 계정",
  "story.problem": "문제",
  "story.approach": "접근",
  "story.result": "결과",
  "story.learned": "배운 점",
  "story.fallbackNotice": "이 글은 아직 번역되지 않아 한국어 원문을 보여줍니다.",
  "ai.title": "AI 구성과 검증",
  "ai.models": "모델",
  "ai.prompt": "프롬프트 파일",
  "ai.evals": "평가",
  "ai.judge": "판정",
  "ai.cost": "요청당 비용",
  "ai.latency": "p50 지연",
  "ai.failureModes": "알려진 실패 모드",
  "ai.rejected": "기각한 대안",
  "status.live": "운영 중",
  "status.archived": "보관",
  "status.wip": "진행 중",
  "filter.all": "전체",
  "filter.count": "개 프로젝트",
  "filter.label": "스택으로 거르기",
  "resume.print": "인쇄 / PDF로 저장",
  "colophon.title": "이 사이트에 대해",
  "colophon.adrs": "설계 결정 기록",
  "footer.deployed": "마지막 배포",
} as const;

export type UIKey = keyof typeof ko;

const en = {
  "site.title": "Doik Lee | Web & AI Developer",
  "nav.projects": "Projects",
  "nav.resume": "Resume",
  "nav.colophon": "About this site",
  "toggle.label": "한국어",
  "toggle.aria": "View in Korean",
  "hero.cta.projects": "See projects",
  "section.projects": "Projects",
  "section.skills": "What I built with it",
  "section.experience": "Experience & education",
  "section.contact": "Contact",
  "project.role": "Role",
  "project.teamSize": "Team size",
  "project.owned": "What I owned",
  "project.metrics": "Outcomes",
  "project.method": "How measured",
  "project.evidence": "Evidence",
  "project.screens": "Screens",
  "project.captured": "Captured",
  "project.links": "Links",
  "project.repo": "Repository",
  "project.live": "Live",
  "project.keyCommits": "Key commits",
  "project.demoCredentials": "Demo account",
  "story.problem": "Problem",
  "story.approach": "Approach",
  "story.result": "Result",
  "story.learned": "What I learned",
  "story.fallbackNotice": "This case study is not translated yet; the Korean version is shown.",
  "ai.title": "AI setup and validation",
  "ai.models": "Models",
  "ai.prompt": "Prompt file",
  "ai.evals": "Evals",
  "ai.judge": "Judge",
  "ai.cost": "Cost per request",
  "ai.latency": "p50 latency",
  "ai.failureModes": "Known failure modes",
  "ai.rejected": "Rejected alternative",
  "status.live": "Live",
  "status.archived": "Archived",
  "status.wip": "In progress",
  "filter.all": "All",
  "filter.count": " projects",
  "filter.label": "Filter by stack",
  "resume.print": "Print / Save as PDF",
  "colophon.title": "About this site",
  "colophon.adrs": "Architecture decision records",
  "footer.deployed": "Last deployed",
} satisfies Record<UIKey, string>;

export const ui: Record<Locale, Record<UIKey, string>> = { ko, en };

export function t(locale: Locale, key: UIKey): string {
  return ui[locale][key];
}
```
왜 `satisfies`인가: `en`을 `Record<UIKey,string>`로 선언하면 타입이 넓어져 오타 키를 못 잡는다. `satisfies`는 모양만 검사하고 리터럴 타입은 유지한다. 키가 빠지면 이 파일이 컴파일되지 않는다.

- [ ] **Step 4: 테스트 통과**

```bash
pnpm test
```
Expected: locales/urls/ui-keys 모두 PASS. 그 다음 `src/lib/smoke.test.ts` 삭제.

- [ ] **Step 5: `[...lang]` 라우팅 스파이크**

`astro.config.ts`:
```ts
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://hello-iam-doik.vercel.app",
  trailingSlash: "always",
  build: { format: "directory" },
  i18n: {
    defaultLocale: "ko",
    locales: ["ko", "en"],
    routing: { prefixDefaultLocale: false },
  },
});
```

`src/pages/index.astro` 삭제. `src/pages/[...lang]/index.astro`:
```astro
---
import "../../styles/global.css";
import { localeFromParam, localeStaticPaths, otherLocale } from "../../i18n/locales";
import { t } from "../../i18n/ui";
import { swapLocale } from "../../lib/urls";

export function getStaticPaths() {
  return localeStaticPaths();
}

const locale = localeFromParam(Astro.params.lang);
const other = otherLocale(locale);
---
<html lang={locale}>
  <head><meta charset="utf-8" /><title>{t(locale, "site.title")}</title></head>
  <body>
    <h1>{t(locale, "site.title")}</h1>
    <a href={swapLocale(Astro.url.pathname, other)} hreflang={other} lang={other}>{t(locale, "toggle.label")}</a>
  </body>
</html>
```

```bash
pnpm build && ls dist dist/en && grep -o 'href="[^"]*"' dist/index.html dist/en/index.html
```
Expected:
- `dist/index.html`, `dist/en/index.html` 존재.
- `dist/index.html`의 링크가 `/en/`, `dist/en/index.html`의 링크가 `/`.

실패하는 경우(rest 파라미터가 루트에 매치되지 않거나 i18n 설정과 충돌): 스펙 §5의 대안으로 간다. `src/pages/index.astro` + `src/pages/en/index.astro`가 공통 컴포넌트를 렌더하는 미러 구조로 바꾸고, 두 폴더의 파일 목록이 일치하는지 검사하는 테스트를 `src/lib/pages-parity.test.ts`에 추가한다. 어느 쪽이든 결과를 ADR-0003에 기록한다.

- [ ] **Step 6: ADR-0003**

```bash
pnpm adr "Korean unprefixed, English prefixed, one template set"
```
내용: `/`=ko, `/en/`=en. 정적 호스트에는 Accept-Language를 읽을 서버가 없으므로 URL이 유일한 로케일 신호. `[...lang]` rest 파라미터에 `undefined`를 넣으면 루트에 매치되어 템플릿 한 벌로 두 트리를 만든다(Step 5의 실제 결과 기록). 되돌리는 조건: 세 번째 로케일 또는 로케일별 다른 페이지 구성. Try it: `pnpm build && ls dist/en`. `status: accepted`.

- [ ] **Step 7: Commit**

```bash
pnpm lint && git add -A && git commit -m "feat(i18n): locale routing with one template set, typed ui dictionary"
```

---

### Task 5: 콘텐츠 스키마와 순수 헬퍼 (`pick`, story 규칙)

**Files:**
- Create: `src/content/schemas.ts`, `src/lib/schemas.test.ts`, `src/lib/localized.ts`, `src/lib/localized.test.ts`, `src/lib/story.ts`, `src/lib/story.test.ts`

**Interfaces:**
- Produces `src/content/schemas.ts` (Zod 4, `import { z } from "astro/zod"`):
  - `export const localized`, `export type Localized = { ko: string; en: string }`
  - `export type ImageValidator = () => z.ZodTypeAny`
  - `export const projectSchema = (image: ImageValidator) => z.object({...})` — 필드는 스펙 §4 그대로
  - `export const skillSchema = (referenceProjects: () => z.ZodTypeAny) => ...`, `export const experienceSchema`, `export const profileSchema`
  - `export type ProjectData`, `MetricData`, `ExperienceData`, `ProfileData`, `SkillGroup`
- Produces `src/lib/localized.ts`: `export function pick(v: Localized, locale: Locale): string`
- Produces `src/lib/story.ts`:
  - `export const STORY_SECTIONS = ["problem", "approach", "result", "learned"] as const`
  - `export function requiredHeadings(locale: Locale): string[]` — `ui`의 `story.*` 값
  - `export function missingHeadings(markdown: string, locale: Locale): string[]`

- [ ] **Step 1: 실패하는 테스트**

`src/lib/localized.test.ts`:
```ts
import { expect, test } from "vitest";
import { pick } from "./localized";

test("pick returns the requested locale", () => {
  expect(pick({ ko: "안녕", en: "hi" }, "ko")).toBe("안녕");
  expect(pick({ ko: "안녕", en: "hi" }, "en")).toBe("hi");
});
```

`src/lib/story.test.ts`:
```ts
import { describe, expect, test } from "vitest";
import { missingHeadings, requiredHeadings } from "./story";

describe("requiredHeadings", () => {
  test("ko", () => expect(requiredHeadings("ko")).toEqual(["문제", "접근", "결과", "배운 점"]));
  test("en", () => expect(requiredHeadings("en")).toEqual(["Problem", "Approach", "Result", "What I learned"]));
});

describe("missingHeadings", () => {
  const ok = "# 제목\n\n## 문제\n...\n## 접근\n...\n## 결과\n...\n## 배운 점\n...";
  test("complete story has none missing", () => expect(missingHeadings(ok, "ko")).toEqual([]));
  test("reports missing ones in order", () => {
    expect(missingHeadings("## 문제\n## 결과\n", "ko")).toEqual(["접근", "배운 점"]);
  });
  test("only H2 counts", () => expect(missingHeadings("### 문제\n# 접근\n", "ko")).toContain("문제"));
  test("tolerates trailing spaces and CRLF", () => {
    expect(missingHeadings("## 문제  \r\n## 접근\r\n## 결과\r\n## 배운 점\r\n", "ko")).toEqual([]);
  });
});
```

`src/lib/schemas.test.ts`:
```ts
import { describe, expect, test } from "vitest";
import { z } from "astro/zod";
import { experienceSchema, profileSchema, projectSchema, skillSchema } from "../content/schemas";

const stringImage = () => z.string();
const stringRef = () => z.string();
const L = (ko: string, en = ko) => ({ ko, en });

const validProject = {
  title: L("샘플", "Sample"),
  summary: L("한 줄 요약", "One line"),
  status: "live",
  period: { from: "2026-01-01", to: "2026-03-01" },
  role: { teamSize: 1, owned: L("전부", "Everything") },
  stack: ["astro"],
  links: { repo: "https://github.com/x/y" },
  metrics: [{ label: L("LCP"), after: "1.2", unit: "s", method: L("Lighthouse 3회 중앙값", "median of 3 Lighthouse runs") }],
  screens: [{ src: "./screens/01-home@desktop.png", alt: L("홈", "Home"), device: "desktop", capturedAt: "2026-09-02" }],
  featured: true,
  order: 1,
  updatedAt: "2026-09-02",
};

describe("projectSchema", () => {
  const schema = projectSchema(stringImage);
  test("accepts a minimal valid project and applies defaults", () => {
    const r = schema.parse(validProject);
    expect(r.links.keyCommits).toEqual([]);
    expect(r.ai).toBeUndefined();
  });
  test("requires at least one screen", () => {
    expect(() => schema.parse({ ...validProject, screens: [] })).toThrow();
  });
  test("rejects a bad date", () => {
    expect(() => schema.parse({ ...validProject, updatedAt: "2026/09/02" })).toThrow();
  });
  test("rejects more than four metrics", () => {
    const m = validProject.metrics[0];
    expect(() => schema.parse({ ...validProject, metrics: [m, m, m, m, m] })).toThrow();
  });
  test("ai block requires a judge on each eval", () => {
    const ai = { models: ["claude-sonnet-5"], evals: [{ name: "faithfulness", metric: "score", n: 50, baseline: "0.74", final: "0.86" }] };
    expect(() => schema.parse({ ...validProject, ai })).toThrow(/judge/);
    const withJudge = { ...ai, evals: [{ ...ai.evals[0], judge: "llm-judge" }] };
    expect(schema.parse({ ...validProject, ai: withJudge }).ai?.evals[0]?.judge).toBe("llm-judge");
  });
  test("localized strings must be present in both languages", () => {
    expect(() => schema.parse({ ...validProject, title: { ko: "만" } })).toThrow();
  });
});

describe("skillSchema", () => {
  test("requires at least one project reference and a builtWithIt sentence", () => {
    const s = skillSchema(stringRef);
    const base = { id: "react", name: "React", group: "frontend", builtWithIt: L("x"), since: 2024 };
    expect(() => s.parse({ ...base, projects: [] })).toThrow();
    expect(s.parse({ ...base, projects: ["sample-project"] }).id).toBe("react");
  });
});

test("experienceSchema caps bullets at 4", () => {
  const b = L("b");
  const e = { id: "x", kind: "work", org: L("o"), role: L("r"), from: "2025-01-01", bullets: [b, b, b, b, b] };
  expect(() => experienceSchema.parse(e)).toThrow();
});

test("profileSchema validates email", () => {
  const p = { name: L("n"), tagline: L("t"), bio: L("b"), location: L("l"), email: "not-an-email", links: { github: "https://github.com/x" } };
  expect(() => profileSchema.parse(p)).toThrow();
});
```

- [ ] **Step 2: 실패 확인**

```bash
pnpm test src/lib/localized.test.ts src/lib/story.test.ts src/lib/schemas.test.ts
```
Expected: 3 파일 FAIL (module not found).

- [ ] **Step 3: 구현**

`src/lib/localized.ts`:
```ts
import type { Localized } from "../content/schemas";
import type { Locale } from "../i18n/locales";

/** {ko,en} 객체를 푸는 유일한 지점. 템플릿은 이 함수만 쓴다. */
export function pick(v: Localized, locale: Locale): string {
  return v[locale];
}
```

`src/lib/story.ts`:
```ts
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
```

`src/content/schemas.ts`:
```ts
import { z } from "astro/zod";

export const localized = z.object({ ko: z.string().min(1), en: z.string().min(1) });
export type Localized = z.infer<typeof localized>;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");
const shortSha = z.string().regex(/^[0-9a-f]{7,40}$/);
const url = z.url();

export type ImageValidator = () => z.ZodTypeAny;

export const projectStatus = z.enum(["live", "archived", "wip"]);
export const device = z.enum(["desktop", "mobile"]);
export const evalJudge = z.enum(["exact", "llm-judge", "human"]);

export const metricSchema = z.object({
  label: localized,
  before: z.string().optional(),
  after: z.string(),
  unit: z.string().optional(),
  method: localized,
  evidence: url.optional(),
});

export const screenSchema = (image: ImageValidator) =>
  z.object({
    src: image(),
    alt: localized,
    device,
    capturedAt: isoDate,
    commit: shortSha.optional(),
  });

export const aiSchema = (image: ImageValidator) =>
  z.object({
    models: z.array(z.string().min(1)).min(1),
    architecture: image().optional(),
    promptFile: url.optional(),
    evals: z
      .array(
        z.object({
          name: z.string(),
          metric: z.string(),
          n: z.number().int().positive(),
          baseline: z.string(),
          final: z.string(),
          judge: evalJudge,
        }),
      )
      .default([]),
    rejectedTradeoff: z.object({ option: localized, reasonWithNumbers: localized }).optional(),
    costPerRequest: z.string().optional(),
    latencyP50: z.string().optional(),
    failureModes: z.array(localized).default([]),
  });

export const projectSchema = (image: ImageValidator) =>
  z.object({
    title: localized,
    summary: localized,
    status: projectStatus,
    period: z.object({ from: isoDate, to: isoDate.optional() }),
    role: z.object({ teamSize: z.number().int().min(1), owned: localized }),
    stack: z.array(z.string().min(1)).min(1),
    links: z.object({
      repo: url,
      live: url.optional(),
      demoVideo: url.optional(),
      demoCredentials: z.object({ id: z.string(), password: z.string() }).optional(),
      keyCommits: z.array(z.object({ label: localized, url, why: localized })).default([]),
    }),
    metrics: z.array(metricSchema).max(4),
    screens: z.array(screenSchema(image)).min(1),
    ai: aiSchema(image).optional(),
    featured: z.boolean().default(false),
    order: z.number().int(),
    updatedAt: isoDate,
  });

export const skillGroup = z.enum(["frontend", "ai", "backend", "tooling"]);

export const skillSchema = (referenceProjects: () => z.ZodTypeAny) =>
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    group: skillGroup,
    builtWithIt: localized,
    projects: z.array(referenceProjects()).min(1),
    since: z.number().int().min(2015),
  });

export const experienceSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["work", "education", "bootcamp"]),
  org: localized,
  role: localized,
  from: isoDate,
  to: isoDate.optional(),
  bullets: z.array(localized).max(4),
});

export const profileSchema = z.object({
  name: localized,
  tagline: localized,
  bio: localized,
  location: localized,
  email: z.email(),
  links: z.object({ github: url, linkedin: url.optional() }),
});

export type ProjectData = z.infer<ReturnType<typeof projectSchema>>;
export type MetricData = z.infer<typeof metricSchema>;
export type ExperienceData = z.infer<typeof experienceSchema>;
export type ProfileData = z.infer<typeof profileSchema>;
export type SkillGroup = z.infer<typeof skillGroup>;
```
왜 스키마가 함수인가: 빌드에서는 Astro의 `image()`가 PNG 존재를 검사하고 메타데이터 객체를 만든다. Vitest에는 Astro가 없으므로 `z.string()`을 넣는다. 같은 규칙을 두 런타임에서 돌리려면 검증기를 인자로 받아야 한다. `skills.projects`의 `reference()`도 같은 이유.

- [ ] **Step 4: 통과 확인**

```bash
pnpm test
```
Expected: 전부 PASS.

- [ ] **Step 5: Commit**

```bash
pnpm lint && git add -A && git commit -m "feat(content): zod schemas with injectable validators, pick() and story heading rules"
```

---

### Task 6: 콘텐츠 컬렉션 배선 + 샘플 프로젝트 + 원본 파일 계약 테스트

**Files:**
- Create: `src/content.config.ts`, `content/profile.yaml`, `content/skills.yaml`, `content/experience.yaml`, `content/projects/sample-project/meta.yaml`, `content/projects/sample-project/ko.md`, `content/projects/sample-project/en.md`, `content/projects/sample-project/screens/01-home@desktop.png`, `src/lib/content-files.ts`, `src/lib/content-files.test.ts`, `src/lib/content-contract.test.ts`, `docs/adr/0004-content-model-facts-strings-prose.md`
- Modify: `package.json` (yaml 추가), `src/pages/[...lang]/index.astro` (프로젝트 수 출력으로 배선 확인)

**Interfaces:**
- Produces `src/content.config.ts`: 컬렉션 `profile`, `skills`, `experience`, `projects`, `stories`, `adrs`. 이후 태스크는 `getCollection("projects")` 등을 `src/lib/content.ts`에서만 호출한다.
  - `projects` entry id = 폴더명(slug). `stories` entry id = `<slug>/<locale>`. `adrs` entry id = 파일명(확장자 제외).
- Produces `src/lib/content-files.ts` (테스트와 스크립트가 쓰는 원본 파일 접근, Astro 무관):
  - `export const CONTENT_ROOT = "content"`
  - `export function listProjectSlugs(root?: string): string[]`
  - `export function readYaml<T = unknown>(file: string): T`
  - `export function projectDir(slug: string, root?: string): string`
  - `export function storyPath(slug: string, locale: Locale, root?: string): string`

- [ ] **Step 1: 의존성**

```bash
pnpm add -D yaml@2.9.0
```
왜 devDependency인가: Astro가 빌드에서 YAML을 직접 읽는다. `yaml` 패키지는 Vitest 테스트와 스크립트가 원본 파일을 읽을 때만 쓴다.

- [ ] **Step 2: 샘플 콘텐츠 작성**

`content/profile.yaml`:
```yaml
name: { ko: 이도익, en: Doik Lee }
tagline: { ko: 웹과 AI를 잇는 개발자, en: Developer bridging web and AI }
bio:
  ko: AI 도구로 만들면서 배웠고, 이제 "왜"를 배우는 중입니다. 이 사이트의 모든 결정은 docs/adr에 있습니다.
  en: I learned by building with AI tools and am now learning the "why". Every decision on this site lives in docs/adr.
location: { ko: 대한민국, en: South Korea }
email: lee253628@gmail.com
links:
  github: https://github.com/LeeDoik
```

`content/skills.yaml` (리스트. `file()` 로더는 배열이면 각 항목의 `id`를 키로 쓴다):
```yaml
- id: astro
  name: Astro
  group: frontend
  builtWithIt: { ko: 이 포트폴리오 사이트를 정적으로 만들었습니다, en: Built this portfolio as a static site }
  projects: [sample-project]
  since: 2026
- id: react
  name: React
  group: frontend
  builtWithIt: { ko: 프로젝트 필터 아일랜드를 만들었습니다, en: Built the project filter island }
  projects: [sample-project]
  since: 2024
```

`content/experience.yaml`:
```yaml
- id: sample-bootcamp
  kind: bootcamp
  org: { ko: 예시 부트캠프, en: Example Bootcamp }
  role: { ko: 수료생, en: Graduate }
  from: 2025-01-01
  to: 2025-06-30
  bullets:
    - { ko: 예시 항목. 실제 내용은 3차 계획에서 채웁니다., en: Placeholder bullet. Real content arrives in plan 3. }
```

`content/projects/sample-project/meta.yaml`:
```yaml
title: { ko: 샘플 프로젝트, en: Sample Project }
summary: { ko: 콘텐츠 모델을 검증하기 위한 예시 항목입니다., en: An example entry that exercises the content model. }
status: wip
period: { from: 2026-09-01 }
role:
  teamSize: 1
  owned: { ko: 전체 설계와 구현, en: Whole design and implementation }
stack: [astro, react]
links:
  repo: https://github.com/LeeDoik/hello-iam-doik
  keyCommits:
    - label: { ko: 스키마 도입, en: Introduce schemas }
      url: https://github.com/LeeDoik/hello-iam-doik/commit/0000000
      why: { ko: 콘텐츠 검증이 빌드에 들어온 지점, en: Where content validation entered the build }
metrics:
  - label: { ko: 클라이언트 JS, en: Client JS }
    after: "0"
    unit: KB
    method: { ko: dist/_astro 의 .js 파일 합계, en: Sum of .js files under dist/_astro }
screens:
  - src: ./screens/01-home@desktop.png
    alt: { ko: 샘플 홈 화면, en: Sample home screen }
    device: desktop
    capturedAt: 2026-09-02
featured: true
order: 1
updatedAt: 2026-09-02
```

`content/projects/sample-project/ko.md`:
```markdown
## 문제
콘텐츠 모델이 실제로 빌드에서 검증되는지 확인할 예시가 필요했다.

## 접근
스키마를 함수로 만들어 Vitest와 Astro 양쪽에서 같은 규칙을 돌렸다.

## 결과
없는 필드나 이미지가 빌드를 실패시킨다.

## 배운 점
스키마는 문서이자 타입이자 테스트다.
```

`content/projects/sample-project/en.md`:
```markdown
## Problem
We needed an example that proves the content model is validated at build time.

## Approach
Schemas are functions so the same rules run in Vitest and in Astro.

## Result
A missing field or image fails the build.

## What I learned
A schema is documentation, type source and test in one place.
```

스크린샷: 1×1이 아닌 실제 크기의 PNG가 필요하다(`<Picture>`가 폭을 읽는다). 임시 이미지를 만든다:
```bash
mkdir -p content/projects/sample-project/screens
pnpm add -D @playwright/test@1.62.1 && pnpm exec playwright install chromium
node -e "
const { chromium } = require('@playwright/test');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.setContent('<body style=\"margin:0;background:#eee;font:48px sans-serif;display:grid;place-items:center;height:100vh\">sample-project</body>');
await p.screenshot({ path: 'content/projects/sample-project/screens/01-home@desktop.png' }); await b.close(); })();
"
```
Expected: PNG 파일 생성, 1440×900. (Playwright는 Task 12에서도 쓴다. 여기서 먼저 설치해도 무방.)

- [ ] **Step 3: 실패하는 테스트 — 원본 파일 접근 + 콘텐츠 계약**

`src/lib/content-files.test.ts`:
```ts
import { expect, test } from "vitest";
import { listProjectSlugs, projectDir, readYaml, storyPath } from "./content-files";

test("lists project folders under content/projects", () => {
  expect(listProjectSlugs()).toContain("sample-project");
});

test("readYaml parses meta.yaml", () => {
  const meta = readYaml<{ title: { ko: string } }>(`${projectDir("sample-project")}/meta.yaml`);
  expect(meta.title.ko).toBe("샘플 프로젝트");
});

test("storyPath", () => {
  expect(storyPath("x", "en")).toBe("content/projects/x/en.md");
});
```

`src/lib/content-contract.test.ts` — 스펙 §7의 content-parity, skills-references, story-headings, screens-size:
```ts
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { z } from "astro/zod";
import { describe, expect, test } from "vitest";
import { experienceSchema, profileSchema, projectSchema, skillSchema } from "../content/schemas";
import { LOCALES } from "../i18n/locales";
import { CONTENT_ROOT, listProjectSlugs, projectDir, readYaml, storyPath } from "./content-files";
import { missingHeadings } from "./story";

const MAX_SCREEN_BYTES = 1.5 * 1024 * 1024;
const slugs = listProjectSlugs();
const asString = () => z.string();
const projects = slugs.map((slug) => ({
  slug,
  data: projectSchema(asString).parse(readYaml(join(projectDir(slug), "meta.yaml"))),
}));

describe("every project", () => {
  test.each(slugs)("%s has ko.md with the four required headings", (slug) => {
    const p = storyPath(slug, "ko");
    expect(existsSync(p), `${p} is required`).toBe(true);
    expect(missingHeadings(readFileSync(p, "utf8"), "ko")).toEqual([]);
  });

  test.each(slugs)("%s en.md, when present, has the four required headings", (slug) => {
    const p = storyPath(slug, "en");
    if (existsSync(p)) expect(missingHeadings(readFileSync(p, "utf8"), "en")).toEqual([]);
  });

  test.each(projects)("$slug screenshots exist and are under 1.5 MB", ({ slug, data }) => {
    for (const s of data.screens) {
      const file = join(projectDir(slug), s.src);
      expect(existsSync(file), file).toBe(true);
      expect(statSync(file).size, `${file} too large`).toBeLessThanOrEqual(MAX_SCREEN_BYTES);
    }
  });
});

describe("skills.yaml", () => {
  const skills = z.array(skillSchema(asString)).parse(readYaml(join(CONTENT_ROOT, "skills.yaml")));
  const skillIds = new Set(skills.map((s) => s.id));

  test("every skill references existing projects", () => {
    for (const s of skills) for (const p of s.projects) expect(slugs, `${s.id} → ${p}`).toContain(p);
  });

  test("every project stack key is a skill id", () => {
    for (const { slug, data } of projects) for (const k of data.stack) expect(skillIds.has(k), `${slug}: ${k}`).toBe(true);
  });
});

test("profile.yaml and experience.yaml validate", () => {
  profileSchema.parse(readYaml(join(CONTENT_ROOT, "profile.yaml")));
  z.array(experienceSchema).parse(readYaml(join(CONTENT_ROOT, "experience.yaml")));
});

test("untranslated backlog is printed, not failed", () => {
  const backlog = slugs.filter((s) => !existsSync(storyPath(s, "en")));
  if (backlog.length > 0) console.info(`en.md missing for: ${backlog.join(", ")}`);
  expect(LOCALES).toContain("en");
});
```

```bash
pnpm test src/lib/content-files.test.ts
```
Expected: FAIL, module not found.

- [ ] **Step 4: 구현 `src/lib/content-files.ts`**

```ts
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import type { Locale } from "../i18n/locales";

export const CONTENT_ROOT = "content";

export function projectDir(slug: string, root: string = CONTENT_ROOT): string {
  return join(root, "projects", slug).replaceAll("\\", "/");
}

export function storyPath(slug: string, locale: Locale, root: string = CONTENT_ROOT): string {
  return `${projectDir(slug, root)}/${locale}.md`;
}

export function listProjectSlugs(root: string = CONTENT_ROOT): string[] {
  return readdirSync(join(root, "projects"), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

export function readYaml<T = unknown>(file: string): T {
  return parse(readFileSync(file, "utf8")) as T;
}
```

```bash
pnpm test
```
Expected: content-files, content-contract 포함 전부 PASS. 콘솔에 backlog 메시지는 없어야 한다(en.md가 있으므로).

- [ ] **Step 5: 컬렉션 배선 `src/content.config.ts`**

```ts
import { defineCollection, reference } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";
import { experienceSchema, profileSchema, projectSchema, skillSchema } from "./content/schemas";

const profile = defineCollection({
  loader: glob({ pattern: "profile.yaml", base: "./content" }),
  schema: profileSchema,
});

const skills = defineCollection({
  loader: file("content/skills.yaml"),
  schema: skillSchema(() => reference("projects")),
});

const experience = defineCollection({
  loader: file("content/experience.yaml"),
  schema: experienceSchema,
});

const projects = defineCollection({
  loader: glob({
    pattern: "*/meta.yaml",
    base: "./content/projects",
    generateId: ({ entry }) => entry.split("/")[0] ?? entry,
  }),
  schema: ({ image }) => projectSchema(image),
});

const stories = defineCollection({
  loader: glob({
    pattern: "*/{ko,en}.md",
    base: "./content/projects",
    generateId: ({ entry }) => entry.replace(/\.md$/, ""),
  }),
  schema: z.object({}).passthrough(),
});

const adrs = defineCollection({
  loader: glob({ pattern: "[0-9][0-9][0-9][0-9]-*.md", base: "./docs/adr" }),
  schema: z.object({
    title: z.string(),
    status: z.enum(["proposed", "accepted", "deprecated", "superseded"]),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
});

export const collections = { profile, skills, experience, projects, stories, adrs };
```

배선 확인용으로 `src/pages/[...lang]/index.astro`의 `<body>`에 한 줄 추가(Task 8에서 교체됨):
```astro
---
// frontmatter에 추가
import { getCollection } from "astro:content";
const projects = await getCollection("projects");
---
<p data-projects={projects.length}>{projects.length} projects</p>
```
(이 파일은 페이지이므로 `getCollection` 직접 호출이 허용된다. 컴포넌트에서는 금지.)

```bash
pnpm check && pnpm build && grep -o 'data-projects="[0-9]*"' dist/index.html
```
Expected: `data-projects="1"`. 스크린샷 PNG가 `dist/_astro/`에 해시 파일로 복사되지는 않아도 된다(아직 `<Picture>`를 안 씀). 빌드가 `image()` 해석에 실패하면(`content/`가 `src/` 밖이라 경로를 못 찾는 경우): `meta.yaml`의 `src`를 `./screens/...`로 두었는지 확인. 그래도 실패하면 스펙 §5의 대안: `content/`를 `src/content/`로 옮기고 `base`와 `CONTENT_ROOT`, 문서를 바꾼다. 결과를 ADR-0004에 기록.

- [ ] **Step 6: ADR-0004**

```bash
pnpm adr "Content model: facts, strings and prose in content/"
```
내용: 사실은 YAML 한 번, 한 줄 문자열은 `{ko,en}` 쌍(둘 다 필수), 긴 글은 로케일별 Markdown(영어 지연 허용). 변경 빈도가 다르기 때문. `content/`를 `src/` 밖에 두는 이유: "코드가 아닌 것"의 경계를 폴더로 보이게 하기 위해. Step 5의 `image()` 결과 기록. Try it: `meta.yaml`의 `updatedAt`을 `2026/09/02`로 바꾸고 `pnpm build` → 파일 경로가 찍힌 에러. `status: accepted`.

- [ ] **Step 7: Commit**

```bash
pnpm lint && git add -A && git commit -m "feat(content): wire collections, add sample project and raw-file contract tests"
```

---

### Task 7: 콘텐츠 뷰 레이어, Base 레이아웃(SEO 전부), Tailwind, 헤더/푸터/토글

**Files:**
- Create: `src/lib/content.ts`, `src/lib/deploy.ts`, `src/lib/deploy.test.ts`, `src/lib/seo.ts`, `src/lib/seo.test.ts`, `src/layouts/Base.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/LanguageToggle.astro`
- Modify: `astro.config.ts` (tailwind, sitemap), `src/styles/global.css`, `package.json`, `src/pages/[...lang]/index.astro`(Base 사용)

**Interfaces:**
- Produces `src/lib/content.ts` (유일하게 `astro:content`를 import하는 lib 파일):
  - `export type ProjectView = { slug: string; data: ProjectData; href: string }` — `href`는 로케일 반영된 `/projects/<slug>/`
  - `export async function getProjects(locale: Locale): Promise<ProjectView[]>` — `order` 오름차순
  - `export async function getFeaturedProjects(locale: Locale): Promise<ProjectView[]>`
  - `export async function getProject(slug: string, locale: Locale): Promise<ProjectView>` — 없으면 throw
  - `export async function getStory(slug: string, locale: Locale): Promise<{ entry: CollectionEntry<"stories">; isFallback: boolean }>`
  - `export async function getProfile(): Promise<ProfileData>`
  - `export async function getSkills(): Promise<CollectionEntry<"skills">[]>`
  - `export async function getExperience(): Promise<ExperienceData[]>` — `from` 내림차순
  - `export async function getAdrs(): Promise<CollectionEntry<"adrs">[]>` — id 오름차순
- Produces `src/lib/deploy.ts`: `export type DeployInfo = { sha: string; shortSha: string; date: string; commitUrl: string }`, `export function deployInfoFrom(env: Record<string, string | undefined>, fallbackSha: () => string, now: Date, repoUrl: string): DeployInfo`, `export function getDeployInfo(repoUrl: string): DeployInfo`
- Produces `src/lib/seo.ts`: `export type SeoInput = { locale: Locale; path: string; site: string; title: string; description: string; ogImage?: string }`, `export function alternates(site: string, path: string): { hreflang: string; href: string }[]` (ko, en, x-default), `export function canonical(site: string, locale: Locale, path: string): string`
- Produces `src/layouts/Base.astro` props: `{ locale: Locale; path: string; title: string; description: string; ogImage?: string; jsonLd?: object }`. `path`는 로케일 없는 canonical path(`/`, `/projects/x/`).

- [ ] **Step 1: 실패하는 테스트**

`src/lib/deploy.test.ts`:
```ts
import { expect, test } from "vitest";
import { deployInfoFrom } from "./deploy";

const repo = "https://github.com/LeeDoik/hello-iam-doik";
const now = new Date("2026-09-02T10:00:00Z");

test("uses VERCEL_GIT_COMMIT_SHA when present", () => {
  const i = deployInfoFrom({ VERCEL_GIT_COMMIT_SHA: "abcdef1234567" }, () => "zzz", now, repo);
  expect(i).toEqual({ sha: "abcdef1234567", shortSha: "abcdef1", date: "2026-09-02", commitUrl: `${repo}/commit/abcdef1234567` });
});

test("falls back to the provided git sha", () => {
  expect(deployInfoFrom({}, () => "1234567890", now, repo).shortSha).toBe("1234567");
});

test("unknown when nothing is available", () => {
  const i = deployInfoFrom({}, () => { throw new Error("no git"); }, now, repo);
  expect(i.sha).toBe("unknown");
  expect(i.commitUrl).toBe(repo);
});
```

`src/lib/seo.test.ts`:
```ts
import { expect, test } from "vitest";
import { alternates, canonical } from "./seo";

const site = "https://hello-iam-doik.vercel.app";

test("canonical points to the same locale", () => {
  expect(canonical(site, "ko", "/projects/x/")).toBe(`${site}/projects/x/`);
  expect(canonical(site, "en", "/projects/x/")).toBe(`${site}/en/projects/x/`);
});

test("alternates are ko, en and x-default → ko", () => {
  expect(alternates(site, "/")).toEqual([
    { hreflang: "ko", href: `${site}/` },
    { hreflang: "en", href: `${site}/en/` },
    { hreflang: "x-default", href: `${site}/` },
  ]);
});
```

```bash
pnpm test src/lib/deploy.test.ts src/lib/seo.test.ts
```
Expected: FAIL (module not found).

- [ ] **Step 2: 구현 `src/lib/deploy.ts`, `src/lib/seo.ts`**

`src/lib/deploy.ts`:
```ts
import { execSync } from "node:child_process";

export type DeployInfo = { sha: string; shortSha: string; date: string; commitUrl: string };

export function deployInfoFrom(
  env: Record<string, string | undefined>,
  fallbackSha: () => string,
  now: Date,
  repoUrl: string,
): DeployInfo {
  let sha = env.VERCEL_GIT_COMMIT_SHA ?? "";
  if (!sha) {
    try {
      sha = fallbackSha().trim();
    } catch {
      sha = "";
    }
  }
  if (!sha) return { sha: "unknown", shortSha: "unknown", date: now.toISOString().slice(0, 10), commitUrl: repoUrl };
  return { sha, shortSha: sha.slice(0, 7), date: now.toISOString().slice(0, 10), commitUrl: `${repoUrl}/commit/${sha}` };
}

export function getDeployInfo(repoUrl: string): DeployInfo {
  return deployInfoFrom(process.env, () => execSync("git rev-parse HEAD", { encoding: "utf8" }), new Date(), repoUrl);
}
```
왜 함수를 둘로 나누나: 환경변수·git·현재 시각은 테스트에서 통제할 수 없다. 순수 함수 `deployInfoFrom`이 로직을 갖고, `getDeployInfo`는 실제 세계를 주입만 한다.

`src/lib/seo.ts`:
```ts
import { LOCALES, type Locale } from "../i18n/locales";
import { localePath } from "./urls";

export type SeoInput = { locale: Locale; path: string; site: string; title: string; description: string; ogImage?: string };

function abs(site: string, path: string): string {
  return `${site.replace(/\/$/, "")}${path}`;
}

export function canonical(site: string, locale: Locale, path: string): string {
  return abs(site, localePath(locale, path));
}

export function alternates(site: string, path: string): { hreflang: string; href: string }[] {
  return [
    ...LOCALES.map((l) => ({ hreflang: l, href: abs(site, localePath(l, path)) })),
    { hreflang: "x-default", href: abs(site, localePath("ko", path)) },
  ];
}
```

```bash
pnpm test
```
Expected: PASS.

- [ ] **Step 3: `src/lib/content.ts`**

```ts
import { type CollectionEntry, getCollection, getEntry } from "astro:content";
import type { ExperienceData, ProfileData, ProjectData } from "../content/schemas";
import type { Locale } from "../i18n/locales";
import { localePath } from "./urls";

export type ProjectView = { slug: string; data: ProjectData; href: string };

function toView(entry: CollectionEntry<"projects">, locale: Locale): ProjectView {
  return { slug: entry.id, data: entry.data as ProjectData, href: localePath(locale, `/projects/${entry.id}/`) };
}

export async function getProjects(locale: Locale): Promise<ProjectView[]> {
  const entries = await getCollection("projects");
  return entries.sort((a, b) => a.data.order - b.data.order).map((e) => toView(e, locale));
}

export async function getFeaturedProjects(locale: Locale): Promise<ProjectView[]> {
  return (await getProjects(locale)).filter((p) => p.data.featured);
}

export async function getProject(slug: string, locale: Locale): Promise<ProjectView> {
  const entry = await getEntry("projects", slug);
  if (!entry) throw new Error(`Unknown project: ${slug}`);
  return toView(entry, locale);
}

/** en.md가 없으면 ko.md를 isFallback=true로 돌려준다. ko.md가 없으면 throw(빌드 실패). */
export async function getStory(
  slug: string,
  locale: Locale,
): Promise<{ entry: CollectionEntry<"stories">; isFallback: boolean }> {
  const wanted = await getEntry("stories", `${slug}/${locale}`);
  if (wanted) return { entry: wanted, isFallback: false };
  const ko = await getEntry("stories", `${slug}/ko`);
  if (!ko) throw new Error(`Missing required content/projects/${slug}/ko.md`);
  return { entry: ko, isFallback: true };
}

export async function getProfile(): Promise<ProfileData> {
  const [p] = await getCollection("profile");
  if (!p) throw new Error("content/profile.yaml is missing");
  return p.data;
}

export async function getSkills(): Promise<CollectionEntry<"skills">[]> {
  return getCollection("skills");
}

export async function getExperience(): Promise<ExperienceData[]> {
  const entries = await getCollection("experience");
  return entries.map((e) => e.data).sort((a, b) => (a.from < b.from ? 1 : -1));
}

export async function getAdrs(): Promise<CollectionEntry<"adrs">[]> {
  return (await getCollection("adrs")).sort((a, b) => a.id.localeCompare(b.id));
}
```

- [ ] **Step 4: Tailwind + sitemap 설치와 설정**

```bash
pnpm add tailwindcss@4.3.3 @tailwindcss/vite@4.3.3 @astrojs/sitemap@3.7.4
```

`astro.config.ts`:
```ts
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://hello-iam-doik.vercel.app",
  trailingSlash: "always",
  build: { format: "directory" },
  i18n: {
    defaultLocale: "ko",
    locales: ["ko", "en"],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({ i18n: { defaultLocale: "ko", locales: { ko: "ko-KR", en: "en-US" } } }),
  ],
  vite: { plugins: [tailwindcss()] },
});
```

`src/styles/global.css` (시각 디자인은 별도 단계. 여기서는 토큰 자리와 인쇄 규칙만):
```css
@import "tailwindcss";

@theme {
  --font-sans: "Pretendard Variable", Pretendard, system-ui, sans-serif;
  --color-ink: oklch(20% 0 0);
  --color-paper: oklch(98% 0 0);
  --color-accent: oklch(55% 0.18 250);
}

:root { color-scheme: light dark; }
html { font-family: var(--font-sans); }
body { @apply bg-paper text-ink min-h-dvh; }

@media print {
  header, footer, nav, .no-print { display: none !important; }
  a[href^="http"]::after { content: " (" attr(href) ")"; font-size: 0.8em; }
}
```
왜 `min-h-dvh`인가: 카카오톡 인앱 브라우저에서 `100vh`가 리로드마다 달라진다. `dvh`는 실제 보이는 높이다.

- [ ] **Step 5: 컴포넌트와 레이아웃**

`src/components/LanguageToggle.astro`:
```astro
---
import { type Locale, otherLocale } from "../i18n/locales";
import { t } from "../i18n/ui";
import { swapLocale } from "../lib/urls";

interface Props { locale: Locale; pathname: string }
const { locale, pathname } = Astro.props;
const other = otherLocale(locale);
---
<a href={swapLocale(pathname, other)} hreflang={other} lang={other} aria-label={t(locale, "toggle.aria")} class="underline">
  {t(locale, "toggle.label")}
</a>
```
왜 JS가 없나: 토글은 링크다. 현재 경로에서 로케일만 바꾼 URL을 빌드 시점에 계산하면 쿠키도 스크립트도 필요 없다.

`src/components/Header.astro`:
```astro
---
import type { Locale } from "../i18n/locales";
import { t } from "../i18n/ui";
import { localePath } from "../lib/urls";
import LanguageToggle from "./LanguageToggle.astro";

interface Props { locale: Locale; pathname: string; email: string; github: string }
const { locale, pathname, email, github } = Astro.props;
---
<header class="flex items-center justify-between gap-4 px-6 py-4">
  <a href={localePath(locale, "/")} class="font-semibold">Doik</a>
  <nav aria-label="main" class="flex gap-4 text-sm">
    <a href={localePath(locale, "/") + "#projects"}>{t(locale, "nav.projects")}</a>
    <a href={localePath(locale, "/resume/")}>{t(locale, "nav.resume")}</a>
    <a href={localePath(locale, "/colophon/")}>{t(locale, "nav.colophon")}</a>
    <a href={github} rel="me">GitHub</a>
    <a href={`mailto:${email}`}>Email</a>
    <LanguageToggle {locale} {pathname} />
  </nav>
</header>
```

`src/components/Footer.astro`:
```astro
---
import type { Locale } from "../i18n/locales";
import { t } from "../i18n/ui";
import type { DeployInfo } from "../lib/deploy";

interface Props { locale: Locale; email: string; github: string; deploy: DeployInfo }
const { locale, email, github, deploy } = Astro.props;
---
<footer class="mt-16 flex flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm opacity-80">
  <div class="flex gap-4">
    <a href={github} rel="me">GitHub</a>
    <a href={`mailto:${email}`}>{email}</a>
  </div>
  <p>
    {t(locale, "footer.deployed")} {deploy.date} ·
    <a href={deploy.commitUrl}><code>{deploy.shortSha}</code></a>
  </p>
</footer>
```

`src/layouts/Base.astro`:
```astro
---
import "../styles/global.css";
import Footer from "../components/Footer.astro";
import Header from "../components/Header.astro";
import { LANG_TAG, type Locale, otherLocale } from "../i18n/locales";
import { getProfile } from "../lib/content";
import { getDeployInfo } from "../lib/deploy";
import { alternates, canonical } from "../lib/seo";
import { localePath } from "../lib/urls";

interface Props {
  locale: Locale;
  path: string; // 로케일 없는 canonical path, 예: "/projects/x/"
  title: string;
  description: string;
  ogImage?: string; // 절대 URL. 2차 계획에서 프로젝트별 OG가 채운다
  jsonLd?: Record<string, unknown>;
}
const { locale, path, title, description, ogImage, jsonLd } = Astro.props;
const site = Astro.site?.href ?? "https://hello-iam-doik.vercel.app";
const profile = await getProfile();
const REPO_URL = "https://github.com/LeeDoik/hello-iam-doik"; // 사이트 자체의 레포. 콘텐츠가 아니라 코드의 사실이므로 여기 상수로 둔다
const deploy = getDeployInfo(REPO_URL);
const pathname = localePath(locale, path);
const og = ogImage ?? `${site.replace(/\/$/, "")}/og/${locale}.png`;
---
<!doctype html>
<html lang={locale}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical(site, locale, path)} />
    {alternates(site, path).map((a) => <link rel="alternate" hreflang={a.hreflang} href={a.href} />)}
    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical(site, locale, path)} />
    <meta property="og:image" content={og} />
    <meta property="og:locale" content={LANG_TAG[locale].replace("-", "_")} />
    <meta property="og:locale:alternate" content={LANG_TAG[otherLocale(locale)].replace("-", "_")} />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="sitemap" href="/sitemap-index.xml" />
    {jsonLd && <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />}
  </head>
  <body>
    <Header {locale} {pathname} email={profile.email} github={profile.links.github} />
    <main class="mx-auto max-w-3xl px-6">
      <slot />
    </main>
    <Footer {locale} email={profile.email} github={profile.links.github} {deploy} />
  </body>
</html>
```
주의: `Base.astro`는 레이아웃이라 `getProfile()` 호출을 허용한다(컴포넌트 금지 규칙은 `src/components/`에만 적용). `public/favicon.svg`는 임의의 단순 SVG 하나를 만들어 둔다. `/og/<locale>.png`는 2차 계획에서 생성되며 그 전까지는 404여도 빌드는 통과한다(e2e에서 검사하지 않음).

`public/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#1e3a8a"/><text x="16" y="21" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#fff">D</text></svg>
```

`public/robots.txt`:
```
User-agent: *
Allow: /
Sitemap: https://hello-iam-doik.vercel.app/sitemap-index.xml
```

- [ ] **Step 6: 랜딩을 Base로 감싸 빌드 확인**

`src/pages/[...lang]/index.astro`를 다음으로 교체:
```astro
---
import Base from "../../layouts/Base.astro";
import { localeFromParam, localeStaticPaths } from "../../i18n/locales";
import { t } from "../../i18n/ui";
import { getProfile, getProjects } from "../../lib/content";
import { pick } from "../../lib/localized";

export function getStaticPaths() {
  return localeStaticPaths();
}
const locale = localeFromParam(Astro.params.lang);
const profile = await getProfile();
const projects = await getProjects(locale);
---
<Base {locale} path="/" title={t(locale, "site.title")} description={pick(profile.tagline, locale)}>
  <h1 class="mt-12 text-4xl font-bold">{pick(profile.name, locale)}</h1>
  <p class="mt-2 text-lg">{pick(profile.tagline, locale)}</p>
  <p data-projects={projects.length}>{projects.length}</p>
</Base>
```

```bash
pnpm check && pnpm build && grep -c 'hreflang' dist/index.html && grep -o '<link rel="canonical"[^>]*>' dist/en/index.html && ls dist/sitemap-index.xml dist/sitemap-0.xml
```
Expected: hreflang 3개(ko, en, x-default), en 페이지 canonical이 `/en/`, 사이트맵 2파일. `dist/_astro/*.js`는 없어야 한다.

- [ ] **Step 7: Commit**

```bash
pnpm lint && git add -A && git commit -m "feat(layout): base layout with seo metadata, header/footer, tailwind and sitemap"
```

---

### Task 8: 랜딩 페이지 컴포넌트 (프로젝트 카드, 스킬, 경력)

**Files:**
- Create: `src/components/ProjectCard.astro`, `src/components/SkillsByProject.astro`, `src/components/ExperienceList.astro`, `src/lib/skills.ts`, `src/lib/skills.test.ts`, `src/lib/dates.ts`, `src/lib/dates.test.ts`
- Modify: `src/pages/[...lang]/index.astro`

**Interfaces:**
- Produces `src/lib/skills.ts`: `export type SkillRow = { id: string; name: string; group: SkillGroup; builtWithIt: string; projectSlugs: string[] }`, `export function groupSkills(rows: SkillRow[]): { group: SkillGroup; skills: SkillRow[] }[]` — 그룹 순서 frontend, ai, backend, tooling. 비어 있는 그룹은 생략.
- Produces `src/lib/dates.ts`: `export function formatPeriod(from: string, to: string | undefined, locale: Locale): string` — `2026.01 – 2026.03` / `2026.01 – 현재|present`
- Produces `ProjectCard.astro` props: `{ project: ProjectView; locale: Locale }`. 루트 요소에 `data-stack="astro react"`(공백 구분)과 `data-project-card` 속성. Task 11의 필터 아일랜드가 이 속성으로 카드를 찾는다.

- [ ] **Step 1: 실패하는 테스트**

`src/lib/skills.test.ts`:
```ts
import { expect, test } from "vitest";
import { groupSkills, type SkillRow } from "./skills";

const row = (id: string, group: SkillRow["group"]): SkillRow => ({ id, name: id, group, builtWithIt: "x", projectSlugs: ["p"] });

test("groups in fixed order and drops empty groups", () => {
  const g = groupSkills([row("vitest", "tooling"), row("react", "frontend"), row("astro", "frontend")]);
  expect(g.map((x) => x.group)).toEqual(["frontend", "tooling"]);
  expect(g[0]?.skills.map((s) => s.id)).toEqual(["react", "astro"]);
});
```

`src/lib/dates.test.ts`:
```ts
import { expect, test } from "vitest";
import { formatPeriod } from "./dates";

test("closed period", () => expect(formatPeriod("2026-01-01", "2026-03-15", "ko")).toBe("2026.01 – 2026.03"));
test("open period ko/en", () => {
  expect(formatPeriod("2026-01-01", undefined, "ko")).toBe("2026.01 – 현재");
  expect(formatPeriod("2026-01-01", undefined, "en")).toBe("2026.01 – present");
});
```

```bash
pnpm test src/lib/skills.test.ts src/lib/dates.test.ts
```
Expected: FAIL (module not found).

- [ ] **Step 2: 구현**

`src/lib/skills.ts`:
```ts
import type { SkillGroup } from "../content/schemas";

export type SkillRow = { id: string; name: string; group: SkillGroup; builtWithIt: string; projectSlugs: string[] };

const GROUP_ORDER: SkillGroup[] = ["frontend", "ai", "backend", "tooling"];

export function groupSkills(rows: SkillRow[]): { group: SkillGroup; skills: SkillRow[] }[] {
  return GROUP_ORDER.map((group) => ({ group, skills: rows.filter((r) => r.group === group) })).filter(
    (g) => g.skills.length > 0,
  );
}
```

`src/lib/dates.ts`:
```ts
import type { Locale } from "../i18n/locales";

const PRESENT: Record<Locale, string> = { ko: "현재", en: "present" };

function ym(iso: string): string {
  return iso.slice(0, 7).replace("-", ".");
}

export function formatPeriod(from: string, to: string | undefined, locale: Locale): string {
  return `${ym(from)} – ${to ? ym(to) : PRESENT[locale]}`;
}
```

```bash
pnpm test
```
Expected: PASS.

- [ ] **Step 3: 컴포넌트**

`src/components/ProjectCard.astro`:
```astro
---
import type { Locale } from "../i18n/locales";
import { t } from "../i18n/ui";
import type { ProjectView } from "../lib/content";
import { formatPeriod } from "../lib/dates";
import { pick } from "../lib/localized";

interface Props { project: ProjectView; locale: Locale }
const { project, locale } = Astro.props;
const d = project.data;
const statusKey = { live: "status.live", archived: "status.archived", wip: "status.wip" } as const;
---
<article data-project-card data-slug={project.slug} data-stack={d.stack.join(" ")} class="rounded-lg border p-5">
  <h3 class="text-xl font-semibold"><a href={project.href}>{pick(d.title, locale)}</a></h3>
  <p class="mt-1 text-sm opacity-70">
    {formatPeriod(d.period.from, d.period.to, locale)} · {t(locale, statusKey[d.status])}
  </p>
  <p class="mt-2">{pick(d.summary, locale)}</p>
  <ul class="mt-3 flex flex-wrap gap-2 text-xs" aria-label="stack">
    {d.stack.map((s) => <li class="rounded bg-black/5 px-2 py-0.5">{s}</li>)}
  </ul>
</article>
```

`src/components/SkillsByProject.astro`:
```astro
---
import type { Locale } from "../i18n/locales";
import { localePath } from "../lib/urls";
import { groupSkills, type SkillRow } from "../lib/skills";

interface Props { rows: SkillRow[]; locale: Locale }
const { rows, locale } = Astro.props;
---
{groupSkills(rows).map(({ group, skills }) => (
  <section class="mt-6">
    <h3 class="text-sm uppercase tracking-wide opacity-60">{group}</h3>
    <ul class="mt-2 space-y-2">
      {skills.map((s) => (
        <li>
          <strong>{s.name}</strong> — {s.builtWithIt}
          {s.projectSlugs.map((slug) => (
            <a class="ml-2 text-sm underline" href={localePath(locale, `/projects/${slug}/`)}>{slug}</a>
          ))}
        </li>
      ))}
    </ul>
  </section>
))}
```

`src/components/ExperienceList.astro`:
```astro
---
import type { ExperienceData } from "../content/schemas";
import type { Locale } from "../i18n/locales";
import { formatPeriod } from "../lib/dates";
import { pick } from "../lib/localized";

interface Props { items: ExperienceData[]; locale: Locale }
const { items, locale } = Astro.props;
---
<ol class="mt-4 space-y-6">
  {items.map((e) => (
    <li>
      <p class="text-sm opacity-70">{formatPeriod(e.from, e.to, locale)} · {e.kind}</p>
      <p class="font-semibold">{pick(e.org, locale)} · {pick(e.role, locale)}</p>
      <ul class="mt-1 list-disc pl-5 text-sm">
        {e.bullets.map((b) => <li>{pick(b, locale)}</li>)}
      </ul>
    </li>
  ))}
</ol>
```

- [ ] **Step 4: 랜딩 페이지 조립**

`src/pages/[...lang]/index.astro`:
```astro
---
import ExperienceList from "../../components/ExperienceList.astro";
import ProjectCard from "../../components/ProjectCard.astro";
import SkillsByProject from "../../components/SkillsByProject.astro";
import { localeFromParam, localeStaticPaths } from "../../i18n/locales";
import { t } from "../../i18n/ui";
import Base from "../../layouts/Base.astro";
import { getExperience, getProfile, getProjects, getSkills } from "../../lib/content";
import { pick } from "../../lib/localized";
import type { SkillRow } from "../../lib/skills";

export function getStaticPaths() {
  return localeStaticPaths();
}
const locale = localeFromParam(Astro.params.lang);
const profile = await getProfile();
const projects = await getProjects(locale);
const experience = await getExperience();
const skillRows: SkillRow[] = (await getSkills()).map((s) => ({
  id: s.data.id,
  name: s.data.name,
  group: s.data.group,
  builtWithIt: pick(s.data.builtWithIt, locale),
  projectSlugs: s.data.projects.map((p) => p.id),
}));
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${Astro.site}#me`,
  name: pick(profile.name, locale),
  email: profile.email,
  sameAs: [profile.links.github, profile.links.linkedin].filter(Boolean),
};
---
<Base {locale} path="/" title={t(locale, "site.title")} description={pick(profile.tagline, locale)} {jsonLd}>
  <section id="hero" class="py-16">
    <h1 class="text-4xl font-bold">{pick(profile.name, locale)}</h1>
    <p class="mt-3 text-xl">{pick(profile.tagline, locale)}</p>
    <p class="mt-4 max-w-prose opacity-80">{pick(profile.bio, locale)}</p>
    <a class="mt-6 inline-block underline" href="#projects">{t(locale, "hero.cta.projects")}</a>
  </section>

  <section id="projects" class="py-8">
    <h2 class="text-2xl font-semibold">{t(locale, "section.projects")}</h2>
    <div id="project-list" class="mt-4 grid gap-4">
      {projects.map((p) => <ProjectCard project={p} {locale} />)}
    </div>
  </section>

  <section id="skills" class="py-8">
    <h2 class="text-2xl font-semibold">{t(locale, "section.skills")}</h2>
    <SkillsByProject rows={skillRows} {locale} />
  </section>

  <section id="experience" class="py-8">
    <h2 class="text-2xl font-semibold">{t(locale, "section.experience")}</h2>
    <ExperienceList items={experience} {locale} />
  </section>

  <section id="contact" class="py-8">
    <h2 class="text-2xl font-semibold">{t(locale, "section.contact")}</h2>
    <p class="mt-2"><a href={`mailto:${profile.email}`}>{profile.email}</a> · <a href={profile.links.github}>GitHub</a></p>
  </section>
</Base>
```
`#hero` 섹션은 2차 계획에서 `Hero3D` 아일랜드가 배경으로 들어갈 자리다. 텍스트는 HTML로 남는다.

`statusKey` 매핑을 쓰는 이유: 템플릿 리터럴 `status.${d.status}`는 TypeScript가 `UIKey`로 좁혀 주지 않는다. 명시적 객체는 키 오타를 컴파일 에러로 잡는다.

```bash
pnpm check && pnpm build && grep -c 'data-project-card' dist/index.html dist/en/index.html && grep -o 'application/ld+json' dist/index.html
```
Expected: 각 1, ld+json 존재. `dist/_astro/*.js` 없음.

- [ ] **Step 5: Commit**

```bash
pnpm lint && git add -A && git commit -m "feat(landing): project cards, skills grouped by what I built, experience list"
```

---

### Task 9: 프로젝트 케이스 스터디 페이지

**Files:**
- Create: `src/pages/[...lang]/projects/[slug].astro`, `src/components/MetricStrip.astro`, `src/components/RoleBlock.astro`, `src/components/ScreenshotGallery.astro`, `src/components/AiEvidence.astro`, `src/components/FallbackNotice.astro`, `src/components/ProjectLinks.astro`

**Interfaces:**
- Consumes: `getProject`, `getStory`(Task 7), `pick`, `t`, `formatPeriod`.
- Produces: URL `/projects/<slug>/`, `/en/projects/<slug>/`. 페이지 본문에 `data-story-fallback="true|false"` 속성(e2e가 검사).

- [ ] **Step 1: 컴포넌트**

`src/components/MetricStrip.astro`:
```astro
---
import type { MetricData } from "../content/schemas";
import type { Locale } from "../i18n/locales";
import { t } from "../i18n/ui";
import { pick } from "../lib/localized";

interface Props { metrics: MetricData[]; locale: Locale }
const { metrics, locale } = Astro.props;
---
{metrics.length > 0 && (
  <dl class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4" aria-label={t(locale, "project.metrics")}>
    {metrics.map((m) => (
      <div class="rounded border p-3">
        <dt class="text-xs opacity-70">{pick(m.label, locale)}</dt>
        <dd class="text-lg font-semibold">
          {m.before && <span class="opacity-60">{m.before} → </span>}{m.after}{m.unit && <span class="text-sm"> {m.unit}</span>}
        </dd>
        <dd class="mt-1 text-xs opacity-70">
          {t(locale, "project.method")}: {pick(m.method, locale)}
          {m.evidence && <> · <a class="underline" href={m.evidence}>{t(locale, "project.evidence")}</a></>}
        </dd>
      </div>
    ))}
  </dl>
)}
```
왜 근거 링크를 지표 옆에 두나: 커밋이나 대시보드로 이어지지 않는 숫자는 마케팅 문장이다. 링크가 있으면 검증 가능한 주장이 된다.

`src/components/RoleBlock.astro`:
```astro
---
import type { ProjectData } from "../content/schemas";
import type { Locale } from "../i18n/locales";
import { t } from "../i18n/ui";
import { pick } from "../lib/localized";

interface Props { role: ProjectData["role"]; locale: Locale }
const { role, locale } = Astro.props;
---
<section class="mt-6">
  <h2 class="text-lg font-semibold">{t(locale, "project.role")}</h2>
  <p class="mt-1 text-sm">{t(locale, "project.teamSize")}: {role.teamSize}</p>
  <p class="mt-1">{t(locale, "project.owned")}: {pick(role.owned, locale)}</p>
</section>
```

`src/components/ScreenshotGallery.astro`:
```astro
---
import { Picture } from "astro:assets";
import type { ProjectData } from "../content/schemas";
import type { Locale } from "../i18n/locales";
import { t } from "../i18n/ui";
import { pick } from "../lib/localized";

interface Props { screens: ProjectData["screens"]; locale: Locale }
const { screens, locale } = Astro.props;
---
<section class="mt-6">
  <h2 class="text-lg font-semibold">{t(locale, "project.screens")}</h2>
  <div class="mt-3 grid gap-4">
    {screens.map((s) => (
      <figure>
        <Picture src={s.src} alt={pick(s.alt, locale)} formats={["avif", "webp"]} widths={[480, 960, 1440]} sizes="(max-width: 768px) 100vw, 720px" class="rounded border" />
        <figcaption class="mt-1 text-xs opacity-70">
          {s.device} · {t(locale, "project.captured")} {s.capturedAt}{s.commit && <> @ <code>{s.commit}</code></>}
        </figcaption>
      </figure>
    ))}
  </div>
</section>
```
`s.src`의 타입은 `image()`가 만든 `ImageMetadata`다. `ProjectData`는 `z.string()` 기준으로 추론되므로 타입이 맞지 않으면 `Props`를 `{ screens: CollectionEntry<"projects">["data"]["screens"]; ... }`로 바꾼다(`import type { CollectionEntry } from "astro:content"`). 컴포넌트에서 `astro:content`의 **타입** import는 허용된다. 값 호출(`getCollection`)만 금지.

`src/components/AiEvidence.astro`:
```astro
---
import { Image } from "astro:assets";
import type { CollectionEntry } from "astro:content";
import type { Locale } from "../i18n/locales";
import { t } from "../i18n/ui";
import { pick } from "../lib/localized";

interface Props { ai: NonNullable<CollectionEntry<"projects">["data"]["ai"]>; locale: Locale }
const { ai, locale } = Astro.props;
---
<section class="mt-8 rounded border p-5">
  <h2 class="text-lg font-semibold">{t(locale, "ai.title")}</h2>
  <p class="mt-2 text-sm">{t(locale, "ai.models")}: {ai.models.map((m) => <code class="mr-2">{m}</code>)}</p>
  {ai.promptFile && <p class="text-sm"><a class="underline" href={ai.promptFile}>{t(locale, "ai.prompt")}</a></p>}
  {ai.architecture && <Image src={ai.architecture} alt="architecture" class="mt-3" />}
  {ai.evals.length > 0 && (
    <table class="mt-3 w-full text-sm">
      <thead><tr><th>{t(locale, "ai.evals")}</th><th>n</th><th>baseline</th><th>final</th><th>{t(locale, "ai.judge")}</th></tr></thead>
      <tbody>
        {ai.evals.map((e) => <tr><td>{e.name} ({e.metric})</td><td>{e.n}</td><td>{e.baseline}</td><td>{e.final}</td><td>{e.judge}</td></tr>)}
      </tbody>
    </table>
  )}
  <p class="mt-2 text-sm">
    {ai.costPerRequest && <>{t(locale, "ai.cost")}: {ai.costPerRequest} · </>}
    {ai.latencyP50 && <>{t(locale, "ai.latency")}: {ai.latencyP50}</>}
  </p>
  {ai.rejectedTradeoff && (
    <p class="mt-2 text-sm"><strong>{t(locale, "ai.rejected")}:</strong> {pick(ai.rejectedTradeoff.option, locale)} — {pick(ai.rejectedTradeoff.reasonWithNumbers, locale)}</p>
  )}
  {ai.failureModes.length > 0 && (
    <>
      <h3 class="mt-3 text-sm font-semibold">{t(locale, "ai.failureModes")}</h3>
      <ul class="list-disc pl-5 text-sm">{ai.failureModes.map((f) => <li>{pick(f, locale)}</li>)}</ul>
    </>
  )}
</section>
```

`src/components/FallbackNotice.astro`:
```astro
---
import type { Locale } from "../i18n/locales";
import { t } from "../i18n/ui";
interface Props { locale: Locale }
const { locale } = Astro.props;
---
<p role="note" class="my-4 rounded border-l-4 border-accent bg-black/5 p-3 text-sm">{t(locale, "story.fallbackNotice")}</p>
```

`src/components/ProjectLinks.astro`:
```astro
---
import type { ProjectData } from "../content/schemas";
import type { Locale } from "../i18n/locales";
import { t } from "../i18n/ui";
import { pick } from "../lib/localized";

interface Props { links: ProjectData["links"]; locale: Locale }
const { links, locale } = Astro.props;
---
<section class="mt-8">
  <h2 class="text-lg font-semibold">{t(locale, "project.links")}</h2>
  <ul class="mt-2 space-y-1 text-sm">
    <li><a class="underline" href={links.repo}>{t(locale, "project.repo")}</a></li>
    {links.live && <li><a class="underline" href={links.live}>{t(locale, "project.live")}</a></li>}
    {links.demoCredentials && <li>{t(locale, "project.demoCredentials")}: <code>{links.demoCredentials.id}</code> / <code>{links.demoCredentials.password}</code></li>}
  </ul>
  {links.keyCommits.length > 0 && (
    <>
      <h3 class="mt-3 text-sm font-semibold">{t(locale, "project.keyCommits")}</h3>
      <ul class="list-disc pl-5 text-sm">
        {links.keyCommits.map((c) => <li><a class="underline" href={c.url}>{pick(c.label, locale)}</a> — {pick(c.why, locale)}</li>)}
      </ul>
    </>
  )}
</section>
```

- [ ] **Step 2: 페이지**

`src/pages/[...lang]/projects/[slug].astro`:
```astro
---
import { getCollection, render } from "astro:content";
import AiEvidence from "../../../components/AiEvidence.astro";
import FallbackNotice from "../../../components/FallbackNotice.astro";
import MetricStrip from "../../../components/MetricStrip.astro";
import ProjectLinks from "../../../components/ProjectLinks.astro";
import RoleBlock from "../../../components/RoleBlock.astro";
import ScreenshotGallery from "../../../components/ScreenshotGallery.astro";
import { localeFromParam, localeStaticPaths } from "../../../i18n/locales";
import Base from "../../../layouts/Base.astro";
import { getProject, getStory } from "../../../lib/content";
import { formatPeriod } from "../../../lib/dates";
import { pick } from "../../../lib/localized";

export async function getStaticPaths() {
  const projects = await getCollection("projects");
  return localeStaticPaths().flatMap(({ params }) =>
    projects.map((p) => ({ params: { lang: params.lang, slug: p.id } })),
  );
}

const locale = localeFromParam(Astro.params.lang);
const project = await getProject(Astro.params.slug, locale);
const { entry: story, isFallback } = await getStory(project.slug, locale);
const { Content } = await render(story);
const d = project.data;
---
<Base {locale} path={`/projects/${project.slug}/`} title={pick(d.title, locale)} description={pick(d.summary, locale)}>
  <article data-story-fallback={String(isFallback)}>
    <h1 class="mt-12 text-3xl font-bold">{pick(d.title, locale)}</h1>
    <p class="mt-1 text-sm opacity-70">{formatPeriod(d.period.from, d.period.to, locale)}</p>
    <p class="mt-3 text-lg">{pick(d.summary, locale)}</p>
    <MetricStrip metrics={d.metrics} {locale} />
    <RoleBlock role={d.role} {locale} />
    <ScreenshotGallery screens={d.screens} {locale} />
    {isFallback && <FallbackNotice {locale} />}
    <div class="prose mt-8 max-w-none"><Content /></div>
    {d.ai && <AiEvidence ai={d.ai} {locale} />}
    <ProjectLinks links={d.links} {locale} />
  </article>
</Base>
```
`@tailwindcss/typography`는 설치하지 않는다. `prose` 클래스는 자리만 잡고, 본문 서식은 `global.css`에 `.prose h2 { @apply mt-8 text-xl font-semibold }` `.prose p { @apply mt-3 }` 두 줄을 추가해 처리한다.

- [ ] **Step 3: 폴백 동작을 눈으로 확인**

```bash
pnpm check && pnpm build && ls dist/projects/sample-project dist/en/projects/sample-project && grep -o 'data-story-fallback="[a-z]*"' dist/en/projects/sample-project/index.html
```
Expected: 두 폴더에 `index.html`, en 페이지는 `data-story-fallback="false"`. `dist/_astro/`에 avif/webp 파일이 생겼는지도 확인.

이제 `content/projects/sample-project/en.md`를 잠시 `en.md.bak`으로 옮기고 다시 빌드:
```bash
mv content/projects/sample-project/en.md content/projects/sample-project/en.md.bak && pnpm build && grep -o 'data-story-fallback="[a-z]*"' dist/en/projects/sample-project/index.html && grep -c 'role="note"' dist/en/projects/sample-project/index.html; mv content/projects/sample-project/en.md.bak content/projects/sample-project/en.md
```
Expected: `"true"`, note 1개. 마지막으로 `ko.md`를 잠시 옮기면 빌드가 `Missing required content/projects/sample-project/ko.md`로 실패해야 한다(확인 후 복구).

- [ ] **Step 4: Commit**

```bash
pnpm lint && git add -A && git commit -m "feat(project): case study page with metrics, role, screens, ai evidence and en fallback"
```

---

### Task 10: 이력서(인쇄)와 콜로폰(ADR 렌더) 페이지

**Files:**
- Create: `src/pages/[...lang]/resume.astro`, `src/pages/[...lang]/colophon.astro`, `src/components/AdrList.astro`, `docs/how-this-was-built.md`

**Interfaces:**
- Consumes: `getProfile`, `getFeaturedProjects`, `getExperience`, `getAdrs`, `parseAdrFrontmatter`(Task 3, 여기서는 컬렉션 스키마가 대신 검증하므로 미사용), `render`.
- Produces: `/resume/`, `/en/resume/`, `/colophon/`, `/en/colophon/`. resume 페이지에 `<button data-print>`.

- [ ] **Step 1: resume 페이지**

`src/pages/[...lang]/resume.astro`:
```astro
---
import ExperienceList from "../../components/ExperienceList.astro";
import { localeFromParam, localeStaticPaths } from "../../i18n/locales";
import { t } from "../../i18n/ui";
import Base from "../../layouts/Base.astro";
import { getExperience, getFeaturedProjects, getProfile } from "../../lib/content";
import { formatPeriod } from "../../lib/dates";
import { pick } from "../../lib/localized";

export function getStaticPaths() {
  return localeStaticPaths();
}
const locale = localeFromParam(Astro.params.lang);
const profile = await getProfile();
const projects = await getFeaturedProjects(locale);
const experience = await getExperience();
---
<Base {locale} path="/resume/" title={`${t(locale, "nav.resume")} · ${pick(profile.name, locale)}`} description={pick(profile.tagline, locale)}>
  <article class="py-10 print:py-0">
    <header class="flex items-start justify-between">
      <div>
        <h1 class="text-3xl font-bold">{pick(profile.name, locale)}</h1>
        <p>{pick(profile.tagline, locale)}</p>
        <p class="text-sm">{profile.email} · {profile.links.github} · {pick(profile.location, locale)}</p>
      </div>
      <button data-print class="no-print rounded border px-3 py-1 text-sm" type="button">{t(locale, "resume.print")}</button>
    </header>

    <h2 class="mt-8 text-xl font-semibold">{t(locale, "section.projects")}</h2>
    <ul class="mt-2 space-y-3">
      {projects.map((p) => (
        <li>
          <p class="font-semibold">{pick(p.data.title, locale)} <span class="text-sm font-normal opacity-70">{formatPeriod(p.data.period.from, p.data.period.to, locale)}</span></p>
          <p class="text-sm">{pick(p.data.summary, locale)} — {pick(p.data.role.owned, locale)}</p>
          <p class="text-sm">{p.data.links.repo}</p>
        </li>
      ))}
    </ul>

    <h2 class="mt-8 text-xl font-semibold">{t(locale, "section.experience")}</h2>
    <ExperienceList items={experience} {locale} />
  </article>
  <script>
    document.querySelector<HTMLButtonElement>("[data-print]")?.addEventListener("click", () => window.print());
  </script>
</Base>
```
이 `<script>`는 Astro가 처리하는 인라인 스크립트로, React 아일랜드가 아니다. 한 줄이므로 허용. `global.css`에 `@page { size: A4; margin: 16mm; }` 추가.

- [ ] **Step 2: 콜로폰과 ADR 목록**

`src/components/AdrList.astro`:
```astro
---
import type { CollectionEntry } from "astro:content";
interface Props { adrs: CollectionEntry<"adrs">[] }
const { adrs } = Astro.props;
---
<ol class="mt-3 space-y-2">
  {adrs.map((a) => (
    <li>
      <a class="underline" href={`#${a.id}`}>{a.id.slice(0, 4)} · {a.data.title}</a>
      <span class="ml-2 rounded bg-black/5 px-2 text-xs">{a.data.status}</span>
      <span class="ml-2 text-xs opacity-60">{a.data.date}</span>
    </li>
  ))}
</ol>
```

`docs/how-this-was-built.md`:
```markdown
---
title: How this site was built
---

이 사이트는 Claude Code와 함께 만들었습니다. AI가 초안을 제안하고, 저는 각 결정의 이유를 묻고 검토했으며, 테스트와 빌드로 검증했습니다.
직접 한 일: 요구사항과 제약 확정, 설계안 3개 비교 후 선택, 각 ADR의 "What I learned" 작성, 콘텐츠 작성, 코드 리뷰와 테스트 실행.
AI가 한 일: 조사, 설계안 초안, 코드 초안, 테스트 초안.
스택과 결정 근거는 아래 ADR 목록에 있습니다.
```

`src/pages/[...lang]/colophon.astro`:
```astro
---
import { render } from "astro:content";
import AdrList from "../../components/AdrList.astro";
import { localeFromParam, localeStaticPaths } from "../../i18n/locales";
import { t } from "../../i18n/ui";
import Base from "../../layouts/Base.astro";
import { getAdrs } from "../../lib/content";

export function getStaticPaths() {
  return localeStaticPaths();
}
const locale = localeFromParam(Astro.params.lang);
const adrs = await getAdrs();
const rendered = await Promise.all(adrs.map(async (a) => ({ a, Content: (await render(a)).Content })));
---
<Base {locale} path="/colophon/" title={t(locale, "colophon.title")} description={t(locale, "colophon.adrs")}>
  <h1 class="mt-12 text-3xl font-bold">{t(locale, "colophon.title")}</h1>
  <section class="prose mt-6">
    <p>This site was built with Claude Code. I set the constraints, compared three designs, asked "why" at every step, wrote the "What I learned" of each ADR, and verified with tests and builds. See <a href="https://github.com/LeeDoik/hello-iam-doik/blob/main/docs/how-this-was-built.md">docs/how-this-was-built.md</a>.</p>
  </section>
  <h2 class="mt-10 text-2xl font-semibold">{t(locale, "colophon.adrs")}</h2>
  <AdrList {adrs} />
  {rendered.map(({ a, Content }) => (
    <article id={a.id} class="prose mt-10 border-t pt-6">
      <Content />
    </article>
  ))}
</Base>
```
ADR 본문은 한국어로 쓰여 있고 번역하지 않는다. 콜로폰은 두 로케일에 같은 ADR을 보여준다. 이것이 "문서가 곧 제품"의 가장 싼 형태다.

- [ ] **Step 3: 빌드 확인**

```bash
pnpm check && pnpm build && ls dist/resume dist/en/resume dist/colophon dist/en/colophon && grep -c 'id="000' dist/colophon/index.html
```
Expected: 4개 폴더, ADR 앵커 5개 이상(0001, 0002, 0003, 0004, 0006, 0007).

- [ ] **Step 4: Commit**

```bash
pnpm lint && git add -A && git commit -m "feat(pages): print resume and colophon rendering ADRs"
```

---

### Task 11: 프로젝트 필터 아일랜드 (유일한 React)

**Files:**
- Create: `src/islands/ProjectFilter.tsx`, `src/islands/ProjectFilter.test.tsx`, `src/lib/filter.ts`, `src/lib/filter.test.ts`, `vitest.setup.ts`
- Modify: `astro.config.ts` (react 통합), `vitest.config.ts`, `package.json`, `src/pages/[...lang]/index.astro`

**Interfaces:**
- Produces `src/lib/filter.ts` (순수):
  - `export function parseHashGroup(hash: string, groups: readonly string[]): string | null` — `#stack=ai` → `"ai"`, 없거나 모르면 `null`
  - `export function toHash(group: string | null): string` — `null` → `""`, `"ai"` → `"#stack=ai"`
  - `export function visibleSlugs(cards: { slug: string; groups: string[] }[], group: string | null): string[]`
- Produces `ProjectFilter.tsx` props: `{ groups: { id: SkillGroup; label: string }[]; cards: { slug: string; groups: string[] }[]; labels: { all: string; count: string; filterLabel: string }; locale: Locale }`. 카드 DOM은 `#project-list [data-project-card]`를 찾아 `hidden` 속성을 토글한다. JS 없이도 전체 카드가 보인다.
- 카드에 그룹 정보가 필요하므로 `ProjectCard.astro`의 `data-stack`(스킬 id)을 그룹으로 매핑하는 것은 페이지에서 계산해 `cards` prop으로 넘긴다.

- [ ] **Step 1: 의존성과 설정**

```bash
pnpm add react@19.2.8 react-dom@19.2.8 @astrojs/react@6.0.5 && pnpm add -D @types/react@19 @types/react-dom@19 @testing-library/react@16 @testing-library/jest-dom@6 @testing-library/user-event@14 jsdom@26
```
`@types/react`, `@testing-library/*`, `jsdom`은 설치 직후 `pnpm ls`로 실제 설치된 버전을 확인해 `package.json`에 정확한 버전으로 고정한다(캐럿 제거).

`astro.config.ts`의 `integrations`에 `react()` 추가:
```ts
import react from "@astrojs/react";
// ...
integrations: [react(), sitemap({ /* 그대로 */ })],
```

`vitest.config.ts`:
```ts
/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
    environment: "node",
    environmentMatchGlobs: [["src/islands/**", "jsdom"]],
    setupFiles: ["./vitest.setup.ts"],
  },
});
```
`vitest.setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```
`environmentMatchGlobs`가 Vitest 4에서 제거되어 있으면 대신 테스트 파일 첫 줄에 `// @vitest-environment jsdom` 주석을 쓴다.

- [ ] **Step 2: 실패하는 테스트 (순수 함수)**

`src/lib/filter.test.ts`:
```ts
import { describe, expect, test } from "vitest";
import { parseHashGroup, toHash, visibleSlugs } from "./filter";

const groups = ["frontend", "ai", "backend", "tooling"] as const;

describe("hash", () => {
  test("round trip", () => {
    expect(parseHashGroup(toHash("ai"), groups)).toBe("ai");
    expect(toHash(null)).toBe("");
  });
  test("unknown or empty is null", () => {
    expect(parseHashGroup("#stack=nope", groups)).toBeNull();
    expect(parseHashGroup("", groups)).toBeNull();
    expect(parseHashGroup("#projects", groups)).toBeNull();
  });
});

test("visibleSlugs", () => {
  const cards = [{ slug: "a", groups: ["frontend"] }, { slug: "b", groups: ["frontend", "ai"] }];
  expect(visibleSlugs(cards, null)).toEqual(["a", "b"]);
  expect(visibleSlugs(cards, "ai")).toEqual(["b"]);
  expect(visibleSlugs(cards, "backend")).toEqual([]);
});
```

`src/islands/ProjectFilter.test.tsx`:
```tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test } from "vitest";
import { ProjectFilter } from "./ProjectFilter";

const groups = [{ id: "frontend", label: "Frontend" }, { id: "ai", label: "AI" }] as const;
const cards = [{ slug: "a", groups: ["frontend"] }, { slug: "b", groups: ["frontend", "ai"] }];
const labels = { all: "All", count: " projects", filterLabel: "Filter by stack" };

beforeEach(() => {
  document.body.innerHTML = `<div id="project-list">
    <article data-project-card data-slug="a"></article>
    <article data-project-card data-slug="b"></article>
  </div>`;
  window.location.hash = "";
});

test("renders one button per group plus All, and announces the count", () => {
  render(<ProjectFilter groups={[...groups]} cards={cards} labels={labels} locale="en" />);
  expect(screen.getAllByRole("radio")).toHaveLength(3);
  expect(screen.getByRole("status")).toHaveTextContent("2 projects");
});

test("selecting AI hides card a and updates hash", async () => {
  render(<ProjectFilter groups={[...groups]} cards={cards} labels={labels} locale="en" />);
  await userEvent.click(screen.getByRole("radio", { name: "AI" }));
  expect(document.querySelector('[data-slug="a"]')).toHaveAttribute("hidden");
  expect(document.querySelector('[data-slug="b"]')).not.toHaveAttribute("hidden");
  expect(window.location.hash).toBe("#stack=ai");
  expect(screen.getByRole("status")).toHaveTextContent("1 projects");
});

test("keyboard: arrow keys move between radios", async () => {
  render(<ProjectFilter groups={[...groups]} cards={cards} labels={labels} locale="en" />);
  const all = screen.getByRole("radio", { name: "All" });
  all.focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(screen.getByRole("radio", { name: "Frontend" })).toHaveFocus();
});
```

```bash
pnpm test src/lib/filter.test.ts src/islands/ProjectFilter.test.tsx
```
Expected: FAIL (module not found).

- [ ] **Step 3: 구현**

`src/lib/filter.ts`:
```ts
export function parseHashGroup(hash: string, groups: readonly string[]): string | null {
  const m = /^#stack=([a-z]+)$/.exec(hash);
  const g = m?.[1];
  return g && groups.includes(g) ? g : null;
}

export function toHash(group: string | null): string {
  return group ? `#stack=${group}` : "";
}

export function visibleSlugs(cards: { slug: string; groups: string[] }[], group: string | null): string[] {
  return cards.filter((c) => group === null || c.groups.includes(group)).map((c) => c.slug);
}
```

`src/islands/ProjectFilter.tsx`:
```tsx
import { useEffect, useId, useState } from "react";
import type { Locale } from "../i18n/locales";
import { parseHashGroup, toHash, visibleSlugs } from "../lib/filter";

type Group = { id: string; label: string };
type Card = { slug: string; groups: string[] };
type Props = {
  groups: Group[];
  cards: Card[];
  labels: { all: string; count: string; filterLabel: string };
  locale: Locale;
};

export function ProjectFilter({ groups, cards, labels }: Props) {
  const ids = groups.map((g) => g.id);
  const [selected, setSelected] = useState<string | null>(() =>
    typeof window === "undefined" ? null : parseHashGroup(window.location.hash, ids),
  );
  const labelId = useId();
  const visible = visibleSlugs(cards, selected);

  useEffect(() => {
    const show = new Set(visible);
    for (const el of document.querySelectorAll<HTMLElement>("#project-list [data-project-card]")) {
      el.hidden = !show.has(el.dataset.slug ?? "");
    }
    const hash = toHash(selected);
    if (window.location.hash !== hash) history.replaceState(null, "", hash || window.location.pathname);
  }, [selected, visible]);

  const options: Group[] = [{ id: "__all", label: labels.all }, ...groups];
  const current = selected ?? "__all";

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const i = options.findIndex((o) => o.id === current);
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (delta === 0) return;
    e.preventDefault();
    const next = options[(i + delta + options.length) % options.length];
    if (!next) return;
    setSelected(next.id === "__all" ? null : next.id);
    (e.currentTarget.querySelector<HTMLButtonElement>(`[data-id="${next.id}"]`))?.focus();
  }

  return (
    <div className="my-4">
      <span id={labelId} className="text-sm opacity-70">{labels.filterLabel}</span>
      <div role="radiogroup" aria-labelledby={labelId} className="mt-2 flex flex-wrap gap-2" onKeyDown={onKeyDown}>
        {options.map((o) => {
          const checked = o.id === current;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={checked}
              data-id={o.id}
              tabIndex={checked ? 0 : -1}
              className={`rounded-full border px-3 py-1 text-sm ${checked ? "bg-ink text-paper" : ""}`}
              onClick={() => setSelected(o.id === "__all" ? null : o.id)}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <p role="status" aria-live="polite" className="mt-2 text-sm opacity-70">
        {visible.length}{labels.count}
      </p>
    </div>
  );
}
```
왜 라디오 그룹인가: "하나만 고르는 필터"의 접근성 의미가 정확히 radiogroup이다. 화살표 이동과 tabIndex 로빙은 그 패턴의 요구사항이다. `hidden` 속성으로 카드를 숨기는 이유: 카드는 서버에서 렌더된 HTML이고 아일랜드는 그 위에 얹힌다. JS가 없으면 전부 보이고, 있으면 거른다.

`ProjectCard.astro` 루트에는 Task 8에서 이미 `data-slug`가 있다.

```bash
pnpm test
```
Expected: 전부 PASS.

- [ ] **Step 4: 페이지에 마운트**

`src/pages/[...lang]/index.astro` frontmatter에 추가:
```ts
import { ProjectFilter } from "../../islands/ProjectFilter";
const skillGroupById = new Map(skillRows.map((s) => [s.id, s.group]));
const cards = projects.map((p) => ({
  slug: p.slug,
  groups: [...new Set(p.data.stack.map((id) => skillGroupById.get(id)).filter((g): g is NonNullable<typeof g> => g !== undefined))],
}));
const groupLabels = { frontend: "Frontend", ai: "AI", backend: "Backend", tooling: "Tooling" } as const;
const filterGroups = (["frontend", "ai", "backend", "tooling"] as const)
  .filter((g) => cards.some((c) => c.groups.includes(g)))
  .map((g) => ({ id: g, label: groupLabels[g] }));
```
`#projects` 섹션의 `<h2>` 아래, `#project-list` 위에:
```astro
<ProjectFilter client:visible groups={filterGroups} cards={cards} labels={{ all: t(locale, "filter.all"), count: t(locale, "filter.count"), filterLabel: t(locale, "filter.label") }} {locale} />
```

```bash
pnpm check && pnpm build && ls dist/_astro/*.js | wc -l && du -ch dist/_astro/*.js | tail -1
```
Expected: JS 청크가 생겼고(React 런타임 + 아일랜드), 합계가 gzip 전 기준 약 200KB 이하. 이것이 이 사이트의 클라이언트 JS 전부다. 랜딩 외 페이지(`dist/projects/...`)의 HTML에는 `<script`가 인쇄 버튼 한 줄 외에 없어야 한다.

- [ ] **Step 5: Commit**

```bash
pnpm lint && git add -A && git commit -m "feat(landing): project filter island with radiogroup semantics and hash state"
```

---

### Task 12: E2E — smoke, 접근성(axe), SEO

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/smoke.spec.ts`, `tests/e2e/a11y.spec.ts`, `tests/e2e/seo.spec.ts`, `tests/e2e/sitemap.ts`
- Modify: `package.json`, `.gitignore`

**Interfaces:**
- Produces: `pnpm e2e` (빌드된 `dist/`를 `astro preview`로 띄워 실행). `tests/e2e/sitemap.ts`: `export async function sitemapPaths(baseURL: string): Promise<string[]>` — `sitemap-0.xml`의 `<loc>`을 상대 경로로.

- [ ] **Step 1: 설치와 설정**

```bash
pnpm add -D @axe-core/playwright@4.13.0 && pnpm exec playwright install chromium
```
(`@playwright/test@1.62.1`는 Task 6에서 설치됨. 없으면 여기서 추가.)

`playwright.config.ts`:
```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://localhost:4321", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm preview --host 127.0.0.1 --port 4321",
    url: "http://localhost:4321/",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```
`package.json` scripts: `"e2e": "playwright test"`. `.gitignore`에 `test-results/`, `playwright-report/`(Task 1의 .gitignore에 이미 있으면 생략).

`tests/e2e/sitemap.ts`:
```ts
export async function sitemapPaths(baseURL: string): Promise<string[]> {
  const xml = await (await fetch(new URL("/sitemap-0.xml", baseURL))).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1] ?? "").pathname);
}
```

- [ ] **Step 2: 테스트**

`tests/e2e/smoke.spec.ts`:
```ts
import { expect, test } from "@playwright/test";

test("korean root renders and toggles to english on the same page", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await page.getByRole("link", { name: "영어로 보기" }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("link", { name: "View in Korean" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("project page exists in both locales and keeps the page across toggle", async ({ page }) => {
  await page.goto("/projects/sample-project/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("샘플 프로젝트");
  await page.getByRole("link", { name: "영어로 보기" }).click();
  await expect(page).toHaveURL(/\/en\/projects\/sample-project\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Sample Project");
});

test("filter island hides non-matching cards and is shareable via hash", async ({ page }) => {
  // sample-project의 stack(astro, react)은 모두 frontend 그룹이므로 필터 버튼은 All + Frontend 두 개다
  await page.goto("/en/#stack=frontend");
  await expect(page.getByRole("radio", { name: "Frontend" })).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("[data-project-card]:visible")).toHaveCount(1);
  await page.getByRole("radio", { name: "All" }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator("[data-project-card]:visible")).toHaveCount(1);
});

test("resume has a print button and colophon lists ADRs", async ({ page }) => {
  await page.goto("/resume/");
  await expect(page.locator("[data-print]")).toBeVisible();
  await page.goto("/colophon/");
  await expect(page.locator("article[id^='000']").first()).toBeVisible();
});
```

`tests/e2e/a11y.spec.ts`:
```ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { sitemapPaths } from "./sitemap";

test("every page in the sitemap has no serious or critical axe violations", async ({ page, baseURL }) => {
  const paths = await sitemapPaths(baseURL ?? "http://localhost:4321");
  expect(paths.length).toBeGreaterThan(0);
  for (const path of paths) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
    const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad.map((v) => `${path}: ${v.id} (${v.nodes.length})`), path).toEqual([]);
  }
});
```

`tests/e2e/seo.spec.ts`:
```ts
import { expect, test } from "@playwright/test";
import { sitemapPaths } from "./sitemap";

test("canonical points to itself and hreflang is reciprocal on every page", async ({ page, baseURL }) => {
  const base = baseURL ?? "http://localhost:4321";
  const paths = await sitemapPaths(base);
  for (const path of paths) {
    await page.goto(path);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(new URL(canonical ?? "").pathname, `${path} canonical`).toBe(path);

    const alts = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((els) =>
      els.map((e) => ({ lang: e.getAttribute("hreflang"), href: e.getAttribute("href") })),
    );
    expect(alts.map((a) => a.lang).sort()).toEqual(["en", "ko", "x-default"]);
    // 상호참조: 각 대안 페이지의 hreflang 집합도 같은 URL들을 가리켜야 한다
    for (const a of alts.filter((x) => x.lang !== "x-default")) {
      await page.goto(new URL(a.href ?? "").pathname);
      const back = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((els) => els.map((e) => e.getAttribute("href")));
      expect(back, `${a.href} must link back to ${path}`).toContain(canonical);
      await page.goto(path);
    }
  }
});

test("sitemap has both locales for every page", async ({ baseURL }) => {
  const paths = await sitemapPaths(baseURL ?? "http://localhost:4321");
  const ko = paths.filter((p) => !p.startsWith("/en/"));
  for (const p of ko) expect(paths, p).toContain(`/en${p}`);
});
```

- [ ] **Step 3: 실행**

```bash
pnpm build && pnpm e2e
```
Expected: 전부 통과. axe에서 색 대비(`color-contrast`)가 serious로 잡히면 `global.css`의 토큰 값을 고친다. 시각 디자인 단계에서 다시 바뀌더라도 이 테스트가 게이트다.

- [ ] **Step 4: Commit**

```bash
pnpm lint && git add -A && git commit -m "test(e2e): smoke, axe accessibility and seo reciprocity over the sitemap"
```

---

### Task 13: CI, 레포 위생, 문서, Vercel 배포

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/links.yml`, `.github/dependabot.yml`, `.github/PULL_REQUEST_TEMPLATE.md`, `vercel.json`, `.env.example`, `README.md`, `CONTRIBUTING.md`, `LICENSE`, `docs/architecture.md`, `docs/content-guide.md`, `scripts/content-status.ts`, `src/lib/content-status.ts`, `src/lib/content-status.test.ts`, `.vscode/settings.json`, `.vscode/extensions.json`

**Interfaces:**
- Produces `src/lib/content-status.ts`: `export type ProjectStatusRow = { slug: string; hasEn: boolean; screens: number; metrics: number; metricsWithEvidence: number }`, `export function statusRows(root?: string): ProjectStatusRow[]`, `export function formatTable(rows: ProjectStatusRow[]): string`
- Produces `pnpm content:status`.

- [ ] **Step 1: 실패하는 테스트 → 콘텐츠 상태 스크립트**

`src/lib/content-status.test.ts`:
```ts
import { expect, test } from "vitest";
import { formatTable, statusRows } from "./content-status";

test("statusRows reads the sample project", () => {
  const rows = statusRows();
  const s = rows.find((r) => r.slug === "sample-project");
  expect(s).toMatchObject({ hasEn: true, screens: 1, metrics: 1, metricsWithEvidence: 0 });
});

test("formatTable is one line per project", () => {
  const out = formatTable([{ slug: "a", hasEn: false, screens: 2, metrics: 0, metricsWithEvidence: 0 }]);
  expect(out.split("\n")).toHaveLength(2); // header + 1 row
  expect(out).toContain("a");
});
```

`src/lib/content-status.ts`:
```ts
import { existsSync } from "node:fs";
import { join } from "node:path";
import { z } from "astro/zod";
import { projectSchema } from "../content/schemas";
import { CONTENT_ROOT, listProjectSlugs, projectDir, readYaml, storyPath } from "./content-files";

export type ProjectStatusRow = { slug: string; hasEn: boolean; screens: number; metrics: number; metricsWithEvidence: number };

export function statusRows(root: string = CONTENT_ROOT): ProjectStatusRow[] {
  return listProjectSlugs(root).map((slug) => {
    const data = projectSchema(() => z.string()).parse(readYaml(join(projectDir(slug, root), "meta.yaml")));
    return {
      slug,
      hasEn: existsSync(storyPath(slug, "en", root)),
      screens: data.screens.length,
      metrics: data.metrics.length,
      metricsWithEvidence: data.metrics.filter((m) => m.evidence).length,
    };
  });
}

export function formatTable(rows: ProjectStatusRow[]): string {
  const head = "slug | en.md | screens | metrics | with evidence";
  return [head, ...rows.map((r) => `${r.slug} | ${r.hasEn ? "yes" : "NO"} | ${r.screens} | ${r.metrics} | ${r.metricsWithEvidence}`)].join("\n");
}
```

`scripts/content-status.ts`:
```ts
import { formatTable, statusRows } from "../src/lib/content-status";
console.log(formatTable(statusRows()));
```
`package.json`: `"content:status": "tsx scripts/content-status.ts"`.

```bash
pnpm test src/lib/content-status.test.ts && pnpm content:status
```
Expected: PASS, 표 출력.

- [ ] **Step 2: CI 워크플로우**

`.github/workflows/ci.yml`:
```yaml
name: ci
on:
  push: { branches: [main] }
  pull_request:
jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm check
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm e2e
        env: { CI: "1" }
      - uses: gitleaks/gitleaks-action@v2
        env: { GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}" }
      - if: github.event_name == 'pull_request'
        run: pnpm exec commitlint --from ${{ github.event.pull_request.base.sha }} --to ${{ github.event.pull_request.head.sha }}
```
`pnpm/action-setup@v4`는 `packageManager` 필드에서 버전을 읽는다. Lighthouse 예산 단계는 2차 계획에서 이 파일에 추가한다.

`.github/workflows/links.yml`:
```yaml
name: links
on:
  schedule: [{ cron: "0 3 * * 1" }]
  pull_request: { paths: ["content/**"] }
  workflow_dispatch:
jobs:
  lychee:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: pnpm }
      - run: pnpm install --frozen-lockfile && pnpm build
      - uses: lycheeverse/lychee-action@v2
        with:
          args: --no-progress --exclude 'localhost' 'dist/**/*.html'
          fail: true
```

`.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule: { interval: weekly }
    groups:
      minor-and-patch: { update-types: [minor, patch] }
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: weekly }
```

`.github/PULL_REQUEST_TEMPLATE.md`:
```markdown
## 무엇을
## 왜
## 체크
- [ ] ADR이 필요한 결정인가? 필요하면 `pnpm adr` 로 추가했다
- [ ] ko와 en 문자열/본문을 함께 갱신했다 (또는 en 지연을 `pnpm content:status`로 확인했다)
- [ ] 스크린샷을 바꿨다면 `capturedAt`/`commit`도 갱신했다
```

- [ ] **Step 3: Vercel 보안 헤더, env 예시, 에디터 설정**

`vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" }
      ]
    }
  ]
}
```
`'unsafe-inline'`은 Astro 인라인 스크립트(인쇄 버튼)와 Tailwind 스타일 때문에 필요하다. 2차 계획에서 Astro의 CSP 기능으로 해시 기반으로 바꾸는 것을 검토한다.

`.env.example`:
```
# 현재 필요한 환경변수 없음. AI seam(ADR-0002)이 열리면 ANTHROPIC_API_KEY가 여기 추가된다.
```

`.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "files.eol": "\n",
  "[typescript]": { "editor.defaultFormatter": "biomejs.biome" },
  "[typescriptreact]": { "editor.defaultFormatter": "biomejs.biome" },
  "[json]": { "editor.defaultFormatter": "biomejs.biome" },
  "[css]": { "editor.defaultFormatter": "biomejs.biome" },
  "[astro]": { "editor.defaultFormatter": "esbenp.prettier-vscode" }
}
```
`.vscode/extensions.json`:
```json
{ "recommendations": ["astro-build.astro-vscode", "biomejs.biome", "esbenp.prettier-vscode"] }
```

- [ ] **Step 4: 문서**

`README.md`:
```markdown
# Hello, I am Doik

웹·AI 개발자 이도익의 포트폴리오. https://hello-iam-doik.vercel.app

![landing](content/projects/sample-project/screens/01-home@desktop.png)

## 실행
```bash
corepack enable && pnpm install
pnpm dev        # http://localhost:4321
pnpm build && pnpm preview
```

## 콘텐츠는 어떻게 들어가나
모든 콘텐츠는 `content/`에 있다. 프로젝트 하나 = `content/projects/<slug>/` 폴더 하나(`meta.yaml` + `ko.md` + 선택적 `en.md` + `screens/`).
빌드 시 `src/content/schemas.ts`의 Zod 스키마가 검증하므로 누락 필드나 없는 이미지는 빌드를 실패시킨다. 절차는 [docs/content-guide.md](docs/content-guide.md).

## 왜 Astro인가, 왜 이렇게 만들었나
결정마다 기록이 있다: [docs/adr](docs/adr). 시작은 [0001 Astro over Next.js](docs/adr/0001-astro-over-nextjs.md).
구조 한 장: [docs/architecture.md](docs/architecture.md). 제작 방식과 AI 활용 공개: [docs/how-this-was-built.md](docs/how-this-was-built.md).

## 품질
`pnpm check` 타입 · `pnpm lint` Biome/Prettier · `pnpm test` 콘텐츠 계약 테스트 · `pnpm e2e` Playwright smoke/axe/SEO. CI가 이 전부를 PR마다 돌린다.
```

`CONTRIBUTING.md`:
```markdown
# Contributing (solo repo, but written for a reader)

- 브랜치: `feat/…`, `content/…`, `docs/…`. main에 직접 푸시하지 않는다.
- 커밋: Conventional Commits. 로컬 훅은 commit-msg 하나(commitlint). 포맷·테스트는 CI가 막는다 (ADR-0007).
- 커밋 전 `pnpm format && pnpm test`를 습관으로.
- Windows: Git Bash 권장. PowerShell이면 `&&` 대신 `;`. 줄바꿈은 `.gitattributes`가 LF로 맞춘다.
- 의존성: 매달 `pnpm outdated` 확인, Dependabot PR은 CI 통과 시 병합.
```

`LICENSE`: MIT 본문(코드). 끝에 한 줄 추가: `content/ 아래의 글과 스크린샷은 All Rights Reserved.`

`docs/architecture.md`:
```markdown
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
```

`docs/content-guide.md`:
```markdown
# 프로젝트 5분 추가

1. `content/projects/<slug>/` 폴더 생성. slug는 URL 세그먼트(kebab-case).
2. `meta.yaml` 작성. 필드는 `src/content/schemas.ts` 참고. `stack`은 `content/skills.yaml`의 id.
3. `ko.md` 작성. `## 문제 / ## 접근 / ## 결과 / ## 배운 점` 4개 H2 필수.
4. `screens/NN-<what>@<device>.png` 추가, `meta.yaml`의 `screens`에 `capturedAt` 포함해 등록. 1.5MB 이하.
5. (선택) `en.md`. 없으면 /en/에서 한국어 본문 + 안내문.
6. `pnpm test` (계약 테스트) → `pnpm build` → PR.
7. `pnpm content:status`로 누락 확인.

## 지원 전 수동 체크
- 네이버 서치어드바이저에 `sitemap-index.xml` 제출
- 카카오톡 인앱 브라우저에서 랜딩·프로젝트 페이지 확인 (`100vh` 금지, `dvh` 사용)
- 카카오 OG 캐시 갱신(개발자 도구 → 링크 디버거)
```

- [ ] **Step 5: 전체 검증**

```bash
pnpm check && pnpm lint && pnpm test && pnpm build && pnpm e2e
```
Expected: 전부 통과.

- [ ] **Step 6: Commit, GitHub 원격, Vercel**

```bash
git add -A && git commit -m "chore: ci pipeline, security headers, repo docs and content status script"
```

GitHub 레포 생성과 푸시(사용자가 `gh auth login`이 되어 있어야 한다. 공개 레포):
```bash
gh repo create LeeDoik/hello-iam-doik --public --source=. --remote=origin --push
```
GitHub 설정에서 Secret scanning → Push protection 활성화(수동, 스펙 §7).

Vercel: 대시보드에서 GitHub 레포 import. 프레임워크 프리셋 Astro 자동 감지, 빌드 명령 `pnpm build`, 출력 `dist`. 프로덕션 URL을 확인해 `astro.config.ts`의 `site`, `public/robots.txt`, `README.md`가 실제 도메인과 같은지 맞춘다(다르면 수정 후 커밋).

배포 후 확인:
```bash
curl -sI https://<실제도메인>/ | grep -i -E 'x-content-type-options|content-security-policy'
curl -s https://<실제도메인>/en/ | grep -o '<link rel="canonical"[^>]*>'
```
Expected: 보안 헤더 존재, canonical이 `/en/`.

- [ ] **Step 7: 마지막 커밋과 체크리스트**

푸터의 "Last deployed"가 Vercel 커밋 sha를 보여주는지 라이브에서 확인. CI가 main에서 초록인지 확인. 여기까지가 1차 계획의 완료 조건이다.

---

## 스펙 대조 (자체 검토 결과)

| 스펙 항목 | 태스크 |
|---|---|
| §2 스택 전부(3D 히어로 제외) | 1, 2, 7, 11, 12 |
| §3 레포 구조 | 1~13 (캡처 스크립트·OG 엔드포인트·Hero3D·llms.txt는 2차) |
| §4 콘텐츠 모델·스키마 | 5, 6 |
| §5 i18n 전부 + 스파이크 | 4, 6, 7 |
| §6 자산 파이프라인 | `<Picture>` 렌더와 `image()` 검증만 9. 캡처 스크립트·sidecar·OG·폰트는 2차 |
| §7 품질 게이트 | 2(린트·commitlint), 5~6(Vitest), 12(e2e), 13(CI·gitleaks·Dependabot·lychee). Lighthouse는 2차 |
| §8 훅 요소 | 케이스 스터디 골격 9, 증거 지표 9, AI 블록 9, 스킬=만든 것 8, 배포 푸터 7, 필터 11, 이력서·콜로폰 10. OG·llms.txt·Hero3D는 2차 |
| §9 히어로 3D | 2차. `#hero` 섹션 자리만 8 |
| §10 AI seam | ADR-0002 (3), `.env.example` (13) |
| §11 ADR 0001~0004, 0006, 0007 | 3, 4, 6. 0005(캡처), 0008(3D), 0009(OG)는 2차 |
| §13 1~3단계 | 이 계획 전체 |

의도적으로 1차에서 뺀 것: `scripts/capture-screens.ts`, `src/pages/og/`, `src/pages/llms.txt.ts`, `Hero3D`, Lighthouse CI, Pretendard 폰트. 모두 2차 계획.
