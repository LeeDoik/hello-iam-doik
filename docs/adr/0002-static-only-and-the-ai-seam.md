---
title: Static only and the AI seam
status: accepted
date: 2026-09-02
---

# Static only and the AI seam

## Context and Problem Statement

ADR-0001에서 Astro를 정적 출력으로 선택했지만, 나중에 AI 챗 같은 서버 상호작용이 필요해질 수 있다. 지금 서버 어댑터를 붙여두면 실수로 어디선가 서버 렌더링에 기대는 코드가 스며들 위험이 있다. 아직 필요하지 않은 기능을 미리 켜두지 않으면서도, 필요해졌을 때 어떻게 이어붙일지 미리 문서로 정해두고 싶었다.

## Considered Options

- 지금은 어댑터를 설치하지 않고 정적으로 유지, 필요할 때 절차대로 추가한다.
- 미리 Vercel 어댑터를 설치해 서버 기능을 상시 켜둔다.

## Decision Outcome

선택: 어댑터를 설치하지 않은 상태를 가드레일로 삼는다. 어댑터가 없으면 `prerender = false`를 쓰는 페이지가 빌드 시점에 즉시 실패하므로, 서버 의존 코드가 조용히 스며드는 것을 막아준다. 나중에 AI 챗을 붙일 때는 다음 5단계를 그대로 따른다.

1. `pnpm astro add vercel`로 `@astrojs/vercel`을 추가하고 `adapter: vercel()`을 설정한다. `output`은 계속 `static`으로 둔다.
2. `src/pages/api/chat.ts`를 만들고 `export const prerender = false`와 스트리밍 `POST` 핸들러를 둔다. 이 핸들러는 `getCollection('projects' | 'stories')`를 호출할 수 있으므로 `content/`가 그대로 지식 베이스 역할을 겸한다.
3. `astro:env` 스키마로 `ANTHROPIC_API_KEY`를 선언(server, secret)하고, Vercel에 값을 설정하고, `.env.example`에도 추가한다.
4. `src/islands/Chat.tsx` React 아일랜드를 만들고 `src/i18n/ui.ts`에 `chat.*` 키를 추가한다.
5. `/api/chat`을 모킹한 e2e 테스트, 요청/응답 Zod 검증 테스트, JS 예산 체크를 추가한다. 요청당 rate limit은 필수로 건다.

content/, 스키마, i18n, lib, layouts, components, 기존 페이지, 테스트, CI는 이 절차 동안 건드리지 않는다.

### Consequences

- 좋은 점: 어댑터 부재 자체가 "서버 코드를 쓰려면 의식적으로 이 5단계를 따라야 한다"는 강제 장치가 된다.
- 나쁜 점 / 감수한 것: AI 챗을 실제로 붙이는 순간 5단계를 다시 거쳐야 하므로 그만큼의 준비 작업이 뒤로 미뤄진다.
- 되돌리는 조건(deletion trigger): 실제로 AI 챗(또는 다른 서버 기능)을 붙이기로 결정하는 순간, 이 문서의 5단계 절차를 실행하면서 이 ADR을 supersede하는 새 ADR을 쓴다.

## Try it (5분 실험)

`src/pages/api/x.ts`에 `export const prerender = false`를 넣고 `pnpm build`를 실행하면 어댑터가 없어 실패하는 것을 확인한 뒤 파일을 삭제한다.

## What I learned

"아직 하지 않은 결정"도 문서화할 수 있고, 오히려 그래야 나중에 실수로 스며드는 걸 막는 가드레일이 된다. 정적 출력에서 어댑터의 부재는 단순한 미완성이 아니라 의도된 제약이며, 그 제약이 깨지는 순간(빌드 실패)이 바로 "이제 진짜로 결정할 시점"이라는 신호가 된다.
