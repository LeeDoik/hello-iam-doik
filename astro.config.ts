import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";

export default defineConfig({
  site: "https://hello-iam-doik.vercel.app",
  trailingSlash: "always",
  build: { format: "directory" },
  // github-dark's default comment color (#6a737d on #24292e) fails WCAG AA color-contrast
  // (3.04:1, needs 4.5:1) inside ADR code fences on /colophon/. github-dark-high-contrast is
  // Shiki's WCAG-tuned variant of the same palette family.
  markdown: { shikiConfig: { theme: "github-dark-high-contrast" } },
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
