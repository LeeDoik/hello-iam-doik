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

  test("only the landing page ships scripts other than the print button", () => {
    const html = (p: string) => readFileSync(join(process.cwd(), "dist", p), "utf8");
    expect((html("projects/sample-project/index.html").match(/<script/g) ?? []).length).toBe(0);
    expect((html("colophon/index.html").match(/<script/g) ?? []).length).toBe(0);
    expect((html("resume/index.html").match(/<script/g) ?? []).length).toBe(1);
  });
});
