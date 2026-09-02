import { expect, test } from "vitest";
import { formatPeriod } from "./dates";

test("closed period", () =>
  expect(formatPeriod("2026-01-01", "2026-03-15", "ko")).toBe("2026.01 – 2026.03"));
test("open period ko/en", () => {
  expect(formatPeriod("2026-01-01", undefined, "ko")).toBe("2026.01 – 현재");
  expect(formatPeriod("2026-01-01", undefined, "en")).toBe("2026.01 – present");
});
