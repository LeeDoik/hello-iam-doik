# 포트폴리오 사이트 3차 구현 계획: 실제 콘텐츠

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 스펙 §13의 6단계. 샘플 프로젝트를 실제 프로젝트 3개(태엽새 / PIXELARIOUS / Aetheria Online)의 케이스 스터디로 교체하고, 스킬·프로필·경력의 자리를 실제 구조로 채우며, 스크린샷을 캡처 스크립트로 만든다. 모든 주장은 근거(문서·커밋·로그)가 있는 것만 쓴다.

**Architecture:** 코드 변경은 최소다. `content/`만 바꾸는 것이 원칙이고, 예외는 (1) `links.repo`를 선택 필드로 바꾸는 스키마 변경(비공개 레포 대응)과 그에 따른 `ProjectLinks.astro`·UI 키 한 개, (2) 샘플 슬러그를 참조하는 테스트·설정(e2e, js-budget, lighthouserc, README)의 슬러그 교체다. 글은 `docs/superpowers/plans/`가 아니라 세션 스크래치패드의 사실 시트를 원천으로 하되, 이 계획 안에 필요한 사실을 전부 옮겨 적어 구현자가 다른 파일 없이 쓸 수 있게 했다.

**Tech Stack:** 변경 없음. 콘텐츠는 YAML + Markdown, 스크린샷은 `pnpm capture`.

**현재 상태 (main `efa69a7` 기준):** 2차 계획 완료. `content/projects/sample-project/`가 유일한 프로젝트. `content/skills.yaml`(astro, react), `content/experience.yaml`(예시 1건), `content/profile.yaml`(실명·이메일·GitHub는 실제값, bio는 임시). 스키마 `src/content/schemas.ts`: `projectSchema` 필드 title, summary, status, period, role{teamSize, owned}, stack(skills id), links{repo(필수 url), live?, demoVideo?, demoCredentials?, keyCommits[]{label, url, why}}, metrics(≤4){label, before?, after, unit?, method, evidence?}, screens(≥1){src, alt, device, capturedAt, commit?}, ai?{models, architecture?, promptFile?, evals[], rejectedTradeoff?, costPerRequest?, latencyP50?, failureModes[]}, featured, order, updatedAt. `localized`는 strictObject. `capture.yaml` 스키마 `src/content/capture-schema.ts`(base|local, login?, shots[]{name NN-kebab, route, devices, waitFor?}). 계약 테스트 `src/lib/content-contract.test.ts`(ko.md 4개 H2 필수, en.md 있으면 4개 H2, 스크린샷 ≤1.5MB, sidecar 일치, 스킬↔프로젝트 상호 참조). e2e `tests/e2e/smoke.spec.ts`가 `/projects/sample-project/`와 제목 "샘플 프로젝트"/"Sample Project"를 참조, `tests/build/js-budget.test.ts`와 `lighthouserc.json`이 `projects/sample-project` 경로를 참조, `README.md`가 `content/projects/sample-project/screens/01-home@desktop.png`를 히어로 이미지로 참조.

## Global Constraints

