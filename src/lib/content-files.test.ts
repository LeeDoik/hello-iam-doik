import { expect, test } from "vitest";
import { listProjectSlugs, projectDir, readYaml, storyPath } from "./content-files";

test("lists project folders under content/projects", () => {
  expect(listProjectSlugs()).toContain("sample-project");
});

test("readYaml parses meta.yaml", () => {
  const meta = readYaml<{ title: { ko: string } }>(`${projectDir("sample-project")}/meta.yaml`);
  expect(meta.title.ko).toBe("샘플 프로젝트");
});

test("storyPath", () => {
  expect(storyPath("x", "en")).toBe("content/projects/x/en.md");
});
