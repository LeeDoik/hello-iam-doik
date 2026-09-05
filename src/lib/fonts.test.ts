import { describe, expect, test } from "vitest";
import { subsetCssToLocal, subsetFileNames } from "./fonts";

const css = `@font-face{font-family:'Pretendard Variable';src:url(./woff2-dynamic-subset/PretendardVariable.subset.0.woff2) format('woff2-variations');unicode-range:U+f9ca-fa0b;}
@font-face{src:url(./woff2-dynamic-subset/PretendardVariable.subset.1.woff2) format('woff2-variations');}
@font-face{src:url(./woff2-dynamic-subset/PretendardVariable.subset.0.woff2) format('woff2-variations');}`;

describe("subsetFileNames", () => {
  test("lists referenced files once, in order", () => {
    expect(subsetFileNames(css)).toEqual([
      "PretendardVariable.subset.0.woff2",
      "PretendardVariable.subset.1.woff2",
    ]);
  });
});

describe("subsetCssToLocal", () => {
  test("rewrites relative urls to the public path", () => {
    const out = subsetCssToLocal(css);
    expect(out).toContain(
      "url(/fonts/pretendard/woff2-dynamic-subset/PretendardVariable.subset.0.woff2)",
    );
    expect(out).not.toContain("url(./");
  });
});
