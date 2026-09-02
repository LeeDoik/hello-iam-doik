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
  await expect(page.locator("article[id^='000']").first()).toBeVisible();
});
