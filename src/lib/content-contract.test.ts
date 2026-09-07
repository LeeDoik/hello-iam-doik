import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { z } from "astro/zod";
import { describe, expect, test } from "vitest";
import { experienceSchema, profileSchema, projectSchema, skillSchema } from "../content/schemas";
import { LOCALES } from "../i18n/locales";
import { sidecarPath } from "./capture";
import { CONTENT_ROOT, listProjectSlugs, projectDir, readYaml, storyPath } from "./content-files";
import { PLACEHOLDER_RE, withoutPlaceholders } from "./placeholders";
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

test.each(projects)("$slug sidecars agree with meta.yaml", ({ slug, data }) => {
  for (const s of data.screens) {
    const png = join(projectDir(slug), s.src as string);
    const side = sidecarPath(png);
    if (!existsSync(side)) {
      console.info(`no sidecar for ${png} (captured outside the script)`);
      continue;
    }
    const meta = JSON.parse(readFileSync(side, "utf8")) as {
      capturedAt: string;
      sourceCommit?: string;
    };
    expect(meta.capturedAt, side).toBe(s.capturedAt);
    if (s.commit && meta.sourceCommit)
      expect(
        meta.sourceCommit.startsWith(s.commit) || s.commit.startsWith(meta.sourceCommit),
        side,
      ).toBe(true);
  }
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

describe("no placeholder reaches a rendered page", () => {
  // 페이지가 실제로 읽는 문자열만 본다: experience는 getExperience()와 같은 필터를 거친 뒤,
  // profile과 projects/*/meta.yaml은 필터 없이 그대로 렌더되므로 원문 그대로.
  const localizedStrings = (v: unknown, path: string, out: [string, string][]): void => {
    if (typeof v === "string") out.push([path, v]);
    else if (Array.isArray(v))
      for (const [i, x] of v.entries()) localizedStrings(x, `${path}[${i}]`, out);
    else if (v && typeof v === "object")
      for (const [k, x] of Object.entries(v)) localizedStrings(x, `${path}.${k}`, out);
  };
  const offenders = (v: unknown, path: string) => {
    const out: [string, string][] = [];
    localizedStrings(v, path, out);
    return out.filter(([, s]) => PLACEHOLDER_RE.test(s)).map(([p, s]) => `${p}: ${s}`);
  };

  test("experience.yaml after the getExperience() filter", () => {
    const raw = z.array(experienceSchema).parse(readYaml(join(CONTENT_ROOT, "experience.yaml")));
    expect(offenders(withoutPlaceholders(raw), "experience")).toEqual([]);
  });

  test("the filter drops a placeholder bullet or entry, and keeps real ones", () => {
    const real = {
      id: "x",
      kind: "work" as const,
      org: { ko: "회사", en: "Company" },
      role: { ko: "역할", en: "Role" },
      from: "2026-01-01",
      bullets: [
        { ko: "실제 불릿", en: "Real bullet" },
        { ko: "[채워 주세요: 수상 결과]", en: "[Fill in: result]" },
      ],
    };
    const ghost = { ...real, id: "y", org: { ko: "[채워 주세요: 학교]", en: "[Fill in: school]" } };
    const kept = withoutPlaceholders([real, ghost]);
    expect(kept.map((e) => e.id)).toEqual(["x"]);
    expect(kept[0]?.bullets).toEqual([{ ko: "실제 불릿", en: "Real bullet" }]);
  });

  test("profile.yaml", () => {
    expect(offenders(readYaml(join(CONTENT_ROOT, "profile.yaml")), "profile")).toEqual([]);
  });

  test.each(projects)("$slug meta.yaml", ({ slug, data }) => {
    expect(offenders(data, slug)).toEqual([]);
  });
});

test("untranslated backlog is printed, not failed", () => {
  const backlog = slugs.filter((s) => !existsSync(storyPath(s, "en")));
  if (backlog.length > 0) console.info(`en.md missing for: ${backlog.join(", ")}`);
  expect(LOCALES).toContain("en");
});
