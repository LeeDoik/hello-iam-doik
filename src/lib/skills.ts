import type { SkillGroup } from "../content/schemas";

export type SkillRow = {
  id: string;
  name: string;
  group: SkillGroup;
  builtWithIt: string;
  projectSlugs: string[];
};

const GROUP_ORDER: SkillGroup[] = ["frontend", "ai", "backend", "tooling"];

export function groupSkills(rows: SkillRow[]): { group: SkillGroup; skills: SkillRow[] }[] {
  return GROUP_ORDER.map((group) => ({
    group,
    skills: rows.filter((r) => r.group === group),
  })).filter((g) => g.skills.length > 0);
}
