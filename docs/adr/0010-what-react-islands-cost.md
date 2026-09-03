---
title: "What React islands cost and why we pay it"
status: accepted
date: "2026-09-03"
---

# What React islands cost and why we pay it

## Context and Problem Statement

ADR-0001은 "정적 콘텐츠 사이트 + 위젯 두세 개에는 Astro가 유리하다"고 결정했다. 이제 아일랜드가 3개(`ProjectFilter`, `QualityToggle`, `Hero3D`)가 되었으니, React 런타임을 얹는 실제 비용을 숫자로 확인하고 왜 그 비용을 감수하는지 기록한다.

## Considered Options

- 아일랜드를 없애고 vanilla JS/웹 컴포넌트로 재작성(React 런타임 제거)
- React 아일랜드 유지, 예산 테스트로 상한만 강제

## Decision Outcome

선택: React 아일랜드 유지. `pnpm build && pnpm test:build` 기준(2026-09-03), `dist/_astro`의 클라이언트 JS 청크는 다음과 같다(gzip):

| 청크 | 내용 | gzip |
| --- | --- | --- |
| `client.*.js` | React 19 하이드레이션 런타임 | 56.0KB |
| `react.*.js` | React 코어(공유 청크) | 2.8KB |
| `ProjectFilter.*.js` | 프로젝트 필터 아일랜드 | 1.0KB |
| `QualityToggle.*.js` | 히어로 품질 토글 아일랜드 | 0.4KB |
| `Hero3D.*.js` | 히어로 3D 아일랜드(로더) | 1.5KB |
| `hero-scene.*.js` | three.js 신(동적 import, 랜딩 전용) | 124.6KB |
| `jsx-runtime.*.js` / `motion-prefs.*.js` | 공유 런타임/순수 로직 | 0.3KB / 0.2KB |
| **합계** | | **186.9KB** (예산 250KB) |

React 런타임 자체(`client` + `react`)는 약 58.8KB gzip이고, 아일랜드 3개의 고유 코드는 합쳐서 약 3KB(three 제외)다. React 런타임 58.8KB는 아일랜드가 하나든 셋이든 한 번만 로드되므로, 아일랜드를 늘릴수록 "고정비 대비 한계비용"은 낮아진다.

### Consequences

- 좋은 점: 세 아일랜드가 하나의 React 런타임을 공유하므로 아일랜드를 추가할 때마다 드는 한계비용이 작다(예: `QualityToggle`은 0.4KB). 국내 채용 공고 대부분이 React를 요구하므로, 실제로 동작하는 React 코드(하이드레이션, 이벤트, 상태)가 저장소에 있다.
- 나쁜 점 / 감수한 것: `QualityToggle`이 헤더(모든 페이지)에 있어서, 랜딩이 아닌 페이지도 React 하이드레이션 런타임(약 59KB)을 받는다. React 아일랜드가 아니라 vanilla script로 짰다면 이 58.8KB는 0이었을 것이다.
- 되돌리는 조건(deletion trigger): 아일랜드가 하나로 줄어들거나(React를 유지할 이유가 약해짐), 국내 채용 시장에서 React 요구가 유의미하게 사라질 때.

## Try it (5분 실험)

`pnpm build && pnpm test:build` — 콘솔에 청크별 gzip 크기와 합계가 출력된다(`tests/build/js-budget.test.ts`의 "gzip total is within budget"). 위 표의 숫자와 비교해 회귀 여부를 확인한다.

## What I learned

"React를 쓴다"는 결정의 진짜 비용은 컴포넌트 코드 크기가 아니라 런타임(하이드레이션) 크기다. 이번에 처음 계산해보니 런타임이 아일랜드 고유 코드보다 훨씬 크다(58.8KB 대 3KB). 그래서 "아일랜드를 몇 개 쓰느냐"보다 "런타임을 로드하느냐 마느냐"가 예산에서 더 중요한 질문이고, 답은 이미 ADR-0001에서 "0개"가 아니라 "두세 개"로 정해져 있었다. 이번 ADR은 그 결정을 숫자로 재확인한 것이다.
