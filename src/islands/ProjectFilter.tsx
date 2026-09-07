import { useEffect, useId, useMemo, useState } from "react";
import { parseHashGroup, toHash, visibleSlugs } from "../lib/filter";

type Group = { id: string; label: string };
type Card = { slug: string; groups: string[] };
type Props = {
  groups: Group[];
  cards: Card[];
  labels: { all: string; count: string; filterLabel: string };
};

export function ProjectFilter({ groups, cards, labels }: Props) {
  // Memoized so the mount effect below can depend on it without re-running every render.
  const ids = useMemo(() => groups.map((g) => g.id), [groups]);
  const [selected, setSelected] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const labelId = useId();
  // Memoized so the effect below can depend on it without a new array every render.
  const visible = useMemo(() => visibleSlugs(cards, selected), [cards, selected]);

  // Read the URL hash once on mount, client-side only, to avoid a hydration mismatch
  // between the server-rendered "All" state and whatever hash the client sees first.
  useEffect(() => {
    setSelected(parseHashGroup(window.location.hash, ids));
  }, [ids]);

  useEffect(() => {
    const show = new Set(visible);
    for (const el of document.querySelectorAll<HTMLElement>("#project-list [data-project-card]")) {
      el.hidden = !show.has(el.dataset.slug ?? "");
    }
    // Only write the URL once the user has actually interacted; otherwise, on first
    // render (selected === null before the mount effect above has run), we'd clobber
    // an incoming "#stack=…" hash with "" before it's ever read.
    if (!touched) return;
    const hash = toHash(selected);
    if (window.location.hash !== hash)
      history.replaceState(null, "", hash || window.location.pathname + window.location.search);
  }, [selected, visible, touched]);

  const options: Group[] = [{ id: "__all", label: labels.all }, ...groups];
  const current = selected ?? "__all";

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const i = options.findIndex((o) => o.id === current);
    const delta =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? -1
          : 0;
    if (delta === 0) return;
    e.preventDefault();
    const next = options[(i + delta + options.length) % options.length];
    if (!next) return;
    setTouched(true);
    setSelected(next.id === "__all" ? null : next.id);
    e.currentTarget.querySelector<HTMLButtonElement>(`[data-id="${next.id}"]`)?.focus();
  }

  return (
    <div className="mt-8">
      <span id={labelId} className="text-ink-2 text-sm">
        {labels.filterLabel}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="mt-3 flex flex-wrap gap-2"
        onKeyDown={onKeyDown}
      >
        {options.map((o) => {
          const checked = o.id === current;
          return (
            // biome-ignore lint/a11y/useSemanticElements: <button role="radio"> is the WAI-ARIA APG radiogroup pattern; a native <input type="radio"> can't be styled as a pill toggle without extra hidden markup
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={checked}
              data-id={o.id}
              tabIndex={checked ? 0 : -1}
              className={`inline-flex min-h-11 items-center rounded-sm border px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${checked ? "border-accent bg-accent text-accent-ink font-medium" : "border-ink-2/80 text-ink-2 hover:border-accent"}`}
              onClick={() => {
                setTouched(true);
                setSelected(o.id === "__all" ? null : o.id);
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <p role="status" aria-live="polite" className="text-ink-2 mt-3 text-sm tabular-nums">
        {visible.length}
        {labels.count}
      </p>
    </div>
  );
}
