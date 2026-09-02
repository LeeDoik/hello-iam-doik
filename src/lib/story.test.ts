import { describe, expect, test } from "vitest";
import { missingHeadings, requiredHeadings } from "./story";

describe("requiredHeadings", () => {
  test("ko", () => expect(requiredHeadings("ko")).toEqual(["문제", "접근", "결과", "배운 점"]));
  test("en", () =>
    expect(requiredHeadings("en")).toEqual(["Problem", "Approach", "Result", "What I learned"]));
});

describe("missingHeadings", () => {
  const ok = "# 제목\n\n## 문제\n...\n## 접근\n...\n## 결과\n...\n## 배운 점\n...";
  test("complete story has none missing", () => expect(missingHeadings(ok, "ko")).toEqual([]));
  test("reports missing ones in order", () => {
    expect(missingHeadings("## 문제\n## 결과\n", "ko")).toEqual(["접근", "배운 점"]);
  });
  test("only H2 counts", () =>
    expect(missingHeadings("### 문제\n# 접근\n", "ko")).toContain("문제"));
  test("tolerates trailing spaces and CRLF", () => {
    expect(missingHeadings("## 문제  \r\n## 접근\r\n## 결과\r\n## 배운 점\r\n", "ko")).toEqual([]);
  });
});
