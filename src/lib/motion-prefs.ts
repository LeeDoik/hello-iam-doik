export type Quality = "off" | "low" | "high";
export const QUALITY_KEY = "hero-quality";
export const SETTLED_KEY = "__heroQualitySettled";

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

// Hero3D dispatches "hero-quality-settled" before QualityToggle (client:idle) can
// subscribe. Stash the value on window so a late-mounting toggle can still read it.
export function rememberSettled(q: Quality): void {
  if (typeof window === "undefined") return;
  (window as unknown as Record<string, unknown>)[SETTLED_KEY] = q;
}

export function readSettled(): Quality | undefined {
  if (typeof window === "undefined") return undefined;
  const v = (window as unknown as Record<string, unknown>)[SETTLED_KEY];
  return v === "off" || v === "low" || v === "high" ? v : undefined;
}
