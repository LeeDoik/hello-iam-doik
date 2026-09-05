import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { LOCALES, type Locale } from "../../i18n/locales";
import { pick } from "../../lib/localized";
import type { OgInput } from "../../lib/og";
import { renderOgPng } from "../../lib/og-render";

export async function getStaticPaths() {
  const profile = (await getCollection("profile"))[0];
  if (!profile) throw new Error("profile missing");
  const projects = await getCollection("projects");
  const landing = LOCALES.map((locale) => ({
    params: { path: locale },
    props: {
      title: pick(profile.data.name, locale),
      subtitle: pick(profile.data.tagline, locale),
      locale,
      kicker: locale === "ko" ? "포트폴리오" : "Portfolio",
    } satisfies OgInput,
  }));
  const perProject = projects.flatMap((p) =>
    LOCALES.map((locale: Locale) => ({
      params: { path: `projects/${p.id}/${locale}` },
      props: {
        title: pick(p.data.title, locale),
        subtitle: pick(p.data.summary, locale),
        locale,
        kicker: pick(profile.data.name, locale),
      } satisfies OgInput,
    })),
  );
  return [...landing, ...perProject];
}

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOgPng(props as OgInput);
  return new Response(Buffer.from(png), { headers: { "Content-Type": "image/png" } });
};
