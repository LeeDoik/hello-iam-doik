export async function sitemapPaths(baseURL: string): Promise<string[]> {
  const xml = await (await fetch(new URL("/sitemap-0.xml", baseURL))).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1] ?? "").pathname);
}
