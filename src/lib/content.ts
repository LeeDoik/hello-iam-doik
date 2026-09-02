import { type CollectionEntry, getCollection, getEntry } from "astro:content";
import type { ExperienceData, ProfileData, ProjectData } from "../content/schemas";
import type { Locale } from "../i18n/locales";
import { localePath } from "./urls";

export type ProjectView = { slug: string; data: ProjectData; href: string };

function toView(entry: CollectionEntry<"projects">, locale: Locale): ProjectView {
  return {
    slug: entry.id,
    data: entry.data as ProjectData,
    href: localePath(locale, `/projects/${entry.id}/`),
  };
}

export async function getProjects(locale: Locale): Promise<ProjectView[]> {
  const entries = await getCollection("projects");
  return entries.sort((a, b) => a.data.order - b.data.order).map((e) => toView(e, locale));
}

export async function getFeaturedProjects(locale: Locale): Promise<ProjectView[]> {
  return (await getProjects(locale)).filter((p) => p.data.featured);
}

export async function getProject(slug: string, locale: Locale): Promise<ProjectView> {
  const entry = await getEntry("projects", slug);
  if (!entry) throw new Error(`Unknown project: ${slug}`);
  return toView(entry, locale);
}

/** en.md가 없으면 ko.md를 isFallback=true로 돌려준다. ko.md가 없으면 throw(빌드 실패). */
export async function getStory(
  slug: string,
  locale: Locale,
): Promise<{ entry: CollectionEntry<"stories">; isFallback: boolean }> {
  const wanted = await getEntry("stories", `${slug}/${locale}`);
  if (wanted) return { entry: wanted, isFallback: false };
  const ko = await getEntry("stories", `${slug}/ko`);
  if (!ko) throw new Error(`Missing required content/projects/${slug}/ko.md`);
  return { entry: ko, isFallback: true };
}

export async function getProfile(): Promise<ProfileData> {
  const [p] = await getCollection("profile");
  if (!p) throw new Error("content/profile.yaml is missing");
  return p.data;
}

export async function getSkills(): Promise<CollectionEntry<"skills">[]> {
  return getCollection("skills");
}

export async function getExperience(): Promise<ExperienceData[]> {
  const entries = await getCollection("experience");
  return entries
    .map((e) => e.data)
    .sort((a, b) => (a.from < b.from ? 1 : a.from > b.from ? -1 : 0));
}

export async function getAdrs(): Promise<CollectionEntry<"adrs">[]> {
  return (await getCollection("adrs")).sort((a, b) => a.id.localeCompare(b.id));
}
