---
title: CI is the gate, one local hook
status: accepted
date: 2026-09-02
---

# CI is the gate, one local hook

## Context and Problem Statement

로컬 git 훅을 여러 개 걸어두면(포맷, 린트, 테스트) 커밋마다 안전해 보이지만, 그 규칙들이 CI 설정과 별도로 관리되는 두 번째 복사본이 되어 시간이 지나면 서로 어긋난다(drift). Windows에서는 훅 실행 자체가 느리거나 성가신 경우도 많다. 어디까지를 로컬에서 막고 어디부터를 CI에 맡길지 정해야 한다.

## Considered Options

- 로컬 훅에 포맷·린트·테스트까지 전부 건다.
- 로컬 훅은 commit-msg(commitlint) 하나만 두고, 포맷·테스트·린트는 CI가 막는다.
- 로컬 훅을 아예 두지 않는다.

## Decision Outcome

선택: 로컬 훅은 commit-msg(commitlint) 하나만 둔다. 포맷·테스트는 CI가 막는다. 훅을 여러 개 걸면 그 규칙들이 CI 설정과 별개로 유지·관리되는 두 번째 복사본이 되어 드리프트하고, Windows 환경에서는 매 커밋마다 성가시다. 다만 커밋 메시지만은 예외로 로컬에서 막는데, 한번 히스토리에 박히면 되돌리기 번거롭고 CI가 잡아낼 때는 이미 늦기 때문이다.

### Consequences

- 좋은 점: 로컬 커밋이 빠르고, 규칙을 CI 한 곳에서만 관리하면 되므로 드리프트가 없다.
- 나쁜 점 / 감수한 것: 포맷이 깨지거나 테스트가 실패한 커밋이 로컬에는 만들어질 수 있고, 그 사실을 CI를 봐야 알 수 있다.
- 되돌리는 조건(deletion trigger): CI 실패로 인한 되돌림(revert)이 반복되어 로컬에서 더 일찍 잡는 편이 낫다고 판단될 때, pre-commit에 포맷/테스트를 추가한다.

## Try it (5분 실험)

`git commit -m "bad"` — Conventional Commits 형식이 아니므로 commit-msg 훅이 거부하는 것을 확인한다.

## What I learned

훅과 CI는 같은 규칙을 검사하더라도 역할이 다르다. 로컬 훅은 "되돌리기 비싼 것"(커밋 메시지처럼 히스토리에 박히는 것)만 막는 게 낫고, 되돌리기 싼 것(포맷, 테스트 실패)은 CI 하나에만 규칙을 두는 편이 유지보수 비용을 줄인다.
