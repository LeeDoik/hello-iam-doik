import { describe, expect, test } from "vitest";
import { adrFileName, nextAdrNumber, parseAdrFrontmatter, slugify } from "./adr";

describe("nextAdrNumber", () => {
  test("starts at 1 when empty", () => expect(nextAdrNumber([])).toBe(1));
  test("takes max + 1, ignoring non-adr files", () => {
    expect(nextAdrNumber(["README.md", "0001-a.md", "0007-b.md"])).toBe(8);
  });
});

test("slugify keeps ascii words, drops the rest", () => {
  expect(slugify("Korean unprefixed, English prefixed!")).toBe(
    "korean-unprefixed-english-prefixed",
  );
});

test("adrFileName zero-pads to 4", () => {
  expect(adrFileName(3, "Hero only 3D")).toBe("0003-hero-only-3d.md");
});

test("parseAdrFrontmatter reads title/status/date", () => {
  const md = `---\ntitle: Astro over Next.js\nstatus: accepted\ndate: 2026-09-02\n---\n\n# body`;
  expect(parseAdrFrontmatter(md)).toEqual({
    title: "Astro over Next.js",
    status: "accepted",
    date: "2026-09-02",
  });
});

test("parseAdrFrontmatter rejects unknown status", () => {
  expect(() => parseAdrFrontmatter(`---\ntitle: x\nstatus: maybe\ndate: 2026-01-01\n---`)).toThrow(
    /status/,
  );
});
