# 프로젝트 5분 추가

1. `content/projects/<slug>/` 폴더 생성. slug는 URL 세그먼트(kebab-case).
2. `meta.yaml` 작성. 필드는 `src/content/schemas.ts` 참고. `stack`은 `content/skills.yaml`의 id.
3. `ko.md` 작성. `## 문제 / ## 접근 / ## 결과 / ## 배운 점` 4개 H2 필수.
4. `capture.yaml`을 쓰고 `pnpm capture <slug>` 실행 → 출력된 YAML을 meta.yaml에 붙여 alt 작성. 로컬 실행 레포는 `local: { cwd, command, port }`. 90일 넘은 스크린샷은 `pnpm capture <slug> --stale 90`. 1.5MB 이하. `local.command`는 `pnpm capture`가 그대로 실행하므로, `capture.yaml`은 신뢰할 수 있는 입력으로 취급하고 PR에서 리뷰한다.
5. (선택) `en.md`. 없으면 /en/에서 한국어 본문 + 안내문.
6. `pnpm test` (계약 테스트) → `pnpm build` → PR.
7. `pnpm content:status`로 누락 확인.

## 지원 전 수동 체크

- 네이버 서치어드바이저에 `sitemap-index.xml` 제출
- 카카오톡 인앱 브라우저에서 랜딩·프로젝트 페이지 확인 (`100vh` 금지, `dvh` 사용)
- 카카오 OG 캐시 갱신(개발자 도구 → 링크 디버거)
