import type { SkillGroup } from "../content/schemas";
import type { UIKey } from "../i18n/ui";

export type SkillRow = {
  id: string;
  name: string;
  group: SkillGroup;
  builtWithIt: string;
  projectSlugs: string[];
};

const GROUP_ORDER: SkillGroup[] = ["frontend", "ai", "backend", "tooling"];

export const GROUP_UI_KEY = {
  frontend: "group.frontend",
  ai: "group.ai",
  backend: "group.backend",
  tooling: "group.tooling",
} as const satisfies Record<SkillGroup, UIKey>;

export function groupSkills(rows: SkillRow[]): { group: SkillGroup; skills: SkillRow[] }[] {
  return GROUP_ORDER.map((group) => ({
    group,
    skills: rows.filter((r) => r.group === group),
  })).filter((g) => g.skills.length > 0);
}