- 콘텐츠의 모든 숫자·날짜·이름은 이 문서의 "사실" 표에 있는 것만 쓴다. 출처가 없는 수치는 쓰지 않는다. 추정치는 "약", 목표치는 "목표"라고 표기한다.
- 비밀 값 금지: API 키, DB 비밀번호, 사설 IP를 어떤 파일에도 적지 않는다. `포트폴리오 참고 자료/`는 읽어도 되지만 그 안의 `.env`, `.env.local`, `db.ini`는 열지 않는다.
- `{ko,en}` 문자열은 둘 다 채운다(스키마가 강제). 날짜와 쉼표가 있는 문자열은 따옴표.
- 프로젝트 순서: 태엽새(order 1, featured) → PIXELARIOUS(order 2, featured) → Aetheria Online(order 3, featured). WP_GUNMAYHEM은 Aetheria 본문에 한 문장으로만.
- PIXELARIOUS 레포는 비공개 유지. `links.repo` 생략, `links.live`만. keyCommits 없음(비공개 커밋 링크는 lychee가 404로 잡는다).
- 커밋 URL은 `https://github.com/<owner>/<repo>/commit/<full or 7+ sha>` 형식, 실제 존재해야 한다(lychee가 검사). 이 문서의 sha는 조사 시점 값이며 구현자가 `gh api`로 존재를 확인한다.
- 스크린샷 파일명 `NN-<what>@<device>.png`, ≤1.5MB, sidecar 필수(스크립트 캡처), Claude 브라우저 캡처는 sidecar 없이 허용(계약 테스트가 경고만).
- 프로필·경력의 실제 사실은 사용자가 나중에 직접 채운다. 구현자는 구조와 자리표시 문구만 만들고, 자리표시는 눈에 띄게 `[채워 주세요: …]` 형식으로 쓴다(빌드는 통과해야 한다).
- Conventional Commits, `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. 브랜치 `content/real-projects`. Windows Git Bash. 게이트: `pnpm format && pnpm lint && pnpm test && pnpm check && pnpm build && pnpm test:build && pnpm e2e`.

---

## 사실 (구현자가 쓸 유일한 원천)

### A. 코드네임: 태엽새 · HEART OF STEEL (slug `heart-of-steel`)

| 항목 | 값 | 출처 |
|---|---|---|
| 제목 | ko `코드네임: 태엽새 · HEART OF STEEL` / en `Heart of Steel (Codename: Clockbird)` | README |
| 요약 | ko `대화만으로 동료를 찾고 신분을 위조해 탈출하는 AI 잠입 게임. 네 구간의 클리어 조건을 스크립트가 아니라 LLM이 판정한다.` / en `An AI infiltration game where you find allies and forge an identity through free-text dialogue; every stage's win condition is judged live by an LLM.` | README, AI활용기술문서 |
| 기간 | from `2026-07-17` to `2026-08-12` | 첫/마지막 커밋(gh api) |
| 상태 | `live` | Railway 상시 배포 |
| 팀 | teamSize 2. owned ko `클라이언트·서버 전량(Phaser 3, Vite, Express 5), 스테이지 4구간 콘텐츠 구현, LLM 호출 7종과 심문 이중 판정의 정보 격리, 프롬프트 스튜디오, LLM 스모크·정적 검사 파이프라인` / en `All client and server code (Phaser 3, Vite, Express 5), all four stages, the seven LLM call sites incl. the information-isolated dual interrogation judge, the prompt studio, and the LLM smoke + static check pipeline` | 팀원 롤 기술서 |
| 스택 id | `phaser`, `vite`, `express`, `anthropic-sdk`, `zod`, `node` | package.json |
| 링크 | repo `https://github.com/LeeDoik/codename-clockbird`, live `https://web-production-6923e.up.railway.app`, demoVideo `https://youtu.be/HMJo2wnLqyc` | README |
| keyCommits | `08723ff` 동료 NPC 자유 대화(첫 스트리밍 대화 루프) — why: 게임의 핵심 상호작용이 처음 동작한 지점; `f1b79dd` 정답 코드를 서버에만 남기는 비유출 원칙 — why: 이후 모든 판정이 따르는 정보 격리의 기준선; `507228f` 심문 이중 판정(시스템은 알고 로봇은 모른다) — why: 핵심 설계 원칙이 코드가 된 지점; `8d75fd9` 부채꼴 시야 순찰 로봇과 발각 게이지 — why: 스테이지 3 잠입 메커닉의 뼈대 | 팀원 롤 기술서 + gh api |
| 지표 1 | label ko `연상 단어 중복률` en `Clue-word overlap`, before `83–100%`, after `42–50%`, method ko `npm run exp:diff 스크립트로 프롬프트 변경 전후 실측(기준 60% 이하)` en `Measured before/after prompt changes with the npm run exp:diff script (target ≤60%)`, evidence `https://github.com/LeeDoik/codename-clockbird#readme` | README 개발노트, AI문서 §4 |
| 지표 2 | label ko `5인 연상 단어 생성 지연` en `Clue generation latency (5 allies)`, before `33초`, after `17초`, unit 없음(값에 포함), method ko `Sonnet thinking 비활성화 전후 서버 로그 실측` en `Server-log timing before/after disabling Sonnet thinking` | AI문서 §1 |
| 지표 3 | label ko `커밋` en `Commits`, after `232`, method ko `GitHub 커밋 수(26일)` en `GitHub commit count over 26 days`, evidence `https://github.com/LeeDoik/codename-clockbird/commits/master` | gh api |
| AI | models `["claude-sonnet-5", "claude-haiku-4-5"]`; promptFile `https://github.com/LeeDoik/codename-clockbird/tree/master/src/data/prompts`; evals: `{ name: "clue-overlap", metric: "duplicate rate", n: 5, baseline: "83–100%", final: "42–50%", judge: "exact" }`, `{ name: "interrogation-judge", metric: "pass/fail per question", n: 8, baseline: "n/a", final: "dual judge (system knows identity, robot does not)", judge: "llm-judge" }`; rejectedTradeoff option ko `출력 필터로 정답 단어 유출 차단` en `Block code-word leaks with an output filter`, reasonWithNumbers ko `스트리밍에서는 필터가 잡은 시점에 이미 화면에 찍힌다. 대신 모델에 정답을 아예 주지 않는 정보 격리로 바꿨고, 7개 호출 지점 전부에 적용했다.` en `With streaming, the filter fires after the text is already on screen. We switched to information isolation (the model never receives the secret) across all 7 call sites.`; latencyP50 `약 17초 (5인 병렬 생성, 동시성 3)`; failureModes ko/en: (1) 힌트를 "더 직접적으로" 만들라는 프롬프트 한 줄이 중복률을 83~100%로 올려 퍼즐이 무너짐 / (2) 저택 판정 프롬프트에 호감도 숫자를 넣자 모델이 그 숫자를 대사에 그대로 말함 → 말로 치환 / (3) `?stage2&key` 클라이언트 플래그가 서버 세션과 어긋나 열쇠 상태 불일치 → 상태 변경은 서버 요청에 실어 보내는 규칙 / (4) 5개 동시 호출 시 529 Overloaded → 동시성 3 제한 + maxRetries 5 + 폴백 텍스트 | AI문서 §1·§3·§4, 개선로드맵 |
| 스크린샷 | capture.yaml base `https://web-production-6923e.up.railway.app`, shots: `01-title` route `/` desktop+mobile; `02-play` route `/?nointro` desktop (`waitFor` 없이 networkidle). 추가로 `docs/banner.png`(타이틀 배너)와 `docs/제출물/아키텍처.png`(AI 파이프라인 구조도)를 `screens/`에 복사: `03-banner@desktop.png`, `architecture.png`(ai.architecture용). 각 ≤1.5MB 확인 | 폴더 |
| 주의 | 라이선스 없음. "심사 기간 중 재배포 금지" 문구는 지난 일. 모델 id 표기는 팀 문서 그대로 | 조사 |

