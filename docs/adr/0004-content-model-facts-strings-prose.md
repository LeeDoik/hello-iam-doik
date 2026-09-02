---
title: "Content model: facts, strings and prose in content/"
status: accepted
date: 2026-09-02
---

# Content model: facts, strings and prose in content/

## Context and Problem Statement

이 포트폴리오는 프로젝트, 스킬, 경력, 프로필 같은 콘텐츠를 로케일(한/영)마다 이중으로 관리해야 한다. 이 콘텐츠는 세 가지 서로 다른 성격을 갖는다: (1) 링크나 스택 목록처럼 언어와 무관한 "사실", (2) 제목·요약처럼 짧고 두 언어 모두 필수인 "한 줄 문자열", (3) 프로젝트 스토리처럼 길고 로케일별로 따로 작성되며 영어 번역이 늦어질 수 있는 "긴 글". 이 세 성격을 같은 파일 포맷과 같은 위치에 욱여넣으면 변경 빈도가 다른 것들이 뒤섞여, 사실 하나 고치려고 긴 글이 있는 파일을 열게 되거나 반대로 번역 지연이 스키마 전체를 막게 된다. 또한 이 콘텐츠는 "코드"가 아니므로, 소스 트리 안에 있으면 코드 리뷰·빌드 도구 설정이 콘텐츠 변경과 뒤섞여 보일 위험이 있다.

## Considered Options

- 모든 콘텐츠를 `src/content/` 아래 Markdown 프론트매터로 통일 (Astro 기본 관례).
- 사실/문자열/글을 구분하지 않고 프로젝트마다 하나의 큰 YAML(본문 포함)로 관리.
- 사실은 YAML 한 번, 한 줄 문자열은 `{ko,en}` 쌍, 긴 글은 로케일별 Markdown 파일로 분리하고, 이 전체를 저장소 루트의 `content/`(즉 `src/` 밖)에 둔다 (선택).

## Decision Outcome

선택: 세 번째 옵션. `content/profile.yaml`, `content/skills.yaml`, `content/experience.yaml`는 사실을 담는 단일 YAML(리스트 또는 객체)로 한 번만 존재한다. 그 안의 제목·요약·bio 같은 한 줄 텍스트는 `{ ko, en }` 쌍으로 두 언어 모두 필수(`localized` 스키마, `z.object({ ko: z.string().min(1), en: z.string().min(1) })`)로 강제한다. 프로젝트의 긴 글(문제/접근/결과/배운 점)은 `content/projects/<slug>/ko.md`, `en.md`로 로케일별 Markdown 파일에 분리하고, `en.md`는 없어도 빌드가 막히지 않는 지연 번역을 허용한다(`content-contract.test.ts`의 "untranslated backlog is printed, not failed" 테스트가 이를 보장). `content/`는 `src/` 밖, 저장소 루트에 둔다: "이건 코드가 아니라 채워 넣는 데이터다"라는 경계를 폴더 구조로 눈에 보이게 하기 위해서다. Astro의 콘텐츠 레이어 API(`glob`/`file` 로더, `generateId`, 이미지 인지 스키마의 `image()`)가 `src/` 밖의 위치를 실제로 지원하는지는 검증되지 않은 가정이었으므로, 이번 스파이크(Step 5)에서 직접 확인했다.

**Step 5 스파이크 관찰 결과**: `src/content.config.ts`에서 `glob({ pattern: "*/meta.yaml", base: "./content/projects", generateId: ... })`와 `schema: ({ image }) => projectSchema(image)`로 배선한 뒤 `pnpm build`를 실행하자, `content/projects/sample-project/meta.yaml`의 `screens[].src: ./screens/01-home@desktop.png`가 `meta.yaml` 파일 기준 상대 경로로 정확히 해석되어 `content/projects/sample-project/screens/01-home@desktop.png`를 찾았다. 즉 `image()`와 `glob` 로더는 `src/` 밖의 `content/`에서도 별도 설정 없이 동작했고, `content/`를 옮기는 스펙 §5의 대안은 필요하지 않았다.

