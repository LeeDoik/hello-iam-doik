---
title: "Hero-only 3D with fallbacks and a JS budget"
status: accepted
date: "2026-09-03"
---

# Hero-only 3D with fallbacks and a JS budget

## Context and Problem Statement

레퍼런스 사이트들은 three.js로 전체 화면 배경(스크롤 연동 3D 신)을 만든다. 이 사이트는 정적·콘텐츠 우선(ADR-0001, ADR-0002)이 원칙이므로, three를 그대로 들여오면 원칙과 충돌한다. "히어로 섹션 배경 하나"만 가져오고, 나머지는 성능·접근성 예산으로 통제해야 했다.

## Considered Options

- three.js 없이 CSS 그라디언트/애니메이션만 사용
- three.js로 히어로 배경 하나만, 정적 import(항상 로드)
- three.js로 히어로 배경 하나만, 동적 import + 3단 폴백(감속 모션, WebGL/저사양, 사용자 토글) + JS 예산 테스트

## Decision Outcome

선택: 세 번째 옵션. `src/lib/hero-scene.ts`는 `Hero3D.tsx`의 `useEffect` 안에서 `import("../lib/hero-scene")`로만 로드되므로, three(청크 124.6KB gzip)는 필요한 사용자에게만 내려간다. 품질은 `src/lib/motion-prefs.ts`의 `decideQuality`가 순서대로 판정한다: OS의 `prefers-reduced-motion` → `"off"`(저장값도 무시), 저장된 사용자 선택(`localStorage["hero-quality"]`) → 그대로, WebGL 미지원 → `"off"`, 코어 ≤4 또는 메모리 ≤4(저사양) → `"low"`, 그 외 → `"high"`. 헤더의 `QualityToggle`(`client:idle`)로 사용자가 언제든 순환(`high → low → off`)할 수 있고, 선택은 `localStorage`에 남는다. `tests/build/js-budget.test.ts`가 청크당 200KB, 총 250KB 상한을 강제한다(2026-09-03 빌드: hero-scene 124.6KB, 총 186.9KB — [ADR-0010](./0010-what-react-islands-cost.md) 참고).

### Consequences

- 좋은 점: `off`인 사용자(감속 모션, WebGL 없음, 토글로 끔)는 three 청크를 전혀 내려받지 않는다. 랜딩이 아닌 페이지(프로젝트, 콜로폰, 이력서)는 hero-scene 청크를 참조하지 않는다(`tests/build/js-budget.test.ts`의 "the hero/three chunk is reachable only from the landing page"가 검증).
- 나쁜 점 / 감수한 것: three 자체가 런타임 의존성으로 추가되어 `pnpm build` 아웃풋에 청크 하나가 더 생긴다. 감속 모션·저사양 판정 로직(`decideQuality`)을 직접 짜고 유지보수해야 한다.
- 되돌리는 조건(deletion trigger): 예산 초과(청크 200KB 또는 총 250KB)가 반복되거나, Lighthouse TBT(Total Blocking Time) 실패가 반복되면 three를 걷어내고 CSS 그라디언트로 격하한다.

## Try it (5분 실험)

Chrome DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce" 를 켜고 새로고침. `#hero canvas`의 `data-quality` 속성이 `"off"`여야 하고, Network 탭에 `hero-scene.*.js` 요청이 없어야 한다. 끄고 새로고침하면 `data-quality`가 `"high"` 또는 `"low"`가 되고 `hero-scene.*.js`가 로드된다. 헤더의 "배경 효과" 버튼을 두 번 누르면 `off`로 바뀌고, 새로고침해도 유지된다(localStorage).

## What I learned

동적 import는 "무거운 의존성"과 "그 의존성이 필요한 조건"을 분리하는 도구다. three를 정적으로 import했다면 예산 테스트로 존재를 확인할 수는 있어도 "필요 없는 사용자는 안 받는다"는 것을 증명할 방법이 없다. `import()`가 만드는 별도 청크와, 그 청크를 참조하는 파일이 랜딩 HTML에만 있는지를 빌드 산출물에서 직접 검사하는 테스트를 짜고 나서야, 이 경계가 실제로 지켜진다는 걸 코드로 증명할 수 있었다. 또한 `reducedMotion`을 저장값보다 우선순위를 높게 둔 이유는, OS 설정이 접근성 요구(전정기관 장애 등 의학적 이유)일 수 있어서 사이트 안의 토글이 그것을 덮어써서는 안 되기 때문이다.
