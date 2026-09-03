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

export function sidecarPath(pngPath: string): string {
  return pngPath.replace(/\.png$/, ".json");
}

const DAY = 86_400_000;

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
