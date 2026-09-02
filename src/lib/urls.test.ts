import { describe, expect, test } from "vitest";
import { localePath, stripLocale, swapLocale } from "./urls";

describe("localePath", () => {
  test("ko is unprefixed", () => expect(localePath("ko", "/projects/x/")).toBe("/projects/x/"));
  test("en is prefixed", () => expect(localePath("en", "/projects/x/")).toBe("/en/projects/x/"));
  test("root", () => {
    expect(localePath("ko", "/")).toBe("/");
    expect(localePath("en", "/")).toBe("/en/");
  });
  test("rejects paths without leading and trailing slash", () => {
    expect(() => localePath("ko", "projects/")).toThrow();
    expect(() => localePath("ko", "/projects")).toThrow();
  });
});

describe("stripLocale", () => {
  test("en prefix", () =>
    expect(stripLocale("/en/projects/x/")).toEqual({ locale: "en", path: "/projects/x/" }));
  test("en root", () => expect(stripLocale("/en/")).toEqual({ locale: "en", path: "/" }));
  test("ko", () =>
    expect(stripLocale("/projects/x/")).toEqual({ locale: "ko", path: "/projects/x/" }));
  test("a page that merely starts with en is not english", () =>
    expect(stripLocale("/english-notes/")).toEqual({ locale: "ko", path: "/english-notes/" }));
});

describe("swapLocale round-trips", () => {
  test("ko → en → ko", () => {
    const en = swapLocale("/projects/x/", "en");
    expect(en).toBe("/en/projects/x/");
    expect(swapLocale(en, "ko")).toBe("/projects/x/");
  });
  test("same locale is identity", () =>
    expect(swapLocale("/en/resume/", "en")).toBe("/en/resume/"));
});
