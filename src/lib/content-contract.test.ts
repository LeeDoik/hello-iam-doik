import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { z } from "astro/zod";
import { describe, expect, test } from "vitest";
import { experienceSchema, profileSchema, projectSchema, skillSchema } from "../content/schemas";
import { LOCALES } from "../i18n/locales";
import { CONTENT_ROOT, listProjectSlugs, projectDir, readYaml, storyPath } from "./content-files";
import { missingHeadings } from "./story";

const MAX_SCREEN_BYTES = 1.5 * 1024 * 1024;
const slugs = listProjectSlugs();
const asString = () => z.string();
const projects = slugs.map((slug) => ({
  slug,
  data: projectSchema(asString).parse(readYaml(join(projectDir(slug), "meta.yaml"))),
}));

test("there is at least one project", () => expect(slugs.length).toBeGreaterThan(0));

describe("every project", () => {
  test.each(slugs)("%s has ko.md with the four required headings", (slug) => {
    const p = storyPath(slug, "ko");
    expect(existsSync(p), `${p} is required`).toBe(true);
    expect(missingHeadings(readFileSync(p, "utf8"), "ko")).toEqual([]);
  });

  test.each(slugs)("%s en.md, when present, has the four required headings", (slug) => {
    const p = storyPath(slug, "en");
    if (existsSync(p)) expect(missingHeadings(readFileSync(p, "utf8"), "en")).toEqual([]);
  });

  test.each(projects)("$slug screenshots exist and are under 1.5 MB", ({ slug, data }) => {
    for (const s of data.screens) {
      const file = join(projectDir(slug), s.src as string);
      expect(existsSync(file), file).toBe(true);
      expect(statSync(file).size, `${file} too large`).toBeLessThanOrEqual(MAX_SCREEN_BYTES);
    }
  });
});

describe("skills.yaml", () => {
  const skills = z.array(skillSchema(asString)).parse(readYaml(join(CONTENT_ROOT, "skills.yaml")));
  const skillIds = new Set(skills.map((s) => s.id));

  test("every skill references existing projects", () => {
    for (const s of skills)
      for (const p of s.projects) expect(slugs, `${s.id} → ${p}`).toContain(p);
  });

  test("every project stack key is a skill id", () => {
    for (const { slug, data } of projects)
      for (const k of data.stack) expect(skillIds.has(k), `${slug}: ${k}`).toBe(true);
  });
});

test("profile.yaml and experience.yaml validate", () => {
  profileSchema.parse(readYaml(join(CONTENT_ROOT, "profile.yaml")));
  z.array(experienceSchema).parse(readYaml(join(CONTENT_ROOT, "experience.yaml")));
});

test("untranslated backlog is printed, not failed", () => {
  const backlog = slugs.filter((s) => !existsSync(storyPath(s, "en")));
  if (backlog.length > 0) console.info(`en.md missing for: ${backlog.join(", ")}`);
  expect(LOCALES).toContain("en");
});
