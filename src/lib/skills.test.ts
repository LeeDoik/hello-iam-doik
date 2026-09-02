import { expect, test } from "vitest";
import { groupSkills, type SkillRow } from "./skills";

const row = (id: string, group: SkillRow["group"]): SkillRow => ({
  id,
  name: id,
  group,
  builtWithIt: "x",
  projectSlugs: ["p"],
});

test("groups in fixed order and drops empty groups", () => {
  const g = groupSkills([
    row("vitest", "tooling"),
    row("react", "frontend"),
    row("astro", "frontend"),
  ]);
  expect(g.map((x) => x.group)).toEqual(["frontend", "tooling"]);
  expect(g[0]?.skills.map((s) => s.id)).toEqual(["react", "astro"]);
});
