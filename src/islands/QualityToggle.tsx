import { useEffect, useState } from "react";
import { QUALITY_KEY, type Quality, readSettled } from "../lib/motion-prefs";

type Props = {
  labels: { label: string; high: string; low: string; off: string; reducedMotion: string };
};

const OPTIONS: Quality[] = ["high", "low", "off"];

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
  function choose(next: Quality) {
    setQ(next);
    try {
      localStorage.setItem(QUALITY_KEY, next);
    } catch {}
    window.dispatchEvent(new CustomEvent<Quality>("hero-quality", { detail: next }));
  }
  if (reducedMotion) {
    return (
      <p className="text-ink-2 text-sm">
        {labels.label} · {labels.off}
        <span className="ml-2">({labels.reducedMotion})</span>
      </p>
    );
  }
  return (
    // biome-ignore lint/a11y/useSemanticElements: a <legend> cannot sit inline with the options inside a flex <fieldset>; the group role + label carry the same semantics
    <div
      role="group"
      aria-label={labels.label}
      className="text-ink-2 flex flex-wrap items-center gap-x-3 text-sm"
    >
      <span>{labels.label}</span>
      {OPTIONS.map((k) => (
        <button
          key={k}
          type="button"
          aria-pressed={q === k}
          onClick={() => choose(k)}
          className="inline-flex min-h-11 items-center underline-offset-4 decoration-accent hover:underline aria-pressed:text-ink aria-pressed:underline"
        >
          {labels[k]}
        </button>
      ))}
    </div>
  );
}
