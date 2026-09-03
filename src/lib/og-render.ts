import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { OG_HEIGHT, OG_WIDTH, type OgInput, ogElement } from "./og";

// 빌드 프로세스당 한 번만 읽는다. `astro build`는 항상 프로젝트 루트에서 실행되므로
// process.cwd() 기준 경로를 쓴다. `new URL(..., import.meta.url)`는 Astro의 정적 엔드포인트
// prerender 번들이 이 모듈을 dist/.prerender/chunks/로 옮기면서 상대 경로가 깨진다(Vite가
// 이 SSR 청크에서는 fs 인자로 쓰인 URL을 에셋으로 인식해 복사해주지 않기 때문).
const fontDir = join(process.cwd(), "src", "assets", "fonts", "og");
const fonts = [
  {
    name: "Pretendard",
    data: readFileSync(join(fontDir, "Pretendard-Regular.woff")),
    weight: 400 as const,
    style: "normal" as const,
  },
  {
    name: "Pretendard",
    data: readFileSync(join(fontDir, "Pretendard-Bold.woff")),
    weight: 700 as const,
    style: "normal" as const,
  },
];

export async function renderOgPng(input: OgInput): Promise<Uint8Array> {
  const svg = await satori(ogElement(input) as unknown as Parameters<typeof satori>[0], {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts,
  });
  return new Resvg(svg, { fitTo: { mode: "width", value: OG_WIDTH } }).render().asPng();
}
