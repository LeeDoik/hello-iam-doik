// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test } from "vitest";
import { QUALITY_KEY, SETTLED_KEY } from "../lib/motion-prefs";
import { QualityToggle } from "./QualityToggle";

const labels = {
  label: "Background effect",
  high: "High",
  low: "Low",
  off: "Off",
  reducedMotion: "Following your system's reduced-motion setting",
};
beforeEach(() => {
  localStorage.clear();
  delete (window as unknown as Record<string, unknown>)[SETTLED_KEY];
});

test("cycles high → low → off → high, persists and dispatches", async () => {
  const seen: string[] = [];
  window.addEventListener("hero-quality", (e) => seen.push((e as CustomEvent<string>).detail));
  render(<QualityToggle labels={labels} />);
  const btn = screen.getByRole("button", { name: /Background effect/ });
  expect(btn).toHaveTextContent("High");
  await userEvent.click(btn);
  expect(btn).toHaveTextContent("Low");
  expect(localStorage.getItem(QUALITY_KEY)).toBe("low");
  await userEvent.click(btn);
  await userEvent.click(btn);
  expect(btn).toHaveTextContent("High");
  expect(seen).toEqual(["low", "off", "high"]);
});

test("reads the stored value on mount", () => {
  localStorage.setItem(QUALITY_KEY, "off");
  render(<QualityToggle labels={labels} />);
  expect(screen.getByRole("button")).toHaveTextContent("Off");
});

test("syncs to the hero's settled quality", async () => {
  render(<QualityToggle labels={labels} />);
  const btn = screen.getByRole("button", { name: /Background effect/ });
  expect(btn).toHaveTextContent("High");
  window.dispatchEvent(new CustomEvent("hero-quality-settled", { detail: "off" }));
  await waitFor(() => expect(btn).toHaveTextContent("Off"));
});

test("reads a value the hero already settled before mount", () => {
  (window as unknown as Record<string, unknown>)[SETTLED_KEY] = "low";
  render(<QualityToggle labels={labels} />);
  expect(screen.getByRole("button")).toHaveTextContent("Low");
});

test("disables the toggle and shows the reduced-motion label when the OS prefers reduced motion", () => {
  const matchMedia = (query: string) =>
    ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList;
  window.matchMedia = matchMedia as typeof window.matchMedia;
  try {
    render(<QualityToggle labels={labels} />);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent(labels.reducedMotion);
  } finally {
    // @ts-expect-error jsdom does not define matchMedia by default; restore that.
    delete window.matchMedia;
  }
});
