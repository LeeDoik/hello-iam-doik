import { expect, test } from "@playwright/test";
import { sitemapPaths } from "./sitemap";

test("canonical points to itself and hreflang is reciprocal on every page", async ({
  page,
  baseURL,
}) => {
  const base = baseURL ?? "http://localhost:4321";
  const paths = await sitemapPaths(base);
  for (const path of paths) {
    await page.goto(path);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(new URL(canonical ?? "").pathname, `${path} canonical`).toBe(path);

    const alts = await page
      .locator('link[rel="alternate"][hreflang]')
      .evaluateAll((els) =>
        els.map((e) => ({ lang: e.getAttribute("hreflang"), href: e.getAttribute("href") })),
      );
    expect(alts.map((a) => a.lang).sort()).toEqual(["en", "ko", "x-default"]);
    // 상호참조: 각 대안 페이지의 hreflang 집합도 같은 URL들을 가리켜야 한다
    for (const a of alts.filter((x) => x.lang !== "x-default")) {
      await page.goto(new URL(a.href ?? "").pathname);
      const back = await page
        .locator('link[rel="alternate"][hreflang]')
        .evaluateAll((els) => els.map((e) => e.getAttribute("href")));
      expect(back, `${a.href} must link back to ${path}`).toContain(canonical);
      await page.goto(path);
    }
  }
});

test("sitemap has both locales for every page", async ({ baseURL }) => {
  const paths = await sitemapPaths(baseURL ?? "http://localhost:4321");
  const ko = paths.filter((p) => !p.startsWith("/en/"));
  for (const p of ko) expect(paths, p).toContain(`/en${p}`);
});
