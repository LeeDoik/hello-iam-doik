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
let webglSoftwareRenderer: boolean | undefined;

// SwiftShader (headless Chrome/CI), llvmpipe (Mesa software GL), and other CPU
// rasterizers report a renderer string that names the software path — real
// GPUs never do. Treating this as a low-end signal keeps the shader off on
// CPU renderers (see ADR-0008 amendment).
const SOFTWARE_RENDERER_RE = /swiftshader|llvmpipe|software|mesa offscreen|microsoft basic render/i;

function detectWebgl(): { webgl: boolean; softwareRenderer: boolean } {
  try {
    const c = document.createElement("canvas");
    const ctx = c.getContext("webgl2") ?? c.getContext("webgl");
    const webgl = Boolean(ctx);
    let softwareRenderer = false;
    if (ctx) {
      const dbg = ctx.getExtension("WEBGL_debug_renderer_info");
      if (dbg) {
        const renderer = String(ctx.getParameter(dbg.UNMASKED_RENDERER_WEBGL));
        softwareRenderer = SOFTWARE_RENDERER_RE.test(renderer);
      }
      ctx.getExtension("WEBGL_lose_context")?.loseContext();
    }
    return { webgl, softwareRenderer };
  } catch {
    return { webgl: false, softwareRenderer: false };
  }
}

function hasWebgl(): boolean {
  if (webglSupported === undefined) {
    const result = detectWebgl();
    webglSupported = result.webgl;
    webglSoftwareRenderer = result.softwareRenderer;
  }
  return webglSupported;
}

function isSoftwareRenderer(): boolean {
  if (webglSupported === undefined) hasWebgl();
  return webglSoftwareRenderer ?? false;
}

function readSignals() {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: nav.deviceMemory,
    webgl: hasWebgl(),
    softwareRenderer: isSoftwareRenderer(),
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
    // getBoundingClientRect() is a layout read; cache it and only refresh on the events that can
    // actually change it (resize, scroll) instead of on every pointermove.
    let rect = canvas.getBoundingClientRect();
    const onMove = (e: PointerEvent) => {
      scene?.setPointer((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height);
    };
    const onScroll = () => {
      rect = canvas.getBoundingClientRect();
      scene?.setScroll(Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1));
    };
    const onResize = () => {
      rect = canvas.getBoundingClientRect();
      scene?.resize();
    };
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
      className="absolute inset-0 -z-10 h-full w-full [@media(prefers-color-scheme:light)]:invert [@media(prefers-color-scheme:light)]:hue-rotate-180"
    />
  );
}
