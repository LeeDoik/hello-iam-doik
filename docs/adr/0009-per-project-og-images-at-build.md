---
title: "Per-project OG images at build"
status: "accepted"
date: "2026-09-03"
---

# Per-project OG images at build

## Context and Problem Statement

카카오톡·슬랙·링크드인에 링크를 붙여넣었을 때 뜨는 미리보기 카드가 국내 채용 담당자가 이 포트폴리오를 처음 마주치는 순간이다. 지금까지 `Base.astro`는 `ogImage`를 받으면 `og:image`를 찍어내는 자리만 마련해 두었을 뿐, 실제 이미지는 없었다. 로케일마다(ko/en), 프로젝트마다 다른 제목·요약을 담은 카드가 필요하다.

## Considered Options

- 빌드 시 satori(HTML 유사 객체 트리 → SVG) + resvg(SVG → PNG)로 로케일·프로젝트별 PNG를 정적으로 생성
- Vercel의 런타임 OG Image Generation(Edge Function)을 붙인다
- 카드 하나만 손으로 만들어 모든 페이지에 재사용한다

## Decision Outcome

선택: 빌드 시 satori + resvg로 로케일별·프로젝트별 PNG를 생성해 `dist/og/`에 정적 파일로 남긴다. 사이트 전체가 "서버 없음" 원칙(ADR-0002) 위에 서 있는데, Vercel 런타임 OG는 그 원칙을 깨고 캐시·콜드스타트를 새로 걱정해야 한다. 반면 빌드 시 생성은 `getStaticPaths`로 페이지를 늘리는 것과 같은 패턴이라 나머지 정적 페이지들과 동일하게 다룰 수 있고, 결과물은 순수 PNG라 CDN이 영구 캐시해도 된다.

### Consequences

- 좋은 점: 런타임 의존성이 없다. `og:image` URL이 다른 정적 자산과 똑같이 캐시·프리로드된다. `src/lib/og.ts`(순수 객체 트리 생성)와 `src/lib/og-render.ts`(satori/resvg 호출)를 분리해 전자는 단위 테스트로, 후자는 빌드로만 검증한다.
- 나쁜 점 / 감수한 것: satori는 WOFF2를 읽지 못해 Pretendard를 WOFF로 한 번 더 내려받아 벤더링했다(Regular·Bold 두 굵기만). 프로젝트 수 × 로케일 수만큼 빌드 시간이 늘어난다. Astro 정적 엔드포인트가 prerender 번들을 `dist/.prerender/chunks/`로 옮기면서 `new URL(..., import.meta.url)` 기반 상대 경로가 깨지는 걸 발견해, 폰트 경로를 `process.cwd()` 기준 절대 경로로 바꿨다(`astro build`는 항상 프로젝트 루트에서 실행되므로 안전하다).
- 되돌리는 조건(deletion trigger): 프로젝트 수 × 로케일이 수백 단위로 늘어 `pnpm build` 시간이 눈에 띄게 느려지면, 정적 생성 대신 요청 시 생성(런타임 함수 또는 ISR 유사 방식)으로 전환한다.

## Try it (5분 실험)

```bash
pnpm build && start dist/og/ko.png
```

(Windows가 아니면 `dist/og/ko.png` 파일을 그냥 연다.) 한글 제목·요약이 tofu(네모) 없이 렌더된 1200×630 카드가 보인다. `dist/og/projects/sample-project/en.png`를 열면 같은 카드가 영문 콘텐츠로 나온다.

## What I learned

`new URL(x, import.meta.url)`이 "어디서 실행하든 같은 파일을 가리킨다"는 건 실행 환경이 소스 트리 그대로일 때의 이야기다. 번들러가 모듈을 물리적으로 다른 디렉터리로 옮기면(여기서는 Astro의 정적 엔드포인트 prerender 청크) 그 상대 경로는 번들 결과물 기준으로 재계산되고, 소스에 있던 자산은 함께 옮겨지지 않는다. Vite는 클라이언트 번들에서는 이 패턴을 에셋 임포트로 인식해 복사해 주지만, 이번처럼 Node에서 실행되는 SSR/prerender 청크에서는 그렇게 해주지 않았다. 빌드가 항상 같은 위치(프로젝트 루트)에서 실행된다는 더 강한 보장이 있다면, `import.meta.url` 대신 `process.cwd()` 기준 절대 경로가 더 안정적이다.
