import { describe, expect, test } from "vitest";
import {
  DEFAULT_LOCALE,
  isLocale,
  localeFromParam,
  localeStaticPaths,
  otherLocale,
} from "../i18n/locales";

describe("localeFromParam", () => {
  test("undefined is the default locale", () => expect(localeFromParam(undefined)).toBe("ko"));
  test("en is en", () => expect(localeFromParam("en")).toBe("en"));
  test("anything else throws", () => expect(() => localeFromParam("fr")).toThrow(/locale/i));
});
test("isLocale", () => {
  expect(isLocale("ko")).toBe(true);
  expect(isLocale("EN")).toBe(false);
  expect(isLocale(undefined)).toBe(false);
});
test("otherLocale flips", () => {
  expect(otherLocale("ko")).toBe("en");
  expect(otherLocale("en")).toBe("ko");
});
test("localeStaticPaths yields undefined for default and prefix for others", () => {
  expect(localeStaticPaths()).toEqual([
    { params: { lang: undefined } },
    { params: { lang: "en" } },
  ]);
  expect(DEFAULT_LOCALE).toBe("ko");
});
