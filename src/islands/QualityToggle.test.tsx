// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test } from "vitest";
import { QUALITY_KEY } from "../lib/motion-prefs";
import { QualityToggle } from "./QualityToggle";

const labels = { label: "Background effect", high: "High", low: "Low", off: "Off" };
beforeEach(() => localStorage.clear());

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
