import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";

export default defineConfig({
  site: "https://hello-iam-doik.vercel.app",
  trailingSlash: "always",
  // 두 번째 렌더 차단 요청(Base.css)도 없앤다. 페이지당 gzip 약 5KB가 늘지만 첫 페인트가 문서 도착 직후로 당겨진다 (ADR-0011).
  build: { format: "directory", inlineStylesheets: "always" },
  // github-dark's default comment color (#6a737d on #24292e) fails WCAG AA color-contrast
  // (3.04:1, needs 4.5:1) inside ADR code fences on /colophon/. github-dark-high-contrast is
  // Shiki's WCAG-tuned variant of the same palette family. The light palette gets github-light;
  // defaultColor: false makes Shiki emit only --shiki-dark/--shiki-light variables so global.css
  // can pick per prefers-color-scheme and paint the block background with the paper-2 token.
  markdown: {
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark-high-contrast" },
      defaultColor: false,
    },
  },
  i18n: {
    defaultLocale: "ko",
    locales: ["ko", "en"],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    react(),
    sitemap({ i18n: { defaultLocale: "ko", locales: { ko: "ko-KR", en: "en-US" } } }),
  ],
  vite: { plugins: [tailwindcss()] },
  // 검색 엔진 소유 확인 토큰. 값이 있을 때만 Base.astro가 <meta>를 렌더한다 (docs/launch-checklist.md).
  env: {
    schema: {
      NAVER_SITE_VERIFICATION: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
      GOOGLE_SITE_VERIFICATION: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
    },
  },
});
