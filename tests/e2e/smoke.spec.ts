import { expect, test } from "@playwright/test";

test("korean root renders and toggles to english on the same page", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await page.getByRole("link", { name: "영어로 보기" }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("link", { name: "View in Korean" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("project page exists in both locales and keeps the page across toggle", async ({ page }) => {
  await page.goto("/projects/sample-project/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("샘플 프로젝트");
  await page.getByRole("link", { name: "영어로 보기" }).click();
  await expect(page).toHaveURL(/\/en\/projects\/sample-project\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Sample Project");
});

test("filter island hides non-matching cards and is shareable via hash", async ({ page }) => {
  // sample-project의 stack(astro, react)은 모두 frontend 그룹이므로 필터 버튼은 All + Frontend 두 개다
  await page.goto("/en/#stack=frontend");
  await expect(page.getByRole("radio", { name: "Frontend" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(page.locator("[data-project-card]:visible")).toHaveCount(1);
  await page.getByRole("radio", { name: "All" }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator("[data-project-card]:visible")).toHaveCount(1);
});

test("resume has a print button and colophon lists ADRs", async ({ page }) => {
  await page.goto("/resume/");
  await expect(page.locator("[data-print]")).toBeVisible();
  await page.goto("/colophon/");
  const adrLinks = page.locator('a[href*="/colophon/000"]');
  expect(await adrLinks.count()).toBeGreaterThanOrEqual(6);
  await adrLinks.first().click();
  await expect(page.locator("article h1")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveCount(1);
});

test("hero canvas respects reduced motion and the quality toggle", async ({ browser }) => {
  const reduced = await browser.newContext({ reducedMotion: "reduce" });
  const p1 = await reduced.newPage();
  await p1.goto("/");
  await expect(p1.locator("#hero canvas")).toHaveAttribute("data-quality", "off");
  await reduced.close();

  const normal = await browser.newContext({ reducedMotion: "no-preference" });
  const p2 = await normal.newPage();
  await p2.goto("/");
  await expect(p2.locator("#hero canvas")).toHaveAttribute("data-quality", /high|low/);
  const toggle = p2.getByRole("button", { name: /배경 효과/ });
  await toggle.click(); // high → low
  await toggle.click(); // low → off
  await expect(p2.locator("#hero canvas")).toHaveAttribute("data-quality", "off");
  await p2.reload();
  await expect(p2.locator("#hero canvas")).toHaveAttribute("data-quality", "off"); // localStorage
  await normal.close();
});
