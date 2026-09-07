# 마감 체크리스트

사이트 소유자가 직접 하는 일을 순서대로 적었다. 위에서 아래로 진행한다. (A)는 링크를 공유하기 전에 반드시 끝내야 하고, (B)~(D)는 네이버·구글·카카오 계정이 필요해 자동화하지 않았다. (E)는 배포할 때마다 반복한다.

## (A) 공유 전 차단 항목

1. `grep -rn '채워 주세요' content/`를 실행한다. `content/experience.yaml`의 자리표시 5곳(학교·전공, 학위/졸업예정, 학교 항목의 불릿 한 줄(9행), 수상 결과, 게임 서버 프로그래밍 과목·학교)이 나온다. ko와 짝인 en 값(`[Fill in ...]`)도 같이 채운다. 자리표시는 화면에서 걸러지므로 채우기 전까지는 학력과 수강 과목 항목이 아예 보이지 않는다.
2. `pnpm test && pnpm build`로 계약 테스트와 스키마를 통과시킨 뒤 `pnpm preview`로 `/`, `/resume/`, `/en/resume/`에서 자리표시가 사라졌는지 눈으로 본다. 경력 목록은 랜딩과 이력서 두 곳에 렌더된다.
3. 태엽새(heart-of-steel)를 Railway에 다시 배포한다. 배포 주소가 바뀌었으면 `content/projects/heart-of-steel/capture.yaml`의 `base`를 새 주소로 고친다.
4. `pnpm capture heart-of-steel`을 실행한다. 출력된 screens YAML을 `content/projects/heart-of-steel/meta.yaml`의 `screens`에 반영하고 alt는 직접 쓴다. 기존 `03-banner@desktop.png`와 `02-prison-puzzle@desktop.png`는 남겨 두어도 된다(README 배너가 `03-banner@desktop.png`를 쓴다).
5. 같은 `meta.yaml`에서 `status: archived`를 `status: live`로 바꾸고, `links`에 `live: <Railway 주소>`를 추가하고, `updatedAt`을 오늘 날짜로 갱신한다.
6. `pnpm test && pnpm build && pnpm test:build && pnpm e2e` 통과 → 커밋 → PR → CI 초록 → main 병합. Vercel이 main을 자동 배포한다. 배포 후 (E)를 한 번 돈다.

## (B) 네이버 서치어드바이저

소유 확인 메타 태그는 환경변수 `NAVER_SITE_VERIFICATION`이 설정된 빌드에서만 `<meta name="naver-site-verification">`으로 렌더된다(`astro.config.ts`의 `env.schema`에 선언하고 `src/layouts/Base.astro`가 읽는다). 값이 없으면 태그도 없다. 이 절차는 계정이 필요해 여기서는 실행하지 않았다.

1. https://searchadvisor.naver.com 에 로그인하고 "웹마스터 도구"에서 사이트 `https://hello-iam-doik.vercel.app`를 등록한다.
2. 소유 확인 방식으로 "HTML 태그"를 고른다. 화면에 `<meta name="naver-site-verification" content="...">`가 보인다. `content` 값(토큰)만 복사한다.
3. Vercel에서 Project → Settings → Environment Variables로 가서 이름 `NAVER_SITE_VERIFICATION`, 값은 복사한 토큰으로 추가한다. Production 환경에 체크한다.
4. 환경변수는 다음 빌드부터 반영되므로 재배포한다. Vercel Deployments에서 최신 배포의 "Redeploy"를 누르거나, main에 빈 커밋을 푸시한다.
5. 배포가 끝나면 `https://hello-iam-doik.vercel.app`의 소스 보기에서 `naver-site-verification` 메타가 있는지 확인한 뒤, 서치어드바이저에서 "소유확인"을 누른다.
6. 요청 → 사이트맵 제출에 `https://hello-iam-doik.vercel.app/sitemap-index.xml`을 넣는다.
7. 요청 → 웹 페이지 수집에 `https://hello-iam-doik.vercel.app/`와 `https://hello-iam-doik.vercel.app/en/`을 각각 넣는다.

## (C) 구글 서치 콘솔