이야기(ko.md 골자, 각 H2에 3~5문단, 영어는 같은 구조로 번역):
- **문제**: "AI를 빼면 게임이 안 되는" 설계를 목표로 함. 5인 연상 단어를 한 번에 생성하면 서로 의식해 중복(체포 메커닉)이 사라짐. 스트리밍에서는 출력 필터가 유출을 못 막음. 초기엔 패배 조건이 없어 "질 수 없는 게임".
- **접근**: 1인당 독립 호출 + 동시성 3 + thinking 비활성화. 정보 격리(대화 모델은 코드를 모름, 로봇 판정기는 신분을 모름, 저택 판정엔 숫자를 안 줌). 대화는 Haiku, 룰 판정은 Sonnet. 프롬프트 10종을 파일로 분리하고 기획자용 프롬프트 스튜디오 제작. Railway 선택 이유(인메모리 세션, LFS 파일 570~600개, 콜드스타트).
- **결과**: 링크 한 번으로 플레이 가능한 상시 배포. 26일 232커밋, 4구간 완주 가능. 중복률 83~100% → 42~50% 복원을 스크립트로 문서화.
- **배운 점**: 가드레일은 출력 필터가 아니라 정보 설계. 프롬프트 한 줄이 밸런스를 무너뜨린다. 서버 상태를 바꾸는 플래그는 요청에 실어 보낸다. 결정론적 정적 검사 4종 + LLM 스모크 5종으로 확률적 시스템의 회귀를 잡는다.

### B. PIXELARIOUS (slug `pixelarious`)

| 항목 | 값 | 출처 |
|---|---|---|
| 제목 | ko `PIXELARIOUS` / en `PIXELARIOUS` | README |
| 요약 | ko `직접 만든 Godot 게임을 브라우저에서 바로 플레이하는 1인 픽셀 아케이드. 게임 추가는 JSON 레코드 하나이고, 내장 편집기에서 커밋·푸시·배포까지 한 번에 끝난다.` / en `A one-person pixel arcade for my own Godot games. Adding a game is one JSON record, and the built-in editor commits, pushes and deploys in one click.` | README |
| 기간 | from `2026-08-13` to 없음(진행 중) | 첫 커밋 gh api |
| 상태 | `live` | Vercel |
| 팀 | teamSize 1. owned ko `기획·개발·아트 파이프라인·배포 전부` / en `Everything: design, code, art pipeline, deployment` | contributors |
| 스택 id | `nextjs`, `react`, `typescript`, `vitest`, `godot`, `vercel` | package.json |
| 링크 | live `https://neo-kido.vercel.app`. repo 없음(비공개). keyCommits 없음 | 결정 |
| 지표 1 | label ko `최근 30일 방문자` en `Visitors, last 30 days`, after `67`, unit `명`(en은 unit 생략 가능하나 스키마상 문자열 하나이므로 `visitors`로 쓰지 말고 label에 담고 unit은 비움), method ko `Vercel Analytics, 2026-08-03~09-01` en `Vercel Analytics, 2026-08-03 to 09-01` | 스크린샷 |
| 지표 2 | label ko `페이지뷰` en `Page views`, after `190`, method 동일 | 스크린샷 |
| 지표 3 | label ko `커밋` en `Commits`, after `275`, method ko `GitHub 커밋 수(3주, 비공개 레포)` en `GitHub commit count over 3 weeks (private repo)` | gh api |
| 지표 4 | label ko `공개 게임` en `Playable games`, after `2`, method ko `content/games/*.json 중 공개 상태` en `Public entries in content/games` | 폴더 |
| AI | 없음(런타임 LLM 없음). 본문에서 "개발 과정에서 Claude Code를 썼다"는 한 줄만 | 조사 |
| 스크린샷 | capture.yaml base `https://neo-kido.vercel.app`, shots: `01-home` `/` desktop+mobile; `02-starfall` `/play/starfall-drift` desktop; `03-last-login` `/play/last-login` desktop. 편집기(`/editor`)는 개발 서버 전용이라 캡처하지 않고 본문에서 설명만 | README |
| 주의 | 배포 도메인은 옛 이름 neo-kido. 본문에 "현재 도메인은 이전 이름을 유지" 한 줄 | 조사 |

