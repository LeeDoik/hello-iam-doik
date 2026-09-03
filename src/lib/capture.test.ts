import { describe, expect, test } from "vitest";
import { captureSchema } from "../content/capture-schema";
import { isStale, metaYamlSnippet, planShots, sidecarPath, staleReport } from "./capture";

const config = captureSchema.parse({
  base: "https://example.dev",
  shots: [
    { name: "01-home", route: "/", devices: ["desktop", "mobile"] },
    { name: "02-chat", route: "/chat/", devices: ["mobile"], waitFor: "[data-ready]" },
  ],
});

describe("captureSchema", () => {
  test("requires base or local", () => {
    expect(() =>
      captureSchema.parse({ shots: [{ name: "01-a", route: "/", devices: ["desktop"] }] }),
    ).toThrow(/base 또는 local/);
  });
  test("rejects credential-looking env placeholders in login steps", () => {
    expect(() =>
      captureSchema.parse({
        base: "https://x.dev",
        login: { path: "/login", steps: [{ fill: "#pw", value: "${ADMIN_PASSWORD}" }] },
        shots: [{ name: "01-a", route: "/", devices: ["desktop"] }],
      }),
    ).toThrow();
  });
  test("rejects bad shot names", () => {
    expect(() =>
      captureSchema.parse({
        base: "https://x.dev",
        shots: [{ name: "home", route: "/", devices: ["desktop"] }],
      }),
    ).toThrow();
  });
});

describe("planShots", () => {
  test("expands devices and builds file names and urls", () => {
    expect(planShots(config, "https://example.dev")).toEqual([
      {
        file: "screens/01-home@desktop.png",
        url: "https://example.dev/",
        device: "desktop",
        waitFor: undefined,
      },
      {
        file: "screens/01-home@mobile.png",
        url: "https://example.dev/",
        device: "mobile",
        waitFor: undefined,
      },
      {
        file: "screens/02-chat@mobile.png",
        url: "https://example.dev/chat/",
        device: "mobile",
        waitFor: "[data-ready]",
      },
    ]);
  });
});

test("sidecarPath", () =>
  expect(sidecarPath("screens/01-home@desktop.png")).toBe("screens/01-home@desktop.json"));

describe("stale", () => {
  test("isStale by day difference", () => {
    expect(isStale("2026-06-01", "2026-09-03", 90)).toBe(true);
    expect(isStale("2026-08-01", "2026-09-03", 90)).toBe(false);
  });
  test("staleReport lists only stale files", () => {
    const r = staleReport(
      [
        { file: "a.png", capturedAt: "2026-01-01" },
        { file: "b.png", capturedAt: "2026-09-01" },
      ],
      "2026-09-03",
      90,
    );
    expect(r).toEqual(["a.png (captured 2026-01-01)"]);
  });
});

test("metaYamlSnippet quotes dates and keeps order", () => {
  const y = metaYamlSnippet(
    [{ file: "screens/01-home@desktop.png", device: "desktop" }],
    "2026-09-03",
    "abc1234",
  );
  expect(y).toContain("src: ./screens/01-home@desktop.png");
  expect(y).toContain('capturedAt: "2026-09-03"');
  expect(y).toContain('commit: "abc1234"');
  expect(y).toContain("device: desktop");
});
