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
  await page.goto("/projects/heart-of-steel/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("코드네임: 태엽새");
  await page.getByRole("link", { name: "영어로 보기" }).click();
  await expect(page).toHaveURL(/\/en\/projects\/heart-of-steel\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Heart of Steel");

  // 비공개 레포는 링크 대신 상태 문구로, 공개 데모 영상은 실제 링크로 드러나야 한다.
  await page.goto("/projects/pixelarious/");
  await expect(page.getByText("저장소 비공개").first()).toBeVisible();
  await page.goto("/projects/heart-of-steel/");
  await expect(page.locator('a[href*="youtu.be"]').first()).toBeVisible();
});

test("filter island hides non-matching cards and is shareable via hash", async ({ page }) => {
  // heart-of-steel만 ai 그룹 스택(anthropic-sdk 등)을 갖고 있으므로 #stack=ai는 카드 1장만 남긴다
  await page.goto("/en/#stack=ai");
  await expect(page.getByRole("radio", { name: "AI" })).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("[data-project-card]:visible")).toHaveCount(1);
  await page.getByRole("radio", { name: "All" }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator("[data-project-card]:visible")).toHaveCount(3);
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
  // reduced motion: no buttons at all, just a static note inside the hero
  await expect(p1.locator("#hero [role=group]")).toHaveCount(0);
  await expect(p1.locator("#hero").getByText(/배경 효과 · 끔/)).toBeVisible();
  await reduced.close();

  // Playwright's headless Chromium also runs on SwiftShader (software WebGL), so with no
  // stored preference the new software-renderer signal must turn the hero off — the same
  // way it does in Lighthouse CI. This is what actually proves the fix: no stored pref,
  // no hero-scene chunk request.
  const noPref = await browser.newContext({ reducedMotion: "no-preference" });
  const p0 = await noPref.newPage();
  const noPrefUrls: string[] = [];
  p0.on("request", (req) => noPrefUrls.push(req.url()));
  await p0.goto("/");
  await expect(p0.locator("#hero canvas")).toHaveAttribute("data-quality", "off");
  expect(noPrefUrls.some((u) => /hero-scene/.test(u))).toBe(false);
  await noPref.close();

  // A user who explicitly opted into a quality via the toggle keeps it, even on software WebGL.
  const opted = await browser.newContext({ reducedMotion: "no-preference" });
  await opted.addInitScript(() => localStorage.setItem("hero-quality", "high"));
  const pOpted = await opted.newPage();
  const optedUrls: string[] = [];
  pOpted.on("request", (req) => optedUrls.push(req.url()));
  await pOpted.goto("/");
  await expect(pOpted.locator("#hero canvas")).toHaveAttribute("data-quality", "high");
  expect(optedUrls.some((u) => /hero-scene/.test(u))).toBe(true);
  await opted.close();

  // Note: addInitScript re-runs on every navigation in a context (including the reload below),
  // so it's only used for the one-shot "opted" check above. Here the stored pref is set once via
  // evaluate() after the first load, then a reload picks it up — later reloads (toggle cycle)
  // are free to overwrite localStorage themselves without an init script fighting them.
  const normal = await browser.newContext({ reducedMotion: "no-preference" });
  const p2 = await normal.newPage();
  await p2.goto("/");
  await p2.evaluate(() => localStorage.setItem("hero-quality", "high"));
  await p2.reload();
  await expect(p2.locator("#hero canvas")).toHaveAttribute("data-quality", /high|low/);
  const toggle = p2.locator("#hero").getByRole("group", { name: /배경 효과/ });
  await expect(toggle.getByRole("button", { pressed: true })).toHaveText(/높음|낮음/);
  expect(await p2.locator("header button").count()).toBe(0);

  // 포인터가 제목 위에 있어도 텍스트 대비가 유지되는지: 캔버스가 본문 열 아래에서는 마스크로 투명해야 한다.
  const h1 = p2.getByRole("heading", { level: 1 });
  const h1Box = await h1.boundingBox();
  if (h1Box) {
    await p2.mouse.move(h1Box.x + h1Box.width / 2, h1Box.y + h1Box.height / 2);
    await p2.waitForTimeout(300);
    await h1.screenshot();
    const mask = await p2.evaluate(() => {
      const canvas = document.querySelector("#hero canvas");
      return canvas ? getComputedStyle(canvas).maskImage : "";
    });
    expect(mask).toContain("linear-gradient");
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

  // "끔"을 직접 고르면 캔버스가 꺼지고, 선택은 localStorage에 남는다.
  await toggle.getByRole("button", { name: "끔" }).click();
  await expect(toggle.getByRole("button", { name: "끔" })).toHaveAttribute("aria-pressed", "true");
  await expect(p2.locator("#hero canvas")).toHaveAttribute("data-quality", "off");
  await p2.reload();
  await expect(p2.locator("#hero canvas")).toHaveAttribute("data-quality", "off"); // localStorage
  await normal.close();
});
