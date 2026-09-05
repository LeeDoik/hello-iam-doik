import { expect, test } from "vitest";
import { listProjectSlugs, projectDir, readYaml, storyPath } from "./content-files";

test("lists project folders under content/projects", () => {
  expect(listProjectSlugs()).toContain("heart-of-steel");
});

test("readYaml parses meta.yaml", () => {
  const meta = readYaml<{ title: { ko: string } }>(`${projectDir("heart-of-steel")}/meta.yaml`);
  expect(meta.title.ko).toBe("코드네임: 태엽새 · HEART OF STEEL");
});

test("storyPath", () => {
  expect(storyPath("x", "en")).toBe("content/projects/x/en.md");
});
