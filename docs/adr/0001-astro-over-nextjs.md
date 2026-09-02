---
title: Astro over Next.js
status: accepted
date: "2026-09-02"
---

# Astro over Next.js

## Context and Problem Statement

이 사이트는 정적 콘텐츠(프로젝트, 스토리, ADR)가 중심이고, 나중에 위젯 두세 개(예: AI 챗)만 클라이언트 상호작용을 필요로 한다. 프레임워크를 지금 정해야 콘텐츠 스키마와 배포 파이프라인을 그 위에 쌓을 수 있다. Next.js는 이력서에서 더 눈에 띄는 키워드지만, 정적 위주 사이트에 필요한 부품 수가 다르다.

## Considered Options

- Astro 7 (정적 출력, 필요한 곳만 아일랜드)
- Next.js 16 (static export)

## Decision Outcome

선택: Astro. 정적 콘텐츠 사이트 + 위젯 두세 개에는 Astro가 부품 4개(콘텐츠 레이어, i18n 라이브러리, sharp 스크립트, 루트 리다이렉트)를 줄여준다. Next.js 16 static export로 같은 결과를 내려면 콘텐츠 레이어, i18n 라이브러리, sharp 이미지 스크립트, 루트 리다이렉트까지 직접 붙여야 하고, 이 넷 모두 정적 사이트에는 기본 내장되지 않는다. Astro는 콘텐츠 컬렉션과 i18n 라우팅을 기본 제공하고 기본적으로 클라이언트 JS를 보내지 않으므로 같은 결과를 더 적은 이동부로 얻는다. 이력서 키워드 손실은 React 아일랜드(예: 챗 위젯)와 이 ADR 문서 자체로 상쇄한다.

### Consequences

- 좋은 점: 부품 4개를 직접 조립하지 않아도 되고, 기본 빌드 결과물에 불필요한 JS가 없다.
- 나쁜 점 / 감수한 것: Next.js만큼의 채용 시장 키워드 인지도는 없다. React 아일랜드로 일부 보완해야 한다.
- 되돌리는 조건(deletion trigger): 사이트 절반 이상이 클라이언트 상태를 갖게 될 때.

## Try it (5분 실험)

`pnpm build && ls dist/_astro` — 아일랜드를 아직 추가하지 않은 현재 시점에는 JS 파일이 없어야 한다.

## What I learned

정적 사이트 프레임워크를 고를 때 진짜 비교 대상은 "이름값"이 아니라 "필요한 결과를 만들기 위해 직접 조립해야 하는 부품 수"다. Next.js의 static export는 가능하지만 기본값이 아니라서, 콘텐츠 레이어·i18n·이미지 최적화·리다이렉트 같은 것들을 개별로 채워 넣어야 한다. Astro는 정적 우선을 기본값으로 설계했기 때문에 같은 요구사항에서 조립 비용이 낮다.

## Amendment 2026-09-02: React 아일랜드 도입 이후의 Try it

프로젝트 필터 아일랜드(`src/islands/ProjectFilter.tsx`)를 `client:visible`로 붙인 뒤에는 `pnpm build && ls dist/_astro`에 JS 청크가 생긴다. 기대 결과: `ProjectFilter.*.js`(약 2KB), `client.*.js`(React 하이드레이션 런타임, 약 184KB), `react.*.js`(약 8KB) 세 파일뿐이며, 이것이 사이트의 클라이언트 JS 전부다. 다른 페이지(`dist/projects/**`, `dist/colophon/**`)의 HTML에는 `<script`가 없어야 한다(이력서 페이지의 인쇄 버튼 한 줄 제외). 아일랜드가 아닌 곳에 JS가 생기면 경계가 깨진 것이다. 이 JS를 왜 감수하는지(국내 JD의 React 요구, 향후 채팅 UI 재사용)는 별도 ADR로 기록할 예정이다.
