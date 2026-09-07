# 프로젝트 5분 추가

1. `content/projects/<slug>/` 폴더 생성. slug는 URL 세그먼트(kebab-case).
2. `meta.yaml` 작성. 필드는 `src/content/schemas.ts` 참고. `stack`은 `content/skills.yaml`의 id.
3. `ko.md` 작성. `## 문제 / ## 접근 / ## 결과 / ## 배운 점` 4개 H2 필수.
4. `capture.yaml`을 쓰고 `pnpm capture <slug>` 실행 → 출력된 YAML을 meta.yaml에 붙여 alt 작성. 로컬 실행 레포는 `local: { cwd, command, port }`. 90일 넘은 스크린샷은 `pnpm capture <slug> --stale 90`. 1.5MB 이하. `local.command`는 `pnpm capture`가 그대로 실행하므로, `capture.yaml`은 신뢰할 수 있는 입력으로 취급하고 PR에서 리뷰한다.
5. (선택) `en.md`. 없으면 /en/에서 한국어 본문 + 안내문.
6. `pnpm test` (계약 테스트) → `pnpm build` → PR.
7. `pnpm content:status`로 누락 확인.
8. 자리표시 목록 확인 `grep -rn '채워 주세요' content/`. 자리표시 값은 렌더에서 걸러진다(`src/lib/placeholders.ts`).

## 지원 전 수동 체크

공유 전 차단 항목, 네이버·구글 소유 확인과 사이트맵 제출, 카카오 공유 캐시 초기화, 배포 후 확인은 [launch-checklist.md](launch-checklist.md)에 순서대로 있다. 레이아웃에서는 `100vh` 대신 `dvh`를 쓴다(카카오톡 인앱 브라우저의 주소창 높이 때문).
