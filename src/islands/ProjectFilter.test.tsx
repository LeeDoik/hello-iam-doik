// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test } from "vitest";
import { ProjectFilter } from "./ProjectFilter";

const groups = [
  { id: "frontend", label: "Frontend" },
  { id: "ai", label: "AI" },
] as const;
const cards = [
  { slug: "a", groups: ["frontend"] },
  { slug: "b", groups: ["frontend", "ai"] },
];
const labels = { all: "All", count: " projects", filterLabel: "Filter by stack" };

beforeEach(() => {
  document.body.innerHTML = `<div id="project-list">
    <article data-project-card data-slug="a"></article>
    <article data-project-card data-slug="b"></article>
  </div>`;
  window.location.hash = "";
});

test("renders one button per group plus All, and announces the count", () => {
  render(<ProjectFilter groups={[...groups]} cards={cards} labels={labels} locale="en" />);
  expect(screen.getAllByRole("radio")).toHaveLength(3);
  expect(screen.getByRole("status")).toHaveTextContent("2 projects");
});

test("selecting AI hides card a and updates hash", async () => {
  render(<ProjectFilter groups={[...groups]} cards={cards} labels={labels} locale="en" />);
  await userEvent.click(screen.getByRole("radio", { name: "AI" }));
  expect(document.querySelector('[data-slug="a"]')).toHaveAttribute("hidden");
  expect(document.querySelector('[data-slug="b"]')).not.toHaveAttribute("hidden");
  expect(window.location.hash).toBe("#stack=ai");
  expect(screen.getByRole("status")).toHaveTextContent("1 projects");
});

test("keyboard: arrow keys move between radios", async () => {
  render(<ProjectFilter groups={[...groups]} cards={cards} labels={labels} locale="en" />);
  const all = screen.getByRole("radio", { name: "All" });
  all.focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(screen.getByRole("radio", { name: "Frontend" })).toHaveFocus();
});
