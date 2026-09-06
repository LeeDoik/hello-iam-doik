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

선택: 세 번째 옵션. `src/lib/hero-scene.ts`는 `Hero3D.tsx`의 `useEffect` 안에서 `import("../lib/hero-scene")`로만 로드되므로, three(청크 124.6KB gzip)는 필요한 사용자에게만 내려간다. 품질은 `src/lib/motion-prefs.ts`의 `decideQuality`가 순서대로 판정한다: OS의 `prefers-reduced-motion` → `"off"`(저장값도 무시), 저장된 사용자 선택(`localStorage["hero-quality"]`) → 그대로, WebGL 미지원 → `"off"`, 코어 ≤4 또는 메모리 ≤4(저사양) → `"low"`, 그 외 → `"high"`. 헤더의 `QualityToggle`(`client:idle`)로 사용자가 언제든 순환(`high → low → off`)할 수 있고, 선택은 `localStorage`에 남는다. `tests/build/js-budget.test.ts`가 청크당 200KB, 총 250KB 상한을 강제한다(2026-09-03 빌드: hero-scene 124.6KB, 총 187.0KB — [ADR-0010](/colophon/0010-what-react-islands-cost/) 참고).

### Consequences

- 좋은 점: `off`인 사용자(감속 모션, WebGL 없음, 토글로 끔)는 three 청크를 전혀 내려받지 않는다. 랜딩이 아닌 페이지(프로젝트, 콜로폰, 이력서)는 hero-scene 청크를 참조하지 않는다(`tests/build/js-budget.test.ts`의 "the hero/three chunk is reachable only from the landing page"가 검증).
- 나쁜 점 / 감수한 것: three 자체가 런타임 의존성으로 추가되어 `pnpm build` 아웃풋에 청크 하나가 더 생긴다. 감속 모션·저사양 판정 로직(`decideQuality`)을 직접 짜고 유지보수해야 한다.
- 되돌리는 조건(deletion trigger): 예산 초과(청크 200KB 또는 총 250KB)가 반복되거나, Lighthouse TBT(Total Blocking Time) 실패가 반복되면 three를 걷어내고 CSS 그라디언트로 격하한다.

## Try it (5분 실험)

Chrome DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce" 를 켜고 새로고침. `#hero canvas`의 `data-quality` 속성이 `"off"`여야 하고, Network 탭에 `hero-scene.*.js` 요청이 없어야 한다. 끄고 새로고침하면 `data-quality`가 `"high"` 또는 `"low"`가 되고 `hero-scene.*.js`가 로드된다. 헤더의 "배경 효과" 버튼을 두 번 누르면 `off`로 바뀌고, 새로고침해도 유지된다(localStorage).

## What I learned

동적 import는 "무거운 의존성"과 "그 의존성이 필요한 조건"을 분리하는 도구다. three를 정적으로 import했다면 예산 테스트로 존재를 확인할 수는 있어도 "필요 없는 사용자는 안 받는다"는 것을 증명할 방법이 없다. `import()`가 만드는 별도 청크와, 그 청크를 참조하는 파일이 랜딩 HTML에만 있는지를 빌드 산출물에서 직접 검사하는 테스트를 짜고 나서야, 이 경계가 실제로 지켜진다는 걸 코드로 증명할 수 있었다. 또한 `reducedMotion`을 저장값보다 우선순위를 높게 둔 이유는, OS 설정이 접근성 요구(전정기관 장애 등 의학적 이유)일 수 있어서 사이트 안의 토글이 그것을 덮어써서는 안 되기 때문이다.

## Amendment 2026-09-06

GitHub Actions의 헤드리스 Chrome(SwiftShader 소프트웨어 WebGL)에서 Lighthouse CI를 돌리면 히어로 셰이더가 매 프레임 CPU로 렌더링되어 `/`의 Total Blocking Time이 939ms(예산 200ms 이하)까지 치솟았다. 실제 GPU에서는 영향이 없었다 — 문제는 셰이더 자체가 아니라 소프트웨어 래스터라이저에서의 실행 비용이었다.

