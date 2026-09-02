import { defineCollection, reference } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";
import { experienceSchema, profileSchema, projectSchema, skillSchema } from "./content/schemas";

const profile = defineCollection({
  loader: glob({ pattern: "profile.yaml", base: "./content" }),
  schema: profileSchema,
});

const skills = defineCollection({
  loader: file("content/skills.yaml"),
  schema: skillSchema(() => reference("projects")),
});

const experience = defineCollection({
  loader: file("content/experience.yaml"),
  schema: experienceSchema,
});

const projects = defineCollection({
  loader: glob({
    pattern: "*/meta.yaml",
    base: "./content/projects",
    generateId: ({ entry }) => entry.split("/")[0] ?? entry,
  }),
  schema: ({ image }) => projectSchema(image),
});

const stories = defineCollection({
  loader: glob({
    pattern: "*/{ko,en}.md",
    base: "./content/projects",
    generateId: ({ entry }) => entry.replace(/\.md$/, ""),
  }),
  schema: z.object({}).passthrough(),
});

// js-yaml (used internally by Astro's frontmatter parser) resolves an unquoted
// YYYY-MM-DD scalar to a JS Date, not a string. Existing ADR frontmatter predates
// this collection and is left as-is, so the date field accepts both and normalizes
// to the ISO string our schema and downstream code expect.
const adrDate = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
);

const adrs = defineCollection({
  loader: glob({ pattern: "[0-9][0-9][0-9][0-9]-*.md", base: "./docs/adr" }),
  schema: z.object({
    title: z.string(),
    status: z.enum(["proposed", "accepted", "deprecated", "superseded"]),
    date: adrDate,
  }),
});

export const collections = { profile, skills, experience, projects, stories, adrs };
