import { expect, test } from "vitest";
import { alternates, canonical, ogImagePath, ogImageUrl } from "./seo";

const site = "https://hello-iam-doik.vercel.app";

test("ogImagePath", () => {
  expect(ogImagePath("ko")).toBe("/og/ko.png");
  expect(ogImagePath("en", "sample-project")).toBe("/og/projects/sample-project/en.png");
  expect(ogImageUrl("https://x.dev/", "en", "a")).toBe("https://x.dev/og/projects/a/en.png");
});

test("canonical points to the same locale", () => {
  expect(canonical(site, "ko", "/projects/x/")).toBe(`${site}/projects/x/`);
  expect(canonical(site, "en", "/projects/x/")).toBe(`${site}/en/projects/x/`);
});

test("alternates are ko, en and x-default → ko", () => {
  expect(alternates(site, "/")).toEqual([
    { hreflang: "ko", href: `${site}/` },
    { hreflang: "en", href: `${site}/en/` },
    { hreflang: "x-default", href: `${site}/` },
  ]);
});
