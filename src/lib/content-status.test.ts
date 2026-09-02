import { expect, test } from "vitest";
import { formatTable, statusRows } from "./content-status";

test("statusRows reads the sample project", () => {
  const rows = statusRows();
  const s = rows.find((r) => r.slug === "sample-project");
  expect(s).toMatchObject({ hasEn: true, screens: 1, metrics: 1, metricsWithEvidence: 0 });
});

test("formatTable is one line per project", () => {
  const out = formatTable([
    { slug: "a", hasEn: false, screens: 2, metrics: 0, metricsWithEvidence: 0 },
  ]);
  expect(out.split("\n")).toHaveLength(2); // header + 1 row
  expect(out).toContain("a");
});