(B)와 같은 패턴이다. 환경변수 이름만 `GOOGLE_SITE_VERIFICATION`이고, 렌더되는 태그는 `<meta name="google-site-verification">`이다.

1. https://search.google.com/search-console 에 로그인하고 속성 추가 → "URL 접두어"로 `https://hello-iam-doik.vercel.app`를 넣는다.
2. 확인 방법 중 "HTML 태그"를 펼친다. `<meta name="google-site-verification" content="...">`의 `content` 값만 복사한다.
3. Vercel Project → Settings → Environment Variables에 이름 `GOOGLE_SITE_VERIFICATION`, 값은 복사한 토큰으로 추가한다. Production 환경에 체크한다.
4. 재배포한다(Redeploy 또는 main 푸시). (B)에서 이미 재배포했더라도 이 변수를 넣은 뒤에 한 번 더 해야 한다. 두 변수를 한 번에 넣고 재배포 한 번으로 끝내도 된다.
5. 배포가 끝나면 소스 보기에서 `google-site-verification` 메타를 확인한 뒤 서치 콘솔에서 "확인"을 누른다.
6. Sitemaps 메뉴에 `https://hello-iam-doik.vercel.app/sitemap-index.xml`을 제출한다.
7. URL 검사에서 `https://hello-iam-doik.vercel.app/`와 `https://hello-iam-doik.vercel.app/en/`을 각각 넣고 "색인 생성 요청"을 누른다.

## (D) 카카오 공유 미리보기 캐시

카카오톡은 OG 이미지와 설명을 캐시하므로, 배포 후에는 캐시를 지워야 새 미리보기가 보인다. 카카오 개발자 계정이 필요하다.

1. https://developers.kakao.com/tool/debugger/sharing 을 연다.
2. 아래 URL을 하나씩 넣고 "캐시 초기화"를 누른 뒤 미리보기(제목, 설명, 이미지)를 확인한다.
   - `https://hello-iam-doik.vercel.app/`
   - `https://hello-iam-doik.vercel.app/en/`
   - `https://hello-iam-doik.vercel.app/projects/heart-of-steel/`
   - `https://hello-iam-doik.vercel.app/projects/pixelarious/`
   - `https://hello-iam-doik.vercel.app/projects/aetheria-online/`
   - 위 프로젝트 3개의 `/en/projects/<slug>/` 버전
3. 카카오톡 인앱 브라우저(나에게 보내기로 링크를 보내고 열기)에서 랜딩과 프로젝트 페이지 하나를 실제로 열어 본다. 히어로가 잘리거나 가로 스크롤이 생기면 그 화면을 캡처해 이슈로 남긴다.

## (E) 배포 후 확인

main에 병합될 때마다 반복한다.

1. `https://hello-iam-doik.vercel.app/` 푸터의 짧은 sha가 방금 병합한 커밋(`git log -1 --format=%h main`)과 같은지 본다. 링크를 누르면 GitHub 커밋 페이지가 열린다.
2. OG 이미지 URL을 브라우저에서 직접 연다. 랜딩 `https://hello-iam-doik.vercel.app/og/ko.png`, 영어 `https://hello-iam-doik.vercel.app/og/en.png`, 프로젝트 `https://hello-iam-doik.vercel.app/og/projects/heart-of-steel/ko.png`. 한글이 네모(tofu)로 보이면 OG 폰트 문제다(ADR-0009).
3. PageSpeed Insights에서 모바일과 데스크톱을 각각 본다.
   - https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fhello-iam-doik.vercel.app%2F
   - https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fhello-iam-doik.vercel.app%2Fen%2F
   - https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fhello-iam-doik.vercel.app%2Fprojects%2Fheart-of-steel%2F
   CI의 Lighthouse 예산(`lighthouserc.json`: 카테고리 0.95 이상, LCP 2500ms, TBT 200ms, CLS 0.1)은 데스크톱 프리셋 기준이므로, 모바일 점수는 별도로 적어 둔다.
4. `https://hello-iam-doik.vercel.app/sitemap-index.xml`과 `https://hello-iam-doik.vercel.app/llms.txt`가 열리는지 본다.
5. (B)(C)의 토큰을 넣은 배포라면 소스 보기에서 두 소유 확인 메타가 모두 있는지 다시 본다.
