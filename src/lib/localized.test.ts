import { expect, test } from "vitest";
import { pick } from "./localized";

test("pick returns the requested locale", () => {
  expect(pick({ ko: "안녕", en: "hi" }, "ko")).toBe("안녕");
  expect(pick({ ko: "안녕", en: "hi" }, "en")).toBe("hi");
});
