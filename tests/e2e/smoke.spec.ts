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

test("llms.txt is served as plain text starting with a heading", async ({ request }) => {
  const res = await request.get("/llms.txt");
  expect(res.status()).toBe(200);
  expect((await res.text()).startsWith("# ")).toBe(true);
});

test("hero canvas respects reduced motion and the quality toggle", async ({ browser }) => {
  const reduced = await browser.newContext({ reducedMotion: "reduce" });
  const p1 = await reduced.newPage();
  const requestedUrls: string[] = [];
  p1.on("request", (req) => requestedUrls.push(req.url()));
  await p1.goto("/");
  await expect(p1.locator("#hero canvas")).toHaveAttribute("data-quality", "off");
  expect(requestedUrls.some((u) => /hero-scene/.test(u))).toBe(false);
  await expect(p1.getByRole("button", { name: /배경 효과/ })).toBeDisabled();
  await reduced.close();

  const normal = await browser.newContext({ reducedMotion: "no-preference" });
  const p2 = await normal.newPage();
  await p2.goto("/");
  await expect(p2.locator("#hero canvas")).toHaveAttribute("data-quality", /high|low/);
  const toggle = p2.getByRole("button", { name: /배경 효과/ });
  await expect(toggle).toHaveText(/높음|낮음|끔/);

  // 포인터가 제목 위에 있어도 글로우 아래에서 텍스트 대비가 유지되는지, 어두운 스크림으로 확인한다.
  const h1 = p2.getByRole("heading", { level: 1 });
  const h1Box = await h1.boundingBox();
  if (h1Box) {
    await p2.mouse.move(h1Box.x + h1Box.width / 2, h1Box.y + h1Box.height / 2);
    await p2.waitForTimeout(300);
    await h1.screenshot();
    const scrimBg = await p2.evaluate(() => {
      const heading = document.querySelector("#hero h1");
      const scrim = heading?.parentElement;
      return scrim ? getComputedStyle(scrim).backgroundColor : "";
    });
    expect(scrimBg).not.toBe("rgba(0, 0, 0, 0)");
    expect(scrimBg).not.toBe("");
  }

  // 캔버스가 섹션 배경 위에 그려지는지(스택 컨텍스트) 히트테스트로 검증한다.
  const box = await p2.locator("#hero canvas").boundingBox();
  if (box) {
    const x = box.x + box.width - 20;
    const y = box.y + box.height - 20;
    const tag = await p2.evaluate(
      ([px, py]: [number, number]) => document.elementFromPoint(px, py)?.tagName,
      [x, y] as [number, number],
    );
    expect(tag).toBe("CANVAS");
  }

  await toggle.click(); // high → low
  await expect(toggle).toHaveText(/낮음/);
  await toggle.click(); // low → off
  await expect(p2.locator("#hero canvas")).toHaveAttribute("data-quality", "off");
  await p2.reload();
  await expect(p2.locator("#hero canvas")).toHaveAttribute("data-quality", "off"); // localStorage
  await normal.close();
});
