import { existsSync } from "node:fs";
import { join } from "node:path";
import { z } from "astro/zod";
import { projectSchema } from "../content/schemas";
import { CONTENT_ROOT, listProjectSlugs, projectDir, readYaml, storyPath } from "./content-files";

export type ProjectStatusRow = {
  slug: string;
  hasEn: boolean;
  screens: number;
  metrics: number;
  metricsWithEvidence: number;
};

export function statusRows(root: string = CONTENT_ROOT): ProjectStatusRow[] {
  return listProjectSlugs(root).map((slug) => {
    const data = projectSchema(() => z.string()).parse(
      readYaml(join(projectDir(slug, root), "meta.yaml")),
    );
    return {
      slug,
      hasEn: existsSync(storyPath(slug, "en", root)),
      screens: data.screens.length,
      metrics: data.metrics.length,
      metricsWithEvidence: data.metrics.filter((m) => m.evidence).length,
    };
  });
}

export function formatTable(rows: ProjectStatusRow[]): string {
  const head = "slug | en.md | screens | metrics | with evidence";
  return [
    head,
    ...rows.map(
      (r) =>
        `${r.slug} | ${r.hasEn ? "yes" : "NO"} | ${r.screens} | ${r.metrics} | ${r.metricsWithEvidence}`,
    ),
  ].join("\n");
}