이야기 골자:
- **문제**: 게임을 만들 때마다 빌드 반입→메타데이터→커밋→배포가 반복 작업. 디자인 툴로 만든 브랜드 자산의 색이 사이트와 어긋남.
- **접근**: "게임 = 데이터 레코드"(`public/games/<slug>/` + `content/games/<n>-<slug>.json`, 테스트가 슬러그 중복·파일 존재 검증). `/editor`에 실제 컴포넌트 프리뷰 + 저장 시 `content/`만 스테이징해 커밋·푸시(두 번 눌러야 나가는 2단계 확인). 브랜드 렌더러 `/brand`의 로직을 DOM 비의존으로 만들어 단위 테스트. 크롬 사이드패널 확장으로 게임 재배포. NIGHT/DMG 두 팔레트.
- **결과**: 3주 275커밋. 게임 3종 반입, 공개 2종. 최근 30일 방문자 67명, threads·디시인사이드 유입.
- **배운 점**: 반복 작업을 데이터 등록으로 바꾸면 다음엔 그 데이터를 다루는 도구가 제품이 된다. 팔레트·폰트를 코드에서 공유하면 불일치가 원천 차단된다. 이 포트폴리오 사이트의 콘텐츠 모델은 여기서 배운 것을 이어받았다.

### C. Aetheria Online (slug `aetheria-online`)

| 항목 | 값 | 출처 |
|---|---|---|
| 제목 | ko `Aetheria Online — IOCP MMORPG 서버` / en `Aetheria Online — an IOCP MMORPG server` | README_제출 |
| 요약 | ko `IOCP 비동기 서버에 NPC AI(Lua), A* 길찾기, 타이머, MSSQL 영속화를 통합한 미니 MMORPG. 단일 머신에서 설계 상한 10,000 동접을 채우고 이동 왕복 지연 약 20ms를 기록했다.` / en `A from-scratch IOCP MMORPG server with Lua NPC AI, A* pathfinding, timers and MSSQL persistence. On one machine it filled the 10,000-connection design cap at ~20 ms move round-trip.` | 보고서 §12 |
| 기간 | from `2026-05-06` to `2026-06-14` | gh api |
| 상태 | `archived` | 조사 |
| 팀 | teamSize 1. owned ko `서버·클라이언트·DB·부하테스트 도구 전부` / en `Server, client, DB layer and the load-test tool` | contributors |
| 스택 id | `cpp`, `iocp`, `tbb`, `lua`, `mssql`, `sfml` | 보고서 §2 |
| 링크 | repo `https://github.com/LeeDoik/2026GameServerTermproject`. live 없음. demoCredentials 없음 | |
| keyCommits | `4caa94c` g_clients 동시 순회 race 제거(이름 인덱스) — why: 멀티스레드 서버의 전형적 레이스를 찾아 고친 지점; `9622f23` 세션별 송신 코얼레싱 — why: 3,000 CCU 벽을 넘긴 첫 최적화; `706c6d2` TCP_NODELAY + 부하클라 진단 throttle — why: 원거리 링크 지연 제거, 실측 기반; `0444597` MySQL→MSSQL(ODBC) 마이그레이션 — why: DB 계층 추상화(IDbBackend)로 JSON 폴백까지 확보 | 커밋 로그 |
| 지표 1 | label ko `동시 접속` en `Concurrent connections`, before `약 3,000 (초기 한계)`, after `10,000`, unit `CCU`, method ko `자체 STRESS_TEST 클라이언트로 localhost에서 상한(MAX_PLAYERS)까지 접속, [Reject] Server Full 로그로 도달 확인` en `In-house STRESS_TEST client on localhost up to MAX_PLAYERS; the [Reject] Server Full log proves the cap was reached`, evidence `https://github.com/LeeDoik/2026GameServerTermproject` | 보고서 §12.3, 발표자료 |
| 지표 2 | label ko `이동 왕복 지연` en `Move round-trip latency`, after `약 20`, unit `ms`, method ko `10,000 CCU 상태에서 서버 로그의 이동 왕복 delay(localhost, 서버와 부하 클라가 같은 PC)` en `Server-logged move round-trip at 10,000 CCU (localhost; server and load client on one PC)` | 보고서 §12.3·§12.5 |
| 지표 3 | label ko `NPC 수` en `NPCs`, after `200,000`, method ko `4 바이옴 × 4 종족 × 12,500 + 보스 4, Lazy AI로 활성 AI는 동접에 비례` en `4 biomes × 4 species × 12,500 + 4 bosses; lazy AI keeps active AIs proportional to players` | 보고서 §11 |
| AI | 없음 | |
| 스크린샷 | 라이브 없음, 실행 파일은 Windows 전용. 1차로는 `screens/architecture.svg`를 구현자가 직접 그린다(IOCP 워커 ← 소켓/타이머/DB 완료 → 섹터 시야 → Lua AI, 텍스트 박스 6~8개, 1440×900, 폰트 system-ui). meta.yaml의 screens[0]은 이 SVG(device desktop, alt ko `서버 구조도: IOCP 워커가 소켓·타이머·DB 완료를 한 큐에서 소비한다` / en `Server architecture: one IOCP queue feeds socket, timer and DB completions to the workers`). 실제 클라이언트 화면은 사용자가 로컬 실행 후 `pnpm capture aetheria-online`으로 추가하도록 `capture.yaml`을 `local` 형태의 주석 예시로만 남긴다(빌드 대상은 아님 → 파일명 `capture.example.yaml`) | 결정 |
| 주의 | 보고서의 수치는 localhost 측정이라는 한계를 본문에 명시. WP_GUNMAYHEM(Winsock2 스레드-퍼-커넥션 3인 슈팅, 2025년 팀 과제)은 "접근" 첫 문단에 성장 서사로 한 문장 | 보고서 §12.5 |

