export type LlmsInput = {
  siteName: string;
  site: string;
  tagline: string;
  projects: { title: string; summary: string; url: string; repo: string }[];
  adrs: { title: string; url: string }[];
};

export function llmsTxt(i: LlmsInput): string {
  return [
    `# ${i.siteName}`,
    "",
    `> ${i.tagline}`,
    "",
    `Site: ${i.site}`,
    "",
    "## Projects",
    ...i.projects.map((p) => `- [${p.title}](${p.url}): ${p.summary} (repo: ${p.repo})`),
    "",
    "## Decisions",
    ...i.adrs.map((a) => `- [${a.title}](${a.url})`),
    "",
  ].join("\n");
}
