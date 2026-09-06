import { describe, expect, it } from "vitest";
import { afterFirstPaint } from "./after-first-paint";

function fakeFrames() {
  const queue = new Map<number, (t: number) => void>();
  let next = 1;
  const raf = (cb: (t: number) => void) => {
    const id = next++;
    queue.set(id, cb);
    return id;
  };
  const caf = (id: number) => {
    queue.delete(id);
  };
  const flush = () => {
    const pending = [...queue.entries()];
    queue.clear();
    for (const [, cb] of pending) cb(0);
  };
  return { raf, caf, flush, size: () => queue.size };
}

describe("afterFirstPaint", () => {
  it("runs the callback only after two frames, i.e. once the first paint has been committed", () => {
    const f = fakeFrames();
    let calls = 0;
    afterFirstPaint(() => calls++, f.raf, f.caf);
    expect(calls).toBe(0);
    f.flush();
    expect(calls).toBe(0);
    f.flush();
    expect(calls).toBe(1);
  });

  it("cancel works before either frame has fired", () => {
    const f = fakeFrames();
    let calls = 0;
    const cancel = afterFirstPaint(() => calls++, f.raf, f.caf);
    cancel();
    f.flush();
    f.flush();
    expect(calls).toBe(0);
    expect(f.size()).toBe(0);
  });

  it("cancel works between the first and second frame", () => {
    const f = fakeFrames();
    let calls = 0;
    const cancel = afterFirstPaint(() => calls++, f.raf, f.caf);
    f.flush();
    cancel();
    f.flush();
    expect(calls).toBe(0);
  });
});
