export type AdrStatus = "proposed" | "accepted" | "deprecated" | "superseded";
const STATUSES: readonly AdrStatus[] = ["proposed", "accepted", "deprecated", "superseded"];
const ADR_FILE = /^(\d{4})-.*\.md$/;

export function nextAdrNumber(existing: string[]): number {
  const nums = existing
    .map((f) => ADR_FILE.exec(f)?.[1])
    .filter((n): n is string => n !== undefined);
  return nums.length === 0 ? 1 : Math.max(...nums.map(Number)) + 1;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function adrFileName(n: number, title: string): string {
  return `${String(n).padStart(4, "0")}-${slugify(title)}.md`;
}

export function parseAdrFrontmatter(md: string): {
  title: string;
  status: AdrStatus;
  date: string;
} {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(md);
  if (!m) throw new Error("ADR is missing frontmatter");
  const fields = new Map<string, string>();
  for (const line of (m[1] ?? "").split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) fields.set(line.slice(0, i).trim(), line.slice(i + 1).trim());
  }
  const title = fields.get("title");
  const status = fields.get("status");
  const date = fields.get("date");
  if (!title || !status || !date) throw new Error("ADR frontmatter needs title, status, date");
  if (!STATUSES.includes(status as AdrStatus)) throw new Error(`Unknown ADR status: ${status}`);
  return { title, status: status as AdrStatus, date };
}