그래서 소프트웨어 WebGL 렌더러(SwiftShader, llvmpipe 등)도 저사양 신호로 취급한다: `Hero3D.tsx`의 `hasWebgl()`이 컨텍스트를 얻은 뒤 `WEBGL_debug_renderer_info` 확장으로 `UNMASKED_RENDERER_WEBGL`을 읽어 렌더러 문자열이 `swiftshader|llvmpipe|software|mesa offscreen|microsoft basic render`에 매치하면 `softwareRenderer: true`를 `decideQuality`에 전달한다. `decideQuality`는 이 신호를 WebGL 미지원 검사 바로 다음, 코어/메모리 저사양 판정보다 앞에 두고 `"off"`를 반환한다 — 단, 저장된 사용자 선택(`localStorage["hero-quality"]`)이 있으면 그대로 존중한다(토글로 명시적으로 켠 사용자의 선택을 소프트웨어 렌더러 판정이 덮어쓰지 않는다).

이 변경은 CI만을 위한 것이 아니다: 가상 머신, 원격 데스크톱, GPU 드라이버가 없는 환경 등 실제 사용자도 소프트웨어 WebGL로 렌더링되는 경우가 있고, 이들도 동일하게 보호된다.

## Amendment 2026-09-07

라이브 사이트를 Lighthouse 모바일 프로필로 반복 측정하자 같은 페이지가 두 갈래로 나뉘었다. 자원은 300ms 안에 다 받았는데 첫 페인트(observed FCP)가 180ms인 실행과 2,170ms인 실행이 섞였고, `--force-prefers-reduced-motion`으로 히어로를 끄면 4회 모두 180ms였다. 즉 느린 갈래는 네트워크가 아니라 히어로 아일랜드였다. 하이드레이션이 첫 프레임보다 먼저 끝나는 빠른 로드에서는 `readSignals()`의 WebGL 프로브와 이어지는 three.js 초기화가 GPU 프로세스를 먼저 깨우고, 브라우저는 그 초기화가 끝날 때까지 첫 프레임을 커밋하지 못했다.

그래서 품질 판정(WebGL 프로브 포함)과 장면 생성을 `afterFirstPaint`(`src/lib/after-first-paint.ts`, 두 번 겹친 `requestAnimationFrame`) 뒤로 미룬다. 첫 프레임이 커밋된 다음에야 프로브가 돌고, `hero-quality-settled` 이벤트도 그때 발생한다. 토글(`QualityToggle`)은 이미 `rememberSettled`로 늦게 구독해도 마지막 값을 받으므로 동작이 바뀌지 않는다. 폴백 순서(감속 모션 → 저장된 선택 → WebGL 없음 → 소프트웨어 렌더러 → 저사양)는 그대로다. 측정 수치는 ADR-0011 개정문에 함께 적는다.

## Amendment 2026-09-07 (2)

위 개정의 원인 추정은 절반만 맞았다. 히어로 초기화를 첫 페인트 뒤로 미룬 뒤에도 새 Chrome을 띄워 재는 방식에서는 9회 중 3회가 여전히 느렸고, 트레이스에서 렌더러의 첫 `Paint`(185ms)와 브라우저의 첫 프레임 제시(2,245ms) 사이가 비어 있었다. Chrome 인스턴스를 미리 띄워 두고 재면 9회 모두 정상이었다(ADR-0011 개정). 즉 문제의 대부분은 헤드리스 Chrome의 GPU 프로세스 첫 실행이라는 측정 환경 요인이었다. 감속 모션으로 히어로를 끈 4회가 모두 빨랐던 것은 WebGL 컨텍스트 생성이 그 지연을 키운다는 방증이지만, 4회 표본으로 단정하기는 어렵다. `afterFirstPaint` 지연은 원리상 옳고(첫 프레임 제출 전에 GPU를 깨우지 않는다) 비용이 없으므로 그대로 둔다.
