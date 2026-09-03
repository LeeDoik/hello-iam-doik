import { describe, expect, test } from "vitest";
import { OG_HEIGHT, OG_WIDTH, ogElement, truncate } from "./og";

describe("truncate", () => {
  test("keeps short text", () => expect(truncate("짧다", 10)).toBe("짧다"));
  test("cuts long text with an ellipsis within max", () => {
    const out = truncate("가".repeat(50), 20);
    expect(out.length).toBeLessThanOrEqual(20);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("ogElement", () => {
  const el = ogElement({
    title: "샘플 프로젝트",
    subtitle: "한 줄 요약",
    locale: "ko",
    kicker: "Doik Lee",
  });
  test("root is a full-size flex column", () => {
    expect(el.type).toBe("div");
    expect(el.props.style).toMatchObject({ width: OG_WIDTH, height: OG_HEIGHT, display: "flex" });
  });
  test("contains kicker, title and subtitle text", () => {
    const text = JSON.stringify(el);
    for (const s of ["Doik Lee", "샘플 프로젝트", "한 줄 요약"]) expect(text).toContain(s);
  });
  test("uses Pretendard for all text", () => {
    expect(JSON.stringify(el)).toContain('"fontFamily":"Pretendard"');
  });
});
