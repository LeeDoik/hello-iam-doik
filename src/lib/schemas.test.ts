import { z } from "astro/zod";
import { describe, expect, test } from "vitest";
import { experienceSchema, profileSchema, projectSchema, skillSchema } from "../content/schemas";

const stringImage = () => z.string();
const stringRef = () => z.string();
const L = (ko: string, en = ko) => ({ ko, en });

const validProject = {
  title: L("샘플", "Sample"),
  summary: L("한 줄 요약", "One line"),
  status: "live",
  period: { from: "2026-01-01", to: "2026-03-01" },
  role: { teamSize: 1, owned: L("전부", "Everything") },
  stack: ["astro"],
  links: { repo: "https://github.com/x/y" },
  metrics: [
    {
      label: L("LCP"),
      after: "1.2",
      unit: "s",
      method: L("Lighthouse 3회 중앙값", "median of 3 Lighthouse runs"),
    },
  ],
  screens: [
    {
      src: "./screens/01-home@desktop.png",
      alt: L("홈", "Home"),
      device: "desktop",
      capturedAt: "2026-09-02",
    },
  ],
  featured: true,
  order: 1,
  updatedAt: "2026-09-02",
};

describe("projectSchema", () => {
  const schema = projectSchema(stringImage);
  test("accepts a minimal valid project and applies defaults", () => {
    const r = schema.parse(validProject);
    expect(r.links.keyCommits).toEqual([]);
    expect(r.ai).toBeUndefined();
  });
  test("requires at least one screen", () => {
    expect(() => schema.parse({ ...validProject, screens: [] })).toThrow();
  });
  test("rejects a bad date", () => {
    expect(() => schema.parse({ ...validProject, updatedAt: "2026/09/02" })).toThrow();
  });
  test("rejects more than four metrics", () => {
    const [m] = validProject.metrics;
    if (!m) throw new Error("expected a metric fixture");
    expect(() => schema.parse({ ...validProject, metrics: [m, m, m, m, m] })).toThrow();
  });
  test("ai block requires a judge on each eval", () => {
    const ai = {
      models: ["claude-sonnet-5"],
      evals: [{ name: "faithfulness", metric: "score", n: 50, baseline: "0.74", final: "0.86" }],
    };
    expect(() => schema.parse({ ...validProject, ai })).toThrow(/judge/);
    const [evalWithoutJudge] = ai.evals;
    if (!evalWithoutJudge) throw new Error("expected an eval fixture");
    const withJudge = { ...ai, evals: [{ ...evalWithoutJudge, judge: "llm-judge" }] };
    const parsed = schema.parse({ ...validProject, ai: withJudge });
    const [firstEval] = parsed.ai?.evals ?? [];
    expect(firstEval?.judge).toBe("llm-judge");
  });
  test("localized strings must be present in both languages", () => {
    expect(() => schema.parse({ ...validProject, title: { ko: "만" } })).toThrow();
  });
});

describe("skillSchema", () => {
  test("requires at least one project reference and a builtWithIt sentence", () => {
    const s = skillSchema(stringRef);
    const base = {
      id: "react",
      name: "React",
      group: "frontend",
      builtWithIt: L("x"),
      since: 2024,
    };
    expect(() => s.parse({ ...base, projects: [] })).toThrow();
    expect(s.parse({ ...base, projects: ["sample-project"] }).id).toBe("react");
  });
});

test("experienceSchema caps bullets at 4", () => {
  const b = L("b");
  const e = {
    id: "x",
    kind: "work",
    org: L("o"),
    role: L("r"),
    from: "2025-01-01",
    bullets: [b, b, b, b, b],
  };
  expect(() => experienceSchema.parse(e)).toThrow();
});

test("profileSchema validates email", () => {
  const p = {
    name: L("n"),
    tagline: L("t"),
    bio: L("b"),
    location: L("l"),
    email: "not-an-email",
    links: { github: "https://github.com/x" },
  };
  expect(() => profileSchema.parse(p)).toThrow();
});
