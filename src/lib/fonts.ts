export const PRETENDARD_VERSION = "1.3.9";
export const PRETENDARD_CDN = `https://cdn.jsdelivr.net/npm/pretendard@${PRETENDARD_VERSION}/dist`;
export const LOCAL_FONT_BASE = "/fonts/pretendard/woff2-dynamic-subset";

const URL_RE = /url\(\.\/woff2-dynamic-subset\/([^)]+\.woff2)\)/g;

export function subsetFileNames(css: string): string[] {
  const seen = new Set<string>();
  for (const m of css.matchAll(URL_RE)) {
    const name = m[1];
    if (name) seen.add(name);
  }
  return [...seen];
}

export function subsetCssToLocal(css: string): string {
  return css.replace(URL_RE, (_, name: string) => `url(${LOCAL_FONT_BASE}/${name})`);
}
