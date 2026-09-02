import { describe, expect, test } from "vitest";
import { parseHashGroup, toHash, visibleSlugs } from "./filter";

const groups = ["frontend", "ai", "backend", "tooling"] as const;

describe("hash", () => {
  test("round trip", () => {
    expect(parseHashGroup(toHash("ai"), groups)).toBe("ai");
    expect(toHash(null)).toBe("");
  });
  test("unknown or empty is null", () => {
    expect(parseHashGroup("#stack=nope", groups)).toBeNull();
    expect(parseHashGroup("", groups)).toBeNull();
    expect(parseHashGroup("#projects", groups)).toBeNull();
  });
});

test("visibleSlugs", () => {
  const cards = [
    { slug: "a", groups: ["frontend"] },
    { slug: "b", groups: ["frontend", "ai"] },
  ];
  expect(visibleSlugs(cards, null)).toEqual(["a", "b"]);
  expect(visibleSlugs(cards, "ai")).toEqual(["b"]);
  expect(visibleSlugs(cards, "backend")).toEqual([]);
});
