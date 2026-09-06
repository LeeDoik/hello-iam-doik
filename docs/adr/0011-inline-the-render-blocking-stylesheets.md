---
title: "Inline the render-blocking stylesheets"
status: accepted
date: "2026-09-07"
---

# Inline the render-blocking stylesheets

## Context and Problem Statement

4차 마감에서 라이브 사이트를 Lighthouse 모바일 프로필(느린 4G, CPU 4배 감속)로 재자 `/`가 성능 82점, LCP 3.4초, FCP 3.2초였다. 데스크톱은 100점, LCP 0.4초였고, CI의 Lighthouse 예산도 데스크톱 프리셋이라 통과 중이었다. 즉 CI가 보는 조건과 취업 담당자가 폰으로 여는 조건이 달랐다.

원인은 `<head>`의 렌더 차단 스타일시트 두 개였다. `pretendard.css`(`@font-face` 92개, gzip 13KB)와 Astro가 만든 `Base.css`(Tailwind 결과, gzip 5KB)를 각각 별도 요청으로 받아야 첫 페인트가 시작되고, 폰트 파일은 그 CSS를 파싱한 뒤에야 발견된다. 문서 → CSS → 폰트로 이어지는 왕복 체인이 느린 네트워크에서 그대로 LCP에 더해졌다. LCP 요소는 히어로의 소개 문단이었고, "요소 렌더 지연"이 2.3초였다.

## Considered Options

- 폰트 파일 프리로드. ADR-0009 개정에서 기각했다. 동적 서브셋 92개 중 어느 파일이 필요한지는 페이지 글자에 따라 다르고, 랜딩만 해도 14개를 쓴다. 특정 파일을 고르면 틀리거나 불필요한 파일까지 받는다.
- `font-display: optional`. 폰트 교체 리페인트가 사라져 LCP는 빨라지지만, 첫 방문에서는 시스템 폰트로 보인다. 디자인 패스에서 Pretendard를 전제로 타입 스케일을 잡았으므로 첫인상을 버리는 선택이다.
- 두 스타일시트를 HTML에 인라인(선택). 렌더 차단 요청이 0개가 되고, 폰트는 HTML 파싱 직후 레이아웃 시점에 발견된다. 대신 페이지마다 gzip 약 19KB가 HTML에 붙고, 페이지를 옮겨 다닐 때 CSS 캐시 이점이 사라진다.

## Decision Outcome

선택: 두 스타일시트 모두 인라인. `Base.astro`가 `public/fonts/pretendard/pretendard.css`를 Vite `?raw`로 읽어 `<style>`로 넣고, `astro.config.ts`의 `build.inlineStylesheets: "always"`가 Tailwind 결과를 인라인한다. 포트폴리오는 한 방문에 보는 페이지가 적고 첫 페이지의 첫 화면이 전부이므로, 페이지당 19KB보다 왕복 두 번을 없애는 쪽이 이 사이트에 맞다.

### Consequences
- 좋은 점: 렌더 차단 요청 0개. 로컬 모바일 프로필에서 FCP 1065ms → 952ms, LCP 1665ms → 952ms. 라이브 수치는 아래 "Try it"과 개정문에 있다.
- 나쁜 점 / 감수한 것: `dist/index.html`이 gzip 7.3KB → 26.7KB. 폰트 CSS의 라이선스 주석까지 매 페이지에 실린다(OFL 고지이므로 남긴다). `pretendard.css` 파일은 `public/`에 그대로 두어 `vendor-fonts` 스크립트의 출력 위치를 바꾸지 않았다.
- 되돌리는 조건(deletion trigger): 페이지 수가 늘어 방문당 여러 페이지를 보는 패턴이 되거나, HTML gzip이 50KB를 넘거나, Astro가 폰트 CSS를 자동으로 다루는 옵션을 제공할 때.

## Try it (5분 실험)

```bash
pnpm build
grep -c '<link rel="stylesheet"' dist/index.html   # 0
grep -c '@font-face' dist/index.html               # 92
npx lighthouse https://hello-iam-doik.vercel.app/ --output=json --output-path=./lh.json --chrome-flags="--headless=new"
```

라이브 측정(Lighthouse 13.4, 모바일 프로필, 시뮬레이션 스로틀링, 같은 PC에서 같은 시간대에 1회씩):

| 페이지 | 시점 | 성능 | FCP | LCP |
|---|---|---|---|---|
| `/` | 인라인 전 (22175c5) | 82 | 3.2s | 3.4s |
| `/en/` | 인라인 전 (22175c5) | 91 | 2.3s | 3.0s |
| `/projects/heart-of-steel/` | 인라인 전 (22175c5) | 84 | 3.5s | 3.5s |

