import { expect, test } from "vitest";
import { alternates, canonical } from "./seo";

const site = "https://hello-iam-doik.vercel.app";

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
