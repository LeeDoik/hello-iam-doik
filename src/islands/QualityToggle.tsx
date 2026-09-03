import { useEffect, useState } from "react";
import { nextQuality, QUALITY_KEY, type Quality, readSettled } from "../lib/motion-prefs";

type Props = {
  labels: { label: string; high: string; low: string; off: string; reducedMotion: string };
};

function readStored(): Quality {
  try {
    const v = localStorage.getItem(QUALITY_KEY);
    return v === "low" || v === "off" ? v : "high";
  } catch {
    return "high";
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function QualityToggle({ labels }: Props) {
  const [q, setQ] = useState<Quality>("high"); // SSR과 첫 렌더는 항상 high
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (prefersReducedMotion()) {
      setReducedMotion(true);
      setQ("off");
      return;
    }
    const settled = readSettled();
    setQ(settled ?? readStored());
  }, []);
  useEffect(() => {
    const onSettled = (e: Event) => setQ((e as CustomEvent<Quality>).detail);
    window.addEventListener("hero-quality-settled", onSettled);
    return () => window.removeEventListener("hero-quality-settled", onSettled);
  }, []);
  function cycle() {
    const next = nextQuality(q);
    setQ(next);
    try {
      localStorage.setItem(QUALITY_KEY, next);
    } catch {}
    window.dispatchEvent(new CustomEvent<Quality>("hero-quality", { detail: next }));
  }
  return (
    <button
      type="button"
      onClick={cycle}
      disabled={reducedMotion}
      title={reducedMotion ? labels.label : undefined}
      className="rounded border px-2 py-0.5 text-xs"
      aria-label={`${labels.label}: ${reducedMotion ? labels.reducedMotion : labels[q]}`}
    >
      {labels.label}: {reducedMotion ? labels.reducedMotion : labels[q]}
    </button>
  );
}
