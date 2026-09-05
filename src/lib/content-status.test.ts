import { expect, test } from "vitest";
import { formatTable, statusRows } from "./content-status";

test("statusRows reads heart-of-steel", () => {
  const rows = statusRows();
  const s = rows.find((r) => r.slug === "heart-of-steel");
  expect(s).toMatchObject({ hasEn: true, screens: 2, metrics: 3, metricsWithEvidence: 2 });
});

test("formatTable is one line per project", () => {
  const out = formatTable([
    { slug: "a", hasEn: false, screens: 2, metrics: 0, metricsWithEvidence: 0 },
  ]);
  expect(out.split("\n")).toHaveLength(2); // header + 1 row
  expect(out).toContain("a");
});
