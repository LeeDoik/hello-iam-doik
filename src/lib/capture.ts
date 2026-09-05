import type { CaptureConfig, Device } from "../content/capture-schema";

export const VIEWPORTS = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 2, isMobile: false, hasTouch: false },
  mobile: { width: 393, height: 852, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
} as const;

export type Sidecar = {
  capturedAt: string;
  sourceCommit?: string | undefined;
  url: string;
  viewport: { width: number; height: number; deviceScaleFactor: number };
  playwright: string;
};

export type PlannedShot = {
  file: string;
  url: string;
  device: Device;
  waitFor?: string | undefined;
};

export function planShots(config: CaptureConfig, baseUrl: string): PlannedShot[] {
  const base = baseUrl.replace(/\/$/, "");
  return config.shots.flatMap((s) =>
    s.devices.map((device) => ({
      file: `screens/${s.name}@${device}.png`,
      url: `${base}${s.route}`,
      device,
      waitFor: s.waitFor,
    })),
  );
}

// 스크립트가 찍는 캡처는 항상 .png이지만 screens[]에는 손으로 그린 .svg도 들어온다.
// 확장자를 갈아 끼우기만 하면 .svg가 자기 자신을 사이드카로 가리켜 JSON 파싱이 터지므로,
// .png가 아닌 경로에는 확장자를 덧붙여 "존재하지 않는 사이드카"를 돌려준다.
export function sidecarPath(shotPath: string): string {
  return shotPath.endsWith(".png") ? shotPath.replace(/\.png$/, ".json") : `${shotPath}.json`;
}

const DAY = 86_400_000;

// 경계는 포함(>=)이므로 --stale 0은 오늘 찍은 캡처도 낡은 것으로 보고한다.
export function isStale(capturedAt: string, today: string, maxDays: number): boolean {
  return (Date.parse(today) - Date.parse(capturedAt)) / DAY >= maxDays;
}

export function staleReport(
  screens: { file: string; capturedAt: string }[],
  today: string,
  maxDays: number,
): string[] {
  return screens
    .filter((s) => isStale(s.capturedAt, today, maxDays))
    .map((s) => `${s.file} (captured ${s.capturedAt})`);
}

export function metaYamlSnippet(
  shots: { file: string; device: Device }[],
  capturedAt: string,
  commit?: string,
): string {
  return shots
    .map((s) =>
      [
        `  - src: ./${s.file}`,
        `    alt: { ko: "설명을 쓰세요", en: "Describe the screen" }`,
        `    device: ${s.device}`,
        `    capturedAt: "${capturedAt}"`,
        ...(commit ? [`    commit: "${commit}"`] : []),
      ].join("\n"),
    )
    .join("\n");
}
