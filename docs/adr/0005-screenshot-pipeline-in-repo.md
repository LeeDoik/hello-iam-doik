---
title: "Screenshot pipeline lives in the repo"
status: "accepted"
date: "2026-09-03"
---

# Screenshot pipeline lives in the repo

## Context and Problem Statement

프로젝트 카드마다 스크린샷이 필요한데, 스크린샷은 찍는 순간부터 낡기 시작한다. 화면은 배포마다 바뀌고, 언제·어느 커밋·어느 화면 크기에서 찍었는지 기록해 두지 않으면 "이거 몇 달 전 화면 아닌가"라는 의심을 아무도 확인할 수 없다. 지금까지는 `docs/content-guide.md`에 "screens/에 PNG를 추가하라"는 문장만 있었고, 실제로 누가·언제·무엇으로 찍었는지는 사람의 기억에만 있었다. 이 기억은 리포에 남지 않는다.

## Considered Options

- 스크린샷을 수동으로 찍어 `screens/`에 넣고, `meta.yaml`의 `capturedAt`을 손으로 채운다(지금까지의 방식).
- 스크린샷 캡처를 CI에 내장해 매 배포마다 자동으로 갱신한다.
- 재현 가능한 캡처 스크립트(`pnpm capture`)를 레포에 두고, PNG 옆에 sidecar JSON(캡처 시각·URL·뷰포트·소스 커밋)을 남기며, 계약 테스트가 `meta.yaml`과 sidecar를 대조한다(선택).

## Decision Outcome

선택: 세 번째 옵션. `content/projects/<slug>/capture.yaml`에 캡처 대상(`base` 라이브 URL 또는 `local: { cwd, command, port }`로 로컬 실행, `shots[]`)을 선언하면 `pnpm capture <slug>`가 Playwright Chromium으로 데스크톱(1440×900 @2x)·모바일(iPhone 15, 393×852 @3x) 뷰포트에서 스크린샷을 찍고, PNG 옆에 `<name>@<device>.json` sidecar를 남긴다. sidecar에는 `capturedAt`, `sourceCommit`(로컬 실행일 때만), `url`, `viewport`, `playwright` 버전을 기록한다. `src/lib/content-contract.test.ts`가 `meta.yaml`의 `screens[].capturedAt`/`commit`을 sidecar와 대조해, 둘이 어긋나면 빌드 게이트에서 실패한다. sidecar가 없는 PNG(예: 브라우저로 직접 캡처한 화면)는 경고만 출력하고 통과시켜, 이 파이프라인이 유일한 캡처 경로가 되도록 강제하지는 않는다.

CI에 자동 캡처를 넣지 않은 이유는 스크린샷이 매 커밋 갱신될 필요가 없고(화면이 자주 바뀌지 않는다), 자동 캡처는 실패 모드(느린 페이지, 로그인 세션 만료)가 배포를 막을 위험이 있기 때문이다. 대신 `--stale <days>` 옵션으로 오래된 스크린샷을 사람이 직접 발견하고 재캡처하게 했다.

### Consequences

- 좋은 점: 누구나 `pnpm capture <slug>`로 같은 뷰포트·같은 설정으로 같은 화면을 다시 찍을 수 있다(재현 가능성). 스크린샷이 "언제 찍었는지"를 더 이상 기억이 아니라 sidecar 파일이 갖고, 계약 테스트가 그 사실을 `meta.yaml`과 계속 대조한다. `capture.yaml`의 `login.steps[].value`는 시드 데모 계정 값만 허용하고, `${ADMIN_PASSWORD}` 같은 환경변수 모양의 값은 스키마(`captureSchema`)가 파싱 단계에서 거부해, 실제 비밀번호가 레포에 커밋될 여지를 줄인다.
- 나쁜 점 / 감수한 것: `capture.yaml`과 sidecar JSON이 프로젝트마다 늘어나 파일 수가 증가한다. Playwright Chromium이 로컬에 설치돼 있어야 캡처를 실행할 수 있다(CI에는 없음 — 캡처는 사람이 로컬에서 수동으로 돌린다). sidecar 없는 PNG는 경고만 하므로, 규율을 지키지 않으면 조용히 낡은 스크린샷이 남을 수 있다.
- 되돌리는 조건(deletion trigger): 프로젝트 수가 많아져 매번 수동 재캡처가 감당 안 되면, `--stale` 리포트를 CI 알림(예: 주간 이슈 생성)으로 자동화하거나, 캡처 자체를 배포 파이프라인에 편입하는 방향으로 이 ADR을 supersede한다.

## Try it (5분 실험)

```bash
pnpm capture sample-project --stale 0
```

실제 결과: 오늘 막 찍은 스크린샷도 `--stale 0`(0일 이상 지난 것도 낡은 것으로 취급) 기준에서는 낡은 것으로 잡혀 파일명과 캡처 날짜가 출력되고 종료 코드 2로 끝난다. 반대로 `pnpm capture sample-project --stale 90`은 "no screenshots older than 90 days"를 출력하고 종료 코드 0으로 끝난다. 즉 stale 판정은 실제로 날짜 차이를 계산하고, 그 결과가 셸 종료 코드로 드러나 CI나 스크립트에서 조건 분기에 쓸 수 있다.

## What I learned

스크린샷처럼 "이미지 파일 하나"로 보이는 산출물도 그 자체로는 언제·어떤 상태에서 만들어졌는지를 말해주지 않는다는 걸 이번에 구체적으로 다뤘다. PNG 옆에 작은 JSON 하나(sidecar)를 두고, 그 JSON을 다른 진실의 원천(`meta.yaml`)과 계약 테스트로 대조하게 만들면, "이 스크린샷 최신인가?"라는 질문에 사람의 기억이 아니라 파일 diff가 답할 수 있게 된다. 또한 로그인이 필요한 캡처 시나리오에서 "데모 계정만 허용, 환경변수 모양은 거부"라는 스키마 레벨의 정규식 검사(`noEnvPlaceholder`)가, 실수로 실제 비밀번호나 시크릿을 YAML에 적어 넣는 것을 코드 리뷰 이전에 막아준다는 것도 배웠다.