이야기 골자:
- **문제**: 텀 프로젝트 채점 기준 5,000 CCU. 초기 구현은 약 3,000 CCU에서 한계(직렬화 병목). MySQL→MSSQL 전환 중 0행 DELETE의 SQL_NO_DATA를 실패로 오인해 첫 저장이 깨짐. g_clients 동시 순회 레이스.
- **접근**: (WP_GUNMAYHEM에서 스레드-퍼-커넥션으로 배운 한계 → IOCP 한 큐로 소켓·타이머·DB 완료를 통합.) 섹터 기반 시야(인접 9섹터), Lazy AI(활성 AI = 동접 비례, 빈 맵 19만 NPC는 CPU 0), 워커별 Lua VM, 8분할 타이머 힙, 세션별 송신 코얼레싱, TCP_NODELAY, IDbBackend 추상화로 MSSQL/JSON 폴백.
- **결과**: 단일 머신에서 10,000 CCU(설계 상한) 도달, 이동 왕복 약 20ms, 목표 5,000의 2배. 프로파일러로 병목이 CPU가 아니라 네트워크 I/O임을 확인(worker_thread 총 CPU 96.6% 중 self 0.6%).
- **배운 점**: 공유 상태의 동시 순회 자체가 레이스의 근원. 드라이버 반환 코드를 곧이곧대로 실패로 보면 정상 케이스를 놓친다. 성능은 도구를 만들어 측정하며 올린다. localhost 측정의 한계를 안다.

### D. 스킬 (content/skills.yaml 전체 교체)

