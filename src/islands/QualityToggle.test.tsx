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

const pressed = () =>
  screen.getAllByRole("button").find((b) => b.getAttribute("aria-pressed") === "true")?.textContent;

test("offers three options, persists and dispatches the chosen one", async () => {
  const seen: string[] = [];
  window.addEventListener("hero-quality", (e) => seen.push((e as CustomEvent<string>).detail));
  render(<QualityToggle labels={labels} />);
  expect(screen.getByRole("group", { name: "Background effect" })).toBeInTheDocument();
  expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["High", "Low", "Off"]);
  expect(pressed()).toBe("High");
  await userEvent.click(screen.getByRole("button", { name: "Low" }));
  expect(pressed()).toBe("Low");
  expect(localStorage.getItem(QUALITY_KEY)).toBe("low");
  await userEvent.click(screen.getByRole("button", { name: "Off" }));
  await userEvent.click(screen.getByRole("button", { name: "High" }));
  expect(pressed()).toBe("High");
  expect(seen).toEqual(["low", "off", "high"]);
});

test("reads the stored value on mount", () => {
  localStorage.setItem(QUALITY_KEY, "off");
  render(<QualityToggle labels={labels} />);
  expect(pressed()).toBe("Off");
});

test("syncs to the hero's settled quality", async () => {
  render(<QualityToggle labels={labels} />);
  expect(pressed()).toBe("High");
  window.dispatchEvent(new CustomEvent("hero-quality-settled", { detail: "off" }));
  await waitFor(() => expect(pressed()).toBe("Off"));
});

test("reads a value the hero already settled before mount", () => {
  (window as unknown as Record<string, unknown>)[SETTLED_KEY] = "low";
  render(<QualityToggle labels={labels} />);
  expect(pressed()).toBe("Low");
});

test("shows a static reduced-motion note instead of buttons when the OS prefers reduced motion", () => {
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
    expect(screen.queryByRole("button")).toBeNull();
    const note = screen.getByText(labels.label, { exact: false });
    expect(note).toHaveTextContent("Background effect · Off");
    expect(note).toHaveTextContent(labels.reducedMotion);
  } finally {
    // @ts-expect-error jsdom does not define matchMedia by default; restore that.
    delete window.matchMedia;
  }
});
