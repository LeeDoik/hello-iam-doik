import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  LOCAL_FONT_BASE,
  PRETENDARD_CDN,
  subsetCssToLocal,
  subsetFileNames,
} from "../src/lib/fonts";

async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

const publicDir = join(process.cwd(), "public", "fonts", "pretendard");
const subsetDir = join(publicDir, "woff2-dynamic-subset");
const ogDir = join(process.cwd(), "src", "assets", "fonts", "og");
mkdirSync(subsetDir, { recursive: true });
mkdirSync(ogDir, { recursive: true });

const cssUrl = `${PRETENDARD_CDN}/web/variable/pretendardvariable-dynamic-subset.css`;
const css = new TextDecoder().decode(await fetchBytes(cssUrl));
writeFileSync(join(publicDir, "pretendard.css"), subsetCssToLocal(css));
writeFileSync(join(publicDir, "LICENSE.txt"), await fetchBytes(`${PRETENDARD_CDN}/LICENSE.txt`));

const names = subsetFileNames(css);
for (const name of names) {
  writeFileSync(
    join(subsetDir, name),
    await fetchBytes(`${PRETENDARD_CDN}/web/variable/woff2-dynamic-subset/${name}`),
  );
}
for (const weight of ["Regular", "Bold"]) {
  writeFileSync(
    join(ogDir, `Pretendard-${weight}.woff`),
    await fetchBytes(`${PRETENDARD_CDN}/web/static/woff/Pretendard-${weight}.woff`),
  );
}
console.log(`vendored ${names.length} subset files to ${LOCAL_FONT_BASE}, 2 woff files for OG`);