프리뷰 배포는 Vercel 인증으로 보호되어 외부에서 잴 수 없으므로, "인라인 후" 수치는 main 병합 뒤 같은 방법으로 재서 이 문서 끝에 개정문으로 붙인다. 1회 측정이라 ±5점 정도는 잡음이다. 방향이 바뀌지 않는지만 본다.

## What I learned

CI에서 초록인 성능 예산이 "사용자가 겪는 성능"과 같은 뜻은 아니었다. 우리 예산은 데스크톱 프리셋이었고, 같은 페이지가 모바일 프로필에서는 20점 가까이 낮았다. 원인도 코드가 무거워서가 아니라 네트워크 왕복의 순서 문제였다. 파일을 하나 더 요청하는 것과 HTML을 19KB 키우는 것 사이의 선택은 "어느 쪽이 작은가"가 아니라 "느린 회선에서 어느 쪽이 먼저 그려지는가"로 정해야 한다는 것, 그리고 이런 결정은 반드시 전후 수치를 같은 조건에서 재서 남겨야 나중에 되돌릴 근거가 생긴다는 것을 배웠다. Lighthouse CI 예산에 모바일 프로필을 추가할지는 다음 결정으로 남긴다.

## Amendment 2026-09-07

병합 뒤 라이브에서 같은 방법(Lighthouse 13.4, 모바일 프로필, 시뮬레이션 스로틀링)으로 다시 쟀다. 실행마다 새 Chrome을 띄우는 기본 방식에서는 결과가 두 갈래로 갈렸다. 9회 중 6회는 성능 100, FCP·LCP 1.05~1.2초였고, 3회는 74~85점, FCP 3.0~3.7초였다. 트레이스를 열어 보니 느린 실행에서도 자원은 316ms에 다 받았고 렌더러의 첫 `Paint` 이벤트는 185ms였는데, 브라우저가 첫 프레임을 화면에 제시한 시각(`firstPaint`)이 2,245ms였다. 즉 네트워크도 스크립트도 아니라 새로 뜬 Chrome의 GPU 프로세스가 첫 프레임을 늦게 내보낸 것이다. Chrome 인스턴스 하나를 미리 띄워 두고(`--remote-debugging-port` + `lighthouse --port`) 9회를 재자 전부 100점이었고, 같은 방식으로 `example.com`을 새 Chrome에서 6회 재면 지연이 없었다. 따라서 이 갈래는 측정 환경(이 PC의 헤드리스 Chrome 첫 실행)에서 오는 잡음으로 판단하고, 아래 표에는 데운 Chrome 수치를 적는다.

| 페이지 | 시점 | 성능 | FCP | LCP |
|---|---|---|---|---|
| `/` | 인라인 전 (22175c5, 새 Chrome 1회) | 82 | 3.2s | 3.4s |
| `/` | 인라인 후 (668e1e4, 데운 Chrome 3회 중앙값) | 100 | 1.2s | 1.2s |
| `/en/` | 인라인 전 (22175c5, 새 Chrome 1회) | 91 | 2.3s | 3.0s |
| `/en/` | 인라인 후 (668e1e4, 데운 Chrome 3회 중앙값) | 100 | 1.2s | 1.2s |
| `/projects/heart-of-steel/` | 인라인 전 (22175c5, 새 Chrome 1회) | 84 | 3.5s | 3.5s |
| `/projects/heart-of-steel/` | 인라인 후 (668e1e4, 데운 Chrome 3회 중앙값) | 100 | 1.2s | 1.5s |

"인라인 전" 행은 새 Chrome 1회씩이라 위의 잡음이 섞였을 수 있고, 두 시점 사이에 히어로 초기화 지연(ADR-0008 개정 2026-09-07)도 들어갔다. 조건을 같게 맞춘 비교는 로컬 빌드 전후(FCP 1065ms → 952ms, LCP 1665ms → 952ms)뿐이다. 요청 폭포에서 확인된 구조적 변화는 분명하다. 인라인 전에는 폰트 요청이 CSS 응답 뒤 1,068ms에 시작했고, 인라인 후에는 문서 응답 직후 380ms에 시작한다. 실제 방문자 수치가 필요하면 Vercel Speed Insights 같은 필드 측정을 붙여야 하는데, 스크립트 하나가 추가되고 CSP를 손대야 하므로 별도 결정으로 남긴다.
