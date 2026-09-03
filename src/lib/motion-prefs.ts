export type Quality = "off" | "low" | "high";
export const QUALITY_KEY = "hero-quality";
export const QUALITIES: readonly Quality[] = ["high", "low", "off"];

export type DeviceSignals = {
  reducedMotion: boolean;
  hardwareConcurrency?: number | undefined;
  deviceMemory?: number | undefined;
  webgl: boolean;
};

function isQuality(x: unknown): x is Quality {
  return x === "off" || x === "low" || x === "high";
}

export function decideQuality(signals: DeviceSignals, stored: string | null): Quality {
  if (signals.reducedMotion) return "off";
  if (isQuality(stored)) return stored;
  if (!signals.webgl) return "off";
  const lowEnd = (signals.hardwareConcurrency ?? 8) <= 4 || (signals.deviceMemory ?? 8) <= 4;
  return lowEnd ? "low" : "high";
}

export function renderScale(q: Quality): number {
  return q === "off" ? 0 : q === "low" ? 0.5 : 1;
}

export function frameInterval(q: Quality): number {
  return q === "off" ? Number.POSITIVE_INFINITY : q === "low" ? 33 : 16;
}

export function nextQuality(q: Quality): Quality {
  return q === "high" ? "low" : q === "low" ? "off" : "high";
}
