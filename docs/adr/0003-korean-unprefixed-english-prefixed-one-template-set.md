---
title: Korean unprefixed, English prefixed, one template set
status: accepted
date: "2026-09-02"
---

# Korean unprefixed, English prefixed, one template set

## Context and Problem Statement

이 사이트는 한국어(기본)와 영어 두 로케일을 지원해야 한다. 정적 호스트(Vercel의 정적 배포)에는 요청을 가로채 `Accept-Language`를 읽고 리다이렉트할 서버가 없다. 즉 어떤 페이지가 어느 언어인지 판단할 유일한 신호는 URL 그 자체다. `/`가 한국어인지 영어인지, `/en/`이 정말 영어 트리 전체를 커버하는지, 그리고 이 구분을 페이지마다 손으로 반복하지 않고 어떻게 강제할지를 정해야 했다.

## Considered Options

- 두 로케일 모두 접두사를 붙인다 (`/ko/`, `/en/`), 루트에서 기본 로케일로 리다이렉트.
- 한국어는 접두사 없이 `/`, 영어만 `/en/` 접두사 (`prefixDefaultLocale: false`).
- 로케일별로 완전히 분리된 페이지 디렉터리(`src/pages/ko/*`, `src/pages/en/*`)를 손으로 유지.
- Astro의 `[...lang]` rest 파라미터 라우트 하나로 두 로케일을 모두 생성 (선택).

## Decision Outcome

선택: 한국어는 접두사 없이 `/`, 영어는 `/en/`. Astro의 내장 `i18n.routing.prefixDefaultLocale: false`로 이를 표현하고, 루트 리다이렉트는 두지 않는다(정적 호스트에는 리다이렉트할 서버가 없으므로 애초에 불필요). 라우팅은 `src/pages/[...lang]/index.astro` 하나의 템플릿으로 두 로케일 트리를 모두 생성한다: `getStaticPaths()`가 `[{ params: { lang: undefined } }, { params: { lang: "en" } }]`을 반환하면, Astro는 `lang: undefined`를 rest 파라미터의 "세그먼트 없음"으로 해석해 `/`에 매치시키고 `lang: "en"`은 `/en/`에 매치시킨다. 실제로 `pnpm build`를 돌려 이 동작을 확인했다(아래 Try it). 템플릿을 두 벌(로케일별 디렉터리)로 유지하는 대안은 두 트리가 시간이 지나며 구조적으로 갈라질 위험(한쪽만 섹션을 추가하는 등)이 있어 기각했다.

### Consequences

- 좋은 점: 템플릿이 한 벌이라 페이지 구조가 로케일 간에 구조적으로 어긋날 수 없다. URL만으로 로케일이 결정되므로 서버 로직이 전혀 필요 없다(정적 호스팅과 맞음). `src/lib/urls.ts`(`localePath`/`stripLocale`/`swapLocale`)와 `src/i18n/ui.ts`(`satisfies`로 키 누락을 컴파일 에러로 잡는 UI 딕셔너리)가 순수 함수로 분리되어 있어 라우팅과 무관하게 유닛 테스트로 검증된다.
- 나쁜 점 / 감수한 것: `getStaticPaths`가 반환하는 `{ params: { lang: undefined } }`이 rest 파라미터에서 "루트에 매치"를 의미한다는 것은 Astro의 문서화된 동작이지만 직관적이지 않아, 이 ADR과 코드 주석 없이는 다음에 읽을 때 다시 헷갈릴 수 있다. 또한 두 로케일 모두 항상 동일한 섹션 구성을 갖는다는 전제가 깔려 있어, 로케일마다 다른 페이지 구성이 필요해지면 이 설계로는 표현할 수 없다.
- 되돌리는 조건(deletion trigger): 세 번째 로케일이 추가되거나, 로케일별로 서로 다른 페이지 구성(예: 영어만 있는 섹션)이 필요해지면 이 한 템플릿 접근을 버리고 로케일별 분리 구조로 되돌린다.

## Try it (5분 실험)

```bash
pnpm build && ls dist dist/en
```

실제 결과:
```
dist:
en
index.html

dist/en:
index.html
```

그리고 두 페이지가 서로를 올바르게 가리키는지:
```bash
grep -o 'href="[^"]*"' dist/index.html dist/en/index.html
```
실제 결과:
```
dist/index.html:href="/en/"
dist/en/index.html:href="/"
```
`/`(한국어)의 토글 링크는 `/en/`을, `/en/`(영어)의 토글 링크는 `/`를 가리킨다. `[...lang]` 스파이크는 계획대로 동작했고 폴백(로케일별 미러 디렉터리 + parity 테스트)은 필요하지 않았다.

## What I learned

Astro의 동적 라우트 파라미터에서 `undefined`는 단순히 "빈 문자열"이 아니라 rest 파라미터 세그먼트 자체가 없는 상태를 뜻하며, 이것이 정확히 "접두사 없는 루트"와 대응한다. 이 성질 덕분에 `if (locale === "en") 다른 페이지` 같은 조건 분기 없이, 로케일 목록을 순회하는 순수 함수(`localeStaticPaths`)만으로 라우트 매트릭스 전체를 생성할 수 있었다. 또한 `path`(URL)와 `locale`(비즈니스 로직)을 다루는 함수들을 `astro:*`나 `Astro` 글로벌에 전혀 의존하지 않는 순수 TypeScript로 분리해두면, Astro 컴포넌트를 렌더링하지 않고도 Vitest로 빠르게 검증할 수 있다는 것을 다시 확인했다.
