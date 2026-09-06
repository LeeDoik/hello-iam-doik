// 히어로의 WebGL 프로브와 three.js 초기화가 첫 프레임보다 먼저 GPU 프로세스를 깨우면 첫 페인트가
// 그만큼 밀린다(ADR-0008 개정 2026-09-07). requestAnimationFrame 콜백은 다음 페인트 "직전"에 돌고,
// 그 안에서 다시 예약한 콜백은 그 페인트가 커밋된 "뒤"에 돌므로, 두 번 겹친 rAF가 "첫 페인트 이후"다.
type Raf = (cb: (t: number) => void) => number;
type Caf = (id: number) => void;

export function afterFirstPaint(
  cb: () => void,
  raf: Raf = (f) => globalThis.requestAnimationFrame(f),
  caf: Caf = (id) => globalThis.cancelAnimationFrame(id),
): () => void {
  let id = raf(() => {
    id = raf(() => cb());
  });
  return () => caf(id);
}