id / name / group / builtWithIt(ko·en) / projects / since:
- `phaser` Phaser 3 frontend — ko `태엽새의 스테이지 4구간과 대화 UI를 만들었습니다` en `Built all four stages and the dialogue UI of Heart of Steel` — [heart-of-steel] — 2026
- `vite` Vite frontend — ko `게임 클라이언트 번들과 개발 서버를 구성했습니다` en `Bundled the game client and set up the dev server` — [heart-of-steel] — 2026
- `nextjs` Next.js frontend — ko `PIXELARIOUS 사이트와 내장 편집기를 만들었습니다` en `Built the PIXELARIOUS site and its built-in editor` — [pixelarious] — 2026
- `react` React frontend — ko `PIXELARIOUS UI와 이 포트폴리오의 아일랜드를 만들었습니다` en `Built the PIXELARIOUS UI and this portfolio's islands` — [pixelarious] — 2025
- `typescript` TypeScript frontend — ko `PIXELARIOUS와 이 사이트를 타입 검사가 게이트인 구조로 썼습니다` en `Wrote PIXELARIOUS and this site with type checking as a gate` — [pixelarious] — 2025
- `astro` Astro frontend — ko `이 포트폴리오 사이트를 정적으로 만들었습니다` en `Built this portfolio as a static site` — [pixelarious] — 2026 (※ 이 사이트 자체는 프로젝트 항목이 없으므로 참조는 pixelarious로 두고 문장으로 설명. 스키마상 projects ≥1)
- `anthropic-sdk` Anthropic SDK ai — ko `태엽새의 LLM 호출 7종을 structured outputs로 구현했습니다` en `Implemented the seven LLM call sites of Heart of Steel with structured outputs` — [heart-of-steel] — 2026
- `prompt-design` 프롬프트 설계 ai — ko `프롬프트 10종을 파일로 분리하고 중복률을 실측하며 튜닝했습니다` en `Separated ten prompts into files and tuned them against measured overlap rates` — [heart-of-steel] — 2026
- `llm-eval` LLM 평가 ai — ko `결정론적 정적 검사와 LLM 스모크로 확률적 시스템의 회귀를 잡았습니다` en `Caught regressions in a probabilistic system with deterministic static checks plus LLM smoke tests` — [heart-of-steel] — 2026
- `express` Express backend — ko `API 키를 서버에만 두는 게임 서버를 만들었습니다` en `Built the game server that keeps the API key server-side` — [heart-of-steel] — 2026
- `node` Node.js backend — ko `태엽새 서버와 이 사이트의 스크립트를 썼습니다` en `Wrote the Heart of Steel server and this site's scripts` — [heart-of-steel] — 2025
- `zod` Zod backend — ko `LLM 출력과 콘텐츠를 스키마로 검증했습니다` en `Validated LLM output and content with schemas` — [heart-of-steel, pixelarious] — 2026
- `cpp` C++ backend — ko `IOCP MMORPG 서버와 클라이언트를 만들었습니다` en `Built the IOCP MMORPG server and client` — [aetheria-online] — 2025
- `iocp` IOCP backend — ko `소켓·타이머·DB 완료를 한 큐에서 소비하는 서버를 만들었습니다` en `Built a server that consumes socket, timer and DB completions from one queue` — [aetheria-online] — 2026
- `tbb` Intel TBB backend — ko `concurrent_hash_map으로 락 경합을 줄였습니다` en `Reduced lock contention with concurrent_hash_map` — [aetheria-online] — 2026
- `lua` Lua backend — ko `NPC AI를 워커별 VM의 스크립트로 옮겼습니다` en `Moved NPC AI into per-worker Lua VMs` — [aetheria-online] — 2026
- `mssql` MS SQL Server backend — ko `ODBC로 플레이어 영속화를 붙이고 JSON 폴백을 두었습니다` en `Added player persistence over ODBC with a JSON fallback` — [aetheria-online] — 2026
- `sfml` SFML backend — ko `2D 클라이언트 렌더링과 오디오를 구현했습니다` en `Implemented the 2D client rendering and audio` — [aetheria-online] — 2026
- `godot` Godot tooling — ko `아케이드용 2D 게임 3종을 웹으로 익스포트했습니다` en `Exported three 2D games to the web for the arcade` — [pixelarious] — 2026
- `vitest` Vitest tooling — ko `콘텐츠 레지스트리와 브랜드 렌더러를 단위 테스트했습니다` en `Unit-tested the content registry and the brand renderer` — [pixelarious] — 2026
- `vercel` Vercel tooling — ko `PIXELARIOUS와 이 사이트를 배포하고 애널리틱스를 붙였습니다` en `Deployed PIXELARIOUS and this site, with analytics` — [pixelarious] — 2026
- `claude-code` Claude Code tooling — ko `세 프로젝트 모두 AI 보조로 개발하고 검토·테스트로 검증했습니다` en `Built all three projects with AI assistance, verified by review and tests` — [heart-of-steel, pixelarious, aetheria-online] — 2025

### E. 프로필·경력 (자리표시)

`content/profile.yaml`: name/email/github는 그대로. tagline ko `웹과 AI를 잇는 개발자` en `Developer bridging web and AI` 유지. bio ko `게임 클라이언트·서버에서 시작해 LLM을 게임 룰의 핵심으로 쓰는 웹 서비스까지 만들었습니다. AI 도구로 빠르게 만들고, 왜 그렇게 했는지를 ADR과 테스트로 남깁니다.` en `From game clients and servers to web products where an LLM is the core rule engine. I build fast with AI tools and leave the "why" in ADRs and tests.` location 유지. linkedin은 없으면 생략.

`content/experience.yaml`: 항목 3개의 자리표시. `id: education-1` kind education org `{ ko: "[채워 주세요: 학교·전공]", en: "[Fill in: school, major]" }` role `{ ko: "[채워 주세요: 학위/졸업예정]", en: "[Fill in: degree/expected]" }` from `"2022-03-01"` bullets 1개 `[채워 주세요]`; `id: hackathon-nhn-2026` kind work org `{ ko: "NAN 2026 · NHN GAME × AI 해커톤", en: "NAN 2026 · NHN GAME × AI Hackathon" }` role `{ ko: "출품 (2인 팀, 개발 담당)", en: "Entrant (team of 2, developer)" }` from `"2026-07-15"` to `"2026-08-12"` bullets: ko `대화만으로 진행되는 AI 잠입 게임을 26일간 개발해 상시 배포로 제출` / en `Built and shipped a dialogue-driven AI infiltration game in 26 days`, 두 번째 bullet ko `[채워 주세요: 수상 결과]` en `[Fill in: result]`; `id: course-game-server` kind education org `{ ko: "[채워 주세요: 게임 서버 프로그래밍 과목·학교]", en: "[Fill in: game server programming course]" }` role `{ ko: "텀 프로젝트 Aetheria Online", en: "Term project Aetheria Online" }` from `"2026-05-06"` to `"2026-06-14"` bullets ko `IOCP MMORPG 서버로 10,000 동접 도달` en `Reached 10,000 CCU with an IOCP MMORPG server`. `docs/content-guide.md`에 "자리표시 목록: `grep -rn '채워 주세요' content/`" 한 줄 추가.

