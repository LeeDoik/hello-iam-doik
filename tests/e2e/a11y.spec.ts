import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { sitemapPaths } from "./sitemap";

// 사이트맵 전체(30페이지 이상)를 한 테스트에서 돌므로 CI 러너 속도에 맞춰 시간을 넉넉히 준다.
// 위반은 모아서 한 번에 보고해 첫 페이지에서 멈추지 않게 한다.
test("every page in the sitemap has no serious or critical axe violations", async ({
  page,
  baseURL,
}) => {
  test.setTimeout(300_000);
  const paths = await sitemapPaths(baseURL ?? "http://localhost:4321");
  expect(paths.length).toBeGreaterThan(0);
  const bad: string[] = [];
  for (const path of paths) {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    for (const v of results.violations) {
      if (v.impact === "serious" || v.impact === "critical")
        bad.push(`${path}: ${v.id} (${v.nodes.length})`);
    }
  }
  expect(bad).toEqual([]);
});
