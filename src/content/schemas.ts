import { z } from "astro/zod";

// strictObject: 따옴표 없는 YAML 플로우 매핑의 쉼표가 만드는 잘못된 키를 빌드에서 잡는다
export const localized = z.strictObject({ ko: z.string().min(1), en: z.string().min(1) });
export type Localized = z.infer<typeof localized>;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");
const shortSha = z.string().regex(/^[0-9a-f]{7,40}$/);
const url = z.url();

export type ImageValidator = () => z.ZodTypeAny;

export const projectStatus = z.enum(["live", "archived", "wip"]);
export const device = z.enum(["desktop", "mobile"]);
export const evalJudge = z.enum(["exact", "llm-judge", "human"]);

export const metricSchema = z.object({
  label: localized,
  before: z.string().optional(),
  after: z.string(),
  unit: z.string().optional(),
  method: localized,
  evidence: url.optional(),
});

export const screenSchema = (image: ImageValidator) =>
  z.object({
    src: image(),
    alt: localized,
    device,
    capturedAt: isoDate,
    commit: shortSha.optional(),
  });

export const aiSchema = (image: ImageValidator) =>
  z.object({
    models: z.array(z.string().min(1)).min(1),
    architecture: image().optional(),
    promptFile: url.optional(),
    evals: z
      .array(
        z.object({
          name: z.string(),
          metric: z.string(),
          n: z.number().int().positive(),
          baseline: z.string(),
          final: z.string(),
          judge: evalJudge,
        }),
      )
      .default([]),
    rejectedTradeoff: z.object({ option: localized, reasonWithNumbers: localized }).optional(),
    costPerRequest: z.string().optional(),
    latencyP50: z.string().optional(),
    failureModes: z.array(localized).default([]),
  });

export const projectSchema = (image: ImageValidator) =>
  z.object({
    title: localized,
    summary: localized,
    status: projectStatus,
    period: z.object({ from: isoDate, to: isoDate.optional() }),
    role: z.object({ teamSize: z.number().int().min(1), owned: localized }),
    stack: z.array(z.string().min(1)).min(1),
    links: z.object({
      repo: url.optional(),
      live: url.optional(),
      demoVideo: url.optional(),
      demoCredentials: z.object({ id: z.string(), password: z.string() }).optional(),
      keyCommits: z.array(z.object({ label: localized, url, why: localized })).default([]),
    }),
    metrics: z.array(metricSchema).max(4),
    screens: z.array(screenSchema(image)).min(1),
    ai: aiSchema(image).optional(),
    featured: z.boolean().default(false),
    order: z.number().int(),
    updatedAt: isoDate,
  });

export const skillGroup = z.enum(["frontend", "ai", "backend", "tooling"]);

export const skillSchema = (referenceProjects: () => z.ZodTypeAny) =>
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    group: skillGroup,
    builtWithIt: localized,
    projects: z.array(referenceProjects()).min(1),
    since: z.number().int().min(2015),
  });

export const experienceSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["work", "education", "bootcamp"]),
  org: localized,
  role: localized,
  from: isoDate,
  to: isoDate.optional(),
  bullets: z.array(localized).max(4),
});

export const profileSchema = z.object({
  name: localized,
  tagline: localized,
  bio: localized,
  location: localized,
  email: z.email(),
  links: z.object({ github: url, linkedin: url.optional() }),
});

export type ProjectData = z.infer<ReturnType<typeof projectSchema>>;
export type MetricData = z.infer<typeof metricSchema>;
export type ExperienceData = z.infer<typeof experienceSchema>;
export type ProfileData = z.infer<typeof profileSchema>;
export type SkillGroup = z.infer<typeof skillGroup>;
