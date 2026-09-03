import { useEffect, useRef, useState } from "react";
import {
  decideQuality,
  frameInterval,
  QUALITY_KEY,
  type Quality,
  rememberSettled,
  renderScale,
} from "../lib/motion-prefs";

let webglSupported: boolean | undefined;

function hasWebgl(): boolean {
  if (webglSupported !== undefined) return webglSupported;
  try {
    const c = document.createElement("canvas");
    const ctx = c.getContext("webgl2") ?? c.getContext("webgl");
    webglSupported = Boolean(ctx);
    (ctx as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext();
    return webglSupported;
  } catch {
    webglSupported = false;
    return false;
  }
}

function readSignals() {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: nav.deviceMemory,
    webgl: hasWebgl(),
  };
}

export function Hero3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [quality, setQuality] = useState<Quality>("off"); // SSR = off → 서버/클라 첫 렌더 동일

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(QUALITY_KEY);
    } catch {}
    const decided = decideQuality(readSignals(), stored);
    setQuality(decided);
    rememberSettled(decided);
    window.dispatchEvent(new CustomEvent<Quality>("hero-quality-settled", { detail: decided }));
    const onQuality = (e: Event) => {
      const q = (e as CustomEvent<Quality>).detail;
      const resolved = readSignals().reducedMotion ? "off" : q;
      setQuality(resolved);
      rememberSettled(resolved);
      window.dispatchEvent(new CustomEvent<Quality>("hero-quality-settled", { detail: resolved }));
    };
    window.addEventListener("hero-quality", onQuality);
    return () => window.removeEventListener("hero-quality", onQuality);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || quality === "off") return;
    let scene: import("../lib/hero-scene").HeroScene | undefined;
    let raf = 0;
    let visible = true;
    let last = 0;
    const interval = frameInterval(quality);
    const cancelled = { current: false };

    import("../lib/hero-scene")
      .then(({ createHeroScene }) => {
        if (cancelled.current) return;
        try {
          scene = createHeroScene(canvas, renderScale(quality));
        } catch {
          setQuality("off");
          return;
        }
        const loop = (t: number) => {
          raf = requestAnimationFrame(loop);
          if (!visible || document.hidden || t - last < interval) return;
          last = t;
          scene?.frame(t);
        };
        raf = requestAnimationFrame(loop);
      })
      .catch(() => setQuality("off"));

    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    io.observe(canvas);
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      scene?.setPointer((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    };
    const onScroll = () =>
      scene?.setScroll(Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1));
    const onResize = () => scene?.resize();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      cancelled.current = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      scene?.dispose();
    };
  }, [quality]);

  return (
    // biome-ignore lint/a11y/noAriaHiddenOnFocusable: bare <canvas> has no tabindex, so it is never focusable; it is purely decorative
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-quality={quality}
      className="absolute inset-0 -z-10 h-full w-full"
    />
  );
}
