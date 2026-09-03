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

test("every page's og:image resolves to a png", async ({ page, request, baseURL }) => {
  const base = baseURL ?? "http://localhost:4321";
  for (const path of await sitemapPaths(base)) {
    await page.goto(path);
    const ogLocator = page.locator('meta[property="og:image"]');
    // resume/colophon 페이지는 og:image 메타 태그 자체가 없다. locator.getAttribute()는
    // 요소가 나타나길 auto-wait하므로, count()로 존재 여부를 먼저 확인해 타임아웃을 피한다.
    if ((await ogLocator.count()) === 0) continue;
    const og = await ogLocator.getAttribute("content");
    if (!og) continue;
    const res = await request.get(new URL(og).pathname);
    expect(res.status(), `${path} → ${og}`).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  }
});
