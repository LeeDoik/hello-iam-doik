# Architecture Decision Records

ADR은 결정 하나를 날짜·번호와 함께 기록한 짧은 문서다. 수정하지 않고, 바뀌면 새 ADR이 이전 것을 supersede한다.
면접관은 이 폴더를 60초 안에 읽고 "왜 이렇게 했는지"를 본다. 나(작성자)에게는 학습 노트다.

- 생성: `pnpm adr "제목"` → `NNNN-slug.md`, `status: proposed`
- 채택되면 `status: accepted`로 바꾸는 것만 허용
- 사이트의 `/colophon/`이 이 폴더를 그대로 렌더한다 (`src/content.config.ts`의 `adrs` 컬렉션)

## 템플릿 (MADR 4.0 minimal + Try it + What I learned)

```markdown
---
title: "<제목>"
status: proposed
date: "YYYY-MM-DD"
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
