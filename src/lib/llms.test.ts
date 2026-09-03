import { expect, test } from "vitest";
import { llmsTxt } from "./llms";

test("llmsTxt follows the llms.txt shape", () => {
  const out = llmsTxt({
    siteName: "Doik Lee",
    site: "https://x.dev",
    tagline: "Web & AI developer",
    projects: [
      {
        title: "Sample",
        summary: "One line",
        url: "https://x.dev/en/projects/sample/",
        repo: "https://github.com/a/b",
      },
    ],
    adrs: [
      { title: "Astro over Next.js", url: "https://x.dev/en/colophon/0001-astro-over-nextjs/" },
    ],
  });
  const lines = out.split("\n");
  expect(lines[0]).toBe("# Doik Lee");
  expect(lines[2]).toBe("> Web & AI developer");
  expect(out).toContain(
    "## Projects\n- [Sample](https://x.dev/en/projects/sample/): One line (repo: https://github.com/a/b)",
  );
  expect(out).toContain(
    "## Decisions\n- [Astro over Next.js](https://x.dev/en/colophon/0001-astro-over-nextjs/)",
  );
  expect(out.endsWith("\n")).toBe(true);
});
