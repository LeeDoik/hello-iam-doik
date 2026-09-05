import { z } from "astro/zod";

const noEnvPlaceholder = z.string().refine((v) => !/\$\{?[A-Z_]{3,}\}?/.test(v), {
  message: "환경변수처럼 보이는 값은 금지: 시드 데모 계정 값만 적는다",
});

export const captureSchema = z
  .strictObject({
    base: z.url().optional(),
    local: z
      .strictObject({
        cwd: z.string().min(1),
        command: z.string().min(1),
        port: z.number().int().positive(),
      })
      .optional(),
    login: z
      .strictObject({
        path: z.string().startsWith("/"),
        steps: z
          .array(
            z.strictObject({
              fill: z.string().optional(),
              value: noEnvPlaceholder.optional(),
              click: z.string().optional(),
            }),
          )
          .min(1),
      })
      .optional(),
    shots: z
      .array(
        z.strictObject({
          name: z.string().regex(/^\d{2}-[a-z0-9-]+$/, "NN-kebab-case"),
          route: z.string().startsWith("/"),
          devices: z.array(z.enum(["desktop", "mobile"])).min(1),
          waitFor: z.string().optional(),
        }),
      )
      .min(1),
  })
  .refine((c) => Boolean(c.base || c.local), { message: "base 또는 local 중 하나는 필요" });

export type CaptureConfig = z.infer<typeof captureSchema>;
export type Device = CaptureConfig["shots"][number]["devices"][number];
