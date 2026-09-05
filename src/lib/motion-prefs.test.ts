import { describe, expect, test } from "vitest";
import { decideQuality, frameInterval, renderScale } from "./motion-prefs";

const fast = { reducedMotion: false, hardwareConcurrency: 8, deviceMemory: 8, webgl: true };

describe("decideQuality", () => {
  test("reduced motion always wins", () =>
    expect(decideQuality({ ...fast, reducedMotion: true }, "high")).toBe("off"));
  test("stored preference wins over device signals", () => {
    expect(decideQuality({ ...fast, hardwareConcurrency: 2 }, "high")).toBe("high");
    expect(decideQuality(fast, "off")).toBe("off");
  });
  test("ignores garbage in storage", () => expect(decideQuality(fast, "ultra")).toBe("high"));
  test("no webgl → off", () => expect(decideQuality({ ...fast, webgl: false }, null)).toBe("off"));
  test("low-end signals → low", () => {
    expect(decideQuality({ ...fast, hardwareConcurrency: 4 }, null)).toBe("low");
    expect(decideQuality({ ...fast, deviceMemory: 4 }, null)).toBe("low");
    expect(
      decideQuality({ ...fast, hardwareConcurrency: undefined, deviceMemory: undefined }, null),
    ).toBe("high");
  });
});

test("renderScale / frameInterval", () => {
  expect(renderScale("off")).toBe(0);
  expect(renderScale("low")).toBe(0.5);
  expect(renderScale("high")).toBe(1);
  expect(frameInterval("low")).toBeGreaterThan(frameInterval("high"));
  expect(frameInterval("off")).toBe(Number.POSITIVE_INFINITY);
});
