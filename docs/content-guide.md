# 프로젝트 5분 추가

1. `content/projects/<slug>/` 폴더 생성. slug는 URL 세그먼트(kebab-case).
2. `meta.yaml` 작성. 필드는 `src/content/schemas.ts` 참고. `stack`은 `content/skills.yaml`의 id.
3. `ko.md` 작성. `## 문제 / ## 접근 / ## 결과 / ## 배운 점` 4개 H2 필수.
4. `screens/NN-<what>@<device>.png` 추가, `meta.yaml`의 `screens`에 `capturedAt` 포함해 등록. 1.5MB 이하.
5. (선택) `en.md`. 없으면 /en/에서 한국어 본문 + 안내문.
6. `pnpm test` (계약 테스트) → `pnpm build` → PR.
7. `pnpm content:status`로 누락 확인.

## 지원 전 수동 체크

- 네이버 서치어드바이저에 `sitemap-index.xml` 제출
- 카카오톡 인앱 브라우저에서 랜딩·프로젝트 페이지 확인 (`100vh` 금지, `dvh` 사용)
- 카카오 OG 캐시 갱신(개발자 도구 → 링크 디버거)
