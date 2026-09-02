export function parseHashGroup(hash: string, groups: readonly string[]): string | null {
  const m = /^#stack=([a-z]+)$/.exec(hash);
  const g = m?.[1];
  return g && groups.includes(g) ? g : null;
}

export function toHash(group: string | null): string {
  return group ? `#stack=${group}` : "";
}

export function visibleSlugs(
  cards: { slug: string; groups: string[] }[],
  group: string | null,
): string[] {
  return cards.filter((c) => group === null || c.groups.includes(group)).map((c) => c.slug);
}
