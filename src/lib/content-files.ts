import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import type { Locale } from "../i18n/locales";

export const CONTENT_ROOT = "content";

export function projectDir(slug: string, root: string = CONTENT_ROOT): string {
  return join(root, "projects", slug).replaceAll("\\", "/");
}

export function storyPath(slug: string, locale: Locale, root: string = CONTENT_ROOT): string {
  return `${projectDir(slug, root)}/${locale}.md`;
}

export function listProjectSlugs(root: string = CONTENT_ROOT): string[] {
  return readdirSync(join(root, "projects"), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

export function readYaml<T = unknown>(file: string): T {
  return parse(readFileSync(file, "utf8")) as T;
}