---

## File Structure

```
content/projects/heart-of-steel/{meta.yaml, ko.md, en.md, capture.yaml, screens/01-title@desktop.png, 01-title@mobile.png, 02-play@desktop.png, 03-banner@desktop.png, architecture.png, *.json sidecars}
content/projects/pixelarious/{meta.yaml, ko.md, en.md, capture.yaml, screens/01-home@desktop.png, 01-home@mobile.png, 02-starfall@desktop.png, 03-last-login@desktop.png, *.json}
content/projects/aetheria-online/{meta.yaml, ko.md, en.md, capture.example.yaml, screens/architecture.svg}
content/skills.yaml  content/experience.yaml  content/profile.yaml   (교체)
content/projects/sample-project/                                     (삭제)
src/content/schemas.ts  src/components/ProjectLinks.astro  src/i18n/ui.ts   (repo 선택화)
src/lib/schemas.test.ts  src/lib/content-contract.test.ts              (repo 선택 테스트, capture.example.yaml 무시)
tests/e2e/smoke.spec.ts  tests/build/js-budget.test.ts  lighthouserc.json  README.md  docs/content-guide.md  (슬러그 교체)
```

---

### Task 1: 스키마 — `links.repo` 선택화와 비공개 레포 표기

**Files:**
- Modify: `src/content/schemas.ts`, `src/lib/schemas.test.ts`, `src/components/ProjectLinks.astro`, `src/i18n/ui.ts`, `src/pages/llms.txt.ts`

**Interfaces:**
- `projectSchema.links.repo`: `url.optional()`. 그 외 동일.
- ui 키 `project.repoPrivate` ko `저장소 비공개 (라이브만 공개)` / en `Source is private (live site only)` — `project.repo` 뒤에 추가.
- `ProjectLinks.astro`: `links.repo`가 있으면 기존 링크, 없으면 `<li>{t(locale,"project.repoPrivate")}</li>`.
- `src/pages/llms.txt.ts`의 `repo: p.data.links.repo`는 `repo: p.data.links.repo ?? p.data.links.live ?? ""`로, `src/lib/llms.ts`의 출력은 `repo`가 빈 문자열이면 `(repo: …)` 괄호를 생략(`llms.test.ts`에 케이스 추가).

- [ ] **Step 1: 실패하는 테스트** — `src/lib/schemas.test.ts`에 `test("repo is optional", () => expect(schema.parse({ ...validProject, links: { live: "https://x.dev" } }).links.repo).toBeUndefined())`; `src/lib/llms.test.ts`에 repo 없는 프로젝트 줄이 `- [T](url): summary`로 끝나는 케이스. `pnpm test` → FAIL.
- [ ] **Step 2: 구현** 위 인터페이스대로. `pnpm test` → PASS.
- [ ] **Step 3: 게이트·커밋** `pnpm format && pnpm lint && pnpm test && pnpm check && pnpm build` → `git commit -m "feat(content): make links.repo optional for private repositories"`.

---

### Task 2: 태엽새 케이스 스터디

**Files:**
- Create: `content/projects/heart-of-steel/meta.yaml`, `ko.md`, `en.md`, `capture.yaml`, `screens/*`
- Modify: `content/skills.yaml`(Task 5에서 전체 교체하므로 여기서는 임시로 `phaser`,`vite`,`express`,`anthropic-sdk`,`zod`,`node` 항목을 추가해 계약 테스트 통과)

- [ ] **Step 1: meta.yaml** 사실 A 그대로. 스택 id는 D의 id. `featured: true`, `order: 1`, `updatedAt: "2026-09-06"`. 모든 문자열에 쉼표·콜론이 있으면 따옴표.
- [ ] **Step 2: 스크린샷** `capture.yaml`(사실 A) 작성 → `pnpm capture heart-of-steel`. 출력 YAML을 meta의 `screens`에 붙이고 alt 작성(ko/en). `docs/banner.png` → `screens/03-banner@desktop.png`(capturedAt `"2026-08-12"`, sidecar 없음), `docs/제출물/아키텍처.png` → `screens/architecture.png`(ai.architecture). 크기 확인(≤1.5MB; 넘으면 `pnpm exec sharp`가 없으므로 `node -e`로 sharp 리사이즈: `require('sharp')(src).resize({width:1600}).png().toFile(dst)`).
- [ ] **Step 3: ko.md / en.md** 이야기 골자 A를 4개 H2(`## 문제 / ## 접근 / ## 결과 / ## 배운 점`, en `## Problem / ## Approach / ## Result / ## What I learned`)로. 각 H2 아래 3~5문단, 문단당 2~4문장. 수치는 사실 표의 것만. 코드 인용은 파일 경로만(`src/server/ai/*.js`, `src/data/prompts/*.txt`). 마지막에 "면접에서 받을 질문" 같은 메타 문장은 쓰지 않는다.
- [ ] **Step 4: 검증** `pnpm test`(계약: 헤딩·스킬 참조·sidecar), `pnpm build`, 브라우저 또는 `dist/projects/heart-of-steel/index.html` grep으로 지표·AI 블록 렌더 확인. keyCommits 4개 URL을 `curl -s -o /dev/null -w '%{http_code}'`로 200 확인.
- [ ] **Step 5: 커밋** `content(heart-of-steel): case study with metrics, ai evidence and captured screens`.

