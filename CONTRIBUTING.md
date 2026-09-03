# Contributing (solo repo, but written for a reader)

- 브랜치: `feat/…`, `content/…`, `docs/…`. main에 직접 푸시하지 않는다.
- 커밋: Conventional Commits. 로컬 훅은 commit-msg 하나(commitlint). 포맷·테스트는 CI가 막는다 (ADR-0007).
- 커밋 전 `pnpm format && pnpm test`를 습관으로.
- Windows: Git Bash 권장. PowerShell이면 `&&` 대신 `;`. 줄바꿈은 `.gitattributes`가 LF로 맞춘다.
- 의존성: 매달 `pnpm outdated` 확인, Dependabot PR은 CI 통과 시 병합.
- Dependabot PR은 커밋 제목이 봇 형식이라 CI의 commitlint 단계를 건너뛴다. 나머지 게이트(타입·린트·테스트·빌드·e2e)는 동일하게 통과해야 병합한다.
