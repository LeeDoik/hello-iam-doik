---
title: Tooling — Biome, Prettier, TS 6
status: accepted
date: 2026-09-02
---

# Tooling — Biome, Prettier, TS 6

## Context and Problem Statement

린트·포맷·타입체크 도구를 하나씩 고르는 대신, 지금 가능한 조합으로 빠르게 정착시켜야 이후 작업이 흔들리지 않는다. Biome은 빠르고 ts/json/css를 잘 다루지만 이 시점에는 `.astro` 포맷을 안정적으로 지원하지 않는다. TypeScript는 최신 6 버전을 쓰고 싶지만 `@astrojs/check`가 아직 이를 peer로 공식 허용하는지가 변수다.

## Considered Options

- Biome 단독(ts/json/css) + `.astro`는 Prettier로 보완, TypeScript 6 고정
- Biome이 `.astro`까지 지원할 때까지 Prettier 전체를 유지
- TypeScript를 5.x로 낮춰 `@astrojs/check`와의 마찰을 피한다

## Decision Outcome

선택: Biome(ts/json/css) + Prettier(.astro) 조합, TypeScript는 6으로 고정한다. Biome은 대부분의 파일에서 더 빠르고 설정이 단순하지만 `.astro` 포맷은 아직 stable이 아니라서 그 영역만 Prettier(+ prettier-plugin-astro)에 맡긴다. TypeScript 6은 최신 언어 기능과 strictest 설정을 그대로 쓰기 위해 고정한다.

### Consequences

- 좋은 점: 대부분의 파일은 Biome의 속도와 단일 설정 이점을 그대로 받는다.
- 나쁜 점 / 감수한 것: 포맷 도구가 두 개로 나뉘어 `pnpm lint`/`pnpm format`이 두 도구를 순차 실행해야 한다.
- 되돌리는 조건(deletion trigger): Biome의 `.astro` 포맷이 stable이 되면 Prettier를 제거하고, `@astrojs/check`가 TypeScript 7을 peer로 허용하면 TS 7로 올린다.

## Try it (5분 실험)

`.astro` 파일 하나의 들여쓰기를 일부러 망가뜨리고 `pnpm lint`를 실행하면 Prettier가 그 파일을 실패로 잡아낸다.

## What I learned

도구 선택은 "최고의 도구 하나"를 찾는 문제가 아니라 "지금 이 조합에서 각 도구가 커버하지 못하는 틈이 어디인지"를 파악하는 문제다. Biome처럼 빠르게 성장하는 도구는 지원 범위가 시점마다 다르므로, 되돌리는 조건을 명시해두면 나중에 재평가할 신호를 놓치지 않는다.
