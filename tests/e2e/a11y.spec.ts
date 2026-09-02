import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { sitemapPaths } from "./sitemap";

test("every page in the sitemap has no serious or critical axe violations", async ({
  page,
  baseURL,
}) => {
  const paths = await sitemapPaths(baseURL ?? "http://localhost:4321");
  expect(paths.length).toBeGreaterThan(0);
  for (const path of paths) {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(
      bad.map((v) => `${path}: ${v.id} (${v.nodes.length})`),
      path,
    ).toEqual([]);
  }
});
