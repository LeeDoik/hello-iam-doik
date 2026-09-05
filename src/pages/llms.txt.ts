import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { llmsTxt } from "../lib/llms";
import { pick } from "../lib/localized";
import { localePath } from "../lib/urls";

export const GET: APIRoute = async ({ site }) => {
  const base = (site?.href ?? "https://hello-iam-doik.vercel.app").replace(/\/$/, "");
  const profile = (await getCollection("profile"))[0];
  if (!profile) throw new Error("profile missing");
  const projects = (await getCollection("projects")).sort((a, b) => a.data.order - b.data.order);
  const adrs = (await getCollection("adrs")).sort((a, b) => a.id.localeCompare(b.id));
  const body = llmsTxt({
    siteName: pick(profile.data.name, "en"),
    site: base,
    tagline: pick(profile.data.tagline, "en"),
    projects: projects.map((p) => ({
      title: pick(p.data.title, "en"),
      summary: pick(p.data.summary, "en"),
      url: `${base}${localePath("en", `/projects/${p.id}/`)}`,
      repo: p.data.links.repo ?? p.data.links.live ?? "",
    })),
    adrs: adrs.map((a) => ({
      title: a.data.title,
      url: `${base}${localePath("en", `/colophon/${a.id}/`)}`,
    })),
  });
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