다만 스파이크 도중 예상 밖의 문제를 하나 발견했다: Astro의 `glob`/`file` 로더는 YAML/frontmatter 파싱에 `js-yaml`을 쓰는데, `js-yaml`은 YAML core 스키마에 따라 인용부호 없는 `2026-09-02` 같은 스칼라를 문자열이 아니라 JS `Date` 객체로 자동 변환한다. 반면 Vitest/스크립트에서 원본 파일을 읽는 `src/lib/content-files.ts`의 `readYaml`은 `yaml` 패키지(`parse`)를 쓰는데, 이 패키지는 같은 값을 문자열로 남겨둔다. 그 결과 `isoDate = z.string().regex(...)` 스키마가 Astro 빌드에서는 `Date` 타입 불일치로 실패했다(`from`, `to`, `capturedAt`, `updatedAt`, ADR 프론트매터의 `date`). 해결: 이 태스크가 새로 만드는 `content/*.yaml`의 날짜 값은 `"2026-09-02"`처럼 명시적으로 인용부호를 붙여 두 파서 모두에서 문자열로 남게 했고, 이 태스크가 소유하지 않는 기존 ADR 프론트매터(0001~0003, 0006~0007)는 건드리지 않는 대신 `content.config.ts`의 `adrs` 컬렉션 스키마에서 `z.preprocess`로 `Date`를 다시 ISO 문자열로 되돌리는 변환을 추가했다.

### Consequences

- 좋은 점: 사실 하나를 고칠 때 긴 글이 섞인 파일을 열 필요가 없고, 반대로 번역 작업(긴 글)이 사실 데이터의 스키마 검증을 막지 않는다. `content/`가 `src/` 밖에 있어 "빌드 도구/코드"와 "채워 넣는 콘텐츠"의 경계가 디렉터리 구조만 봐도 드러난다. `localized` 스키마 덕분에 두 언어 중 하나만 채우고 잊어버리는 실수가 빌드 시점에 잡힌다.
- 나쁜 점 / 감수한 것: 콘텐츠 파일이 3벌 포맷(YAML/YAML/Markdown)으로 나뉘어 있어 새 기여자가 "이 텍스트는 어느 파일에 있는가"를 처음엔 헷갈릴 수 있다. `content/`가 `src/` 밖에 있다는 사실 때문에 Astro의 `image()`가 실제로 상대 경로를 해석해줄지 사전에 보장되지 않았고(이번 스파이크로 확인 전까지는 리스크였음), `js-yaml`의 날짜 자동 변환처럼 로더별로 다른 파서를 쓰는 데서 오는 숨은 타입 불일치를 감수해야 했다.
- 되돌리는 조건(deletion trigger): `content/`를 `src/` 밖에 두는 것이 Astro의 향후 버전에서 더 이상 지원되지 않거나, 팀(또는 배포 파이프라인)이 `src/` 바깥 파일을 추적하지 못하는 도구를 도입하게 되면, 스펙 §5의 대안대로 `content/`를 `src/content/`로 옮기고 `CONTENT_ROOT`·`base` 경로·이 ADR을 갱신한다.

## Try it (5분 실험)

```bash
# meta.yaml의 updatedAt을 스키마가 기대하는 YYYY-MM-DD 형식이 아닌 값으로 바꾼 뒤 빌드
sed -i 's/updatedAt: "2026-09-02"/updatedAt: "2026\/09\/02"/' content/projects/sample-project/meta.yaml
pnpm build
```

실제 결과: 빌드가 실패하며 어느 필드(`updatedAt`)가 스키마의 어떤 기대(`Invalid`, 정규식 불일치)를 어겼는지, 그리고 파일 경로(`content/projects/sample-project/meta.yaml`)까지 에러 메시지에 그대로 찍힌다. 즉 콘텐츠 오류가 조용히 배포되지 않고 빌드 시점에 파일 경로와 함께 드러난다. (실험 후 원래 값으로 되돌렸다.)

## What I learned

Astro의 콘텐츠 레이어에서 "로더가 파일을 어떻게 파싱하는가"는 스키마 설계에 실제로 영향을 준다. 겉보기엔 같은 YAML 텍스트라도, 이를 읽는 라이브러리(`js-yaml` core 스키마 vs. `yaml` 패키지의 기본 동작)에 따라 `2026-09-02`가 문자열이 되기도 하고 `Date` 객체가 되기도 한다는 걸 이번에 직접 부딪혀서 알았다. 그래서 "테스트에서 통과했다"와 "Astro 빌드에서 통과했다"는 서로 다른 파서 경로를 지나므로 별개로 확인해야 하는 것이었고, 이것이 이 태스크가 순수 Node 스크립트(`content-files.ts`, Vitest)와 Astro 빌드(`content.config.ts`) 양쪽에서 같은 콘텐츠를 검증하게 만든 이유이기도 하다. 날짜처럼 "보기엔 문자열 같은" YAML 스칼라는 인용부호로 타입을 명시하는 습관이, 파서가 바뀌어도 안전한 콘텐츠를 만든다는 것도 배웠다.
