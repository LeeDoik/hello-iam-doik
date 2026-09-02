import { expect, test } from "vitest";
import { LOCALES } from "../i18n/locales";
import { ui } from "../i18n/ui";

test("every UI string is non-empty in every locale", () => {
  for (const locale of LOCALES) {
    for (const [key, value] of Object.entries(ui[locale])) {
      expect(value.trim(), `${locale}.${key}`).not.toBe("");
    }
  }
});

test("en has exactly the ko keys", () => {
  expect(Object.keys(ui.en).sort()).toEqual(Object.keys(ui.ko).sort());
});
