import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, test } from "vitest";

const TOTAL_BUDGET = 250 * 1024;
const CHUNK_BUDGET = 200 * 1024;
const dir = join(process.cwd(), "dist", "_astro");

describe("client js budget (run after pnpm build)", () => {
  test("dist/_astro exists", () => expect(existsSync(dir), "run pnpm build first").toBe(true));

  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".js")) : [];
  const sizes = files.map((f) => ({ f, gz: gzipSync(readFileSync(join(dir, f))).length }));

  test("gzip total is within budget", () => {
    const total = sizes.reduce((a, s) => a + s.gz, 0);
    console.info(
      sizes.map((s) => `${s.f}: ${(s.gz / 1024).toFixed(1)}KB`).join("\n"),
      `\ntotal ${(total / 1024).toFixed(1)}KB`,
    );
    expect(total).toBeLessThanOrEqual(TOTAL_BUDGET);
  });

  test("no single chunk exceeds the hero budget", () => {
    for (const s of sizes) expect(s.gz, s.f).toBeLessThanOrEqual(CHUNK_BUDGET);
  });

  test("non-landing pages only ship the QualityToggle hydration script(s)", () => {
    // QualityToggle (client:idle) is in the Header, so it hydrates on every page. That adds a
    // fixed number of <script> tags (the astro:idle loader + the astro-island hydrator) beyond
    // whatever a page's own islands need. Pin the actual counts here so a regression that leaks
    // extra client JS onto a non-landing page fails loudly.
    const html = (p: string) => readFileSync(join(process.cwd(), "dist", p), "utf8");
    expect((html("projects/heart-of-steel/index.html").match(/<script/g) ?? []).length).toBe(2);
    expect((html("colophon/index.html").match(/<script/g) ?? []).length).toBe(2);
    // resume/index.html also carries its own inline print-button script (Task 4), so 2 + 1 = 3.
    expect((html("resume/index.html").match(/<script/g) ?? []).length).toBe(3);
  });

  test("the hero/three chunk is reachable only from the landing page", () => {
    const heroFile = files.find((f) => f.startsWith("hero-scene."));
    expect(heroFile, "hero-scene chunk should exist once the hero island is built").toBeTruthy();
    if (!heroFile) return;

    // hero-scene.js is never referenced directly from any HTML — Hero3D.tsx loads it via a
    // dynamic import() so Vite only reaches it through the Hero3D chunk's own module graph.
    // So the real assertion is: the chunk that *does* dynamically import hero-scene (Hero3D.js)
    // is only shipped on the landing pages (ko `/` and en `/en/`), and nowhere else.
    const heroLoader = files.find((f) => f.startsWith("Hero3D."));
    expect(heroLoader, "Hero3D chunk should exist and dynamically import hero-scene").toBeTruthy();
    if (!heroLoader) return;
    expect(readFileSync(join(dir, heroLoader), "utf8")).toContain(heroFile);

    const html = (p: string) => readFileSync(join(process.cwd(), "dist", p), "utf8");
    expect(html("index.html")).toContain(heroLoader);
    expect(html("en/index.html")).toContain(heroLoader);
    expect(html("projects/heart-of-steel/index.html")).not.toContain(heroLoader);
    expect(html("colophon/index.html")).not.toContain(heroLoader);
    expect(html("resume/index.html")).not.toContain(heroLoader);
  });
});