---

### Task 3: PIXELARIOUS 케이스 스터디

같은 절차(사실 B). `links`에 `repo` 없음, `keyCommits: []`. `capture.yaml` base `https://neo-kido.vercel.app`. ko.md "접근" 첫 문단에 편집기 설명, 마지막 문단에 "현재 도메인은 이전 이름 neo-kido를 유지" 한 줄. 커밋 `content(pixelarious): case study with analytics-backed metrics`.

---

### Task 4: Aetheria Online 케이스 스터디

같은 절차(사실 C). 스크린샷은 `screens/architecture.svg`를 직접 작성(1440×900 viewBox, 배경 `#0f172a`, 박스 `#1e293b` 테두리 `#94a3b8`, 텍스트 `#f8fafc`, 폰트 `system-ui, sans-serif`, 텍스트만으로 구성: "Socket / Timer(8-shard heap) / DB worker(MSSQL·JSON)" → "IOCP completion queue" → "Worker threads ×N" → "Sector view (9 cells) / Lazy NPC AI (Lua VM per worker) / Send coalescing + TCP_NODELAY" → "Clients ≤10,000"). `image()`는 svg를 받는다; `<Picture>`가 svg에 대해 포맷 변환을 건너뛰는지 빌드로 확인하고, 문제가 있으면 해당 프로젝트 페이지에서만 `<img>`로 폴백하도록 `ScreenshotGallery.astro`에 `src.format === "svg"` 분기를 추가(작게, 주석). `capture.example.yaml`은 `local: { cwd: "<로컬 클론 경로>", command: "...", port: 3500 }` 주석 예시와 shots 예시만 담고, 계약 테스트·스크립트가 `capture.example.yaml`을 무시하는지 확인(스크립트는 `capture.yaml`만 읽으므로 무시됨). 커밋 `content(aetheria-online): case study with report-backed load-test metrics`.

---

### Task 5: 스킬·프로필·경력 교체, 샘플 삭제, 참조 갱신

**Files:**
- Replace: `content/skills.yaml`(사실 D 전체), `content/profile.yaml`(E), `content/experience.yaml`(E)
- Delete: `content/projects/sample-project/`
- Modify: `tests/e2e/smoke.spec.ts`(`sample-project`→`heart-of-steel`, 제목 문자열 `샘플 프로젝트`→`코드네임: 태엽새`, `Sample Project`→`Heart of Steel`; 필터 테스트는 그룹 존재에 맞게 `#stack=ai`와 라디오 `AI`로 바꾸고 카드 수 기대값을 3/1로), `tests/build/js-budget.test.ts`(`projects/sample-project`→`projects/heart-of-steel`), `lighthouserc.json`(같은 교체), `README.md`(히어로 이미지 `content/projects/heart-of-steel/screens/01-title@desktop.png`, 문장 갱신), `docs/content-guide.md`(자리표시 grep 한 줄)
- `src/lib/content-status.test.ts`가 `sample-project`를 참조하면 `heart-of-steel` 기준으로 기대값 갱신(hasEn true, screens 4, metrics 3, metricsWithEvidence 2).

- [ ] **Step 1** 파일 교체·삭제 → `pnpm test`에서 실패하는 테스트를 하나씩 갱신(RED→GREEN). `pnpm content:status` 표를 보고 누락 확인.
- [ ] **Step 2** `pnpm build && pnpm test:build && pnpm e2e` 통과. a11y(axe)는 새 페이지 3×2에 대해 돈다.
- [ ] **Step 3** 커밋 `content: real skills, profile placeholders, drop sample project`.

---

### Task 6: 마감 검토

- [ ] `grep -rn '채워 주세요' content/` 목록을 보고서에 적는다(사용자가 채울 것).
- [ ] `pnpm capture <slug> --stale 90` 세 프로젝트 모두 0 종료(방금 캡처).
- [ ] 라이브 링크 3개, 데모 영상, 커밋 URL 8개를 `curl` 200 확인(lychee가 CI에서도 검사).
- [ ] 브랜치 푸시 → PR → CI(Lighthouse 포함) 초록 → 사용자 검토 후 병합.

## 스펙 대조

§13 6단계(콘텐츠 채우기) 전부. §8 훅 중 "증거 링크 지표", "AI 증거 블록", "스킬=만든 것"이 실제 데이터로 채워짐. 프로필·경력 실제 사실은 사용자 입력 대기(자리표시). 시각 디자인·7단계 마감은 다음 계획.
