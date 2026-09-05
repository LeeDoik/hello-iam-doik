import type { Locale } from "../i18n/locales";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export type SatoriNode = {
  type: string;
  props: { style?: Record<string, string | number>; children?: SatoriNode | SatoriNode[] | string };
};
export type OgInput = { title: string; subtitle: string; locale: Locale; kicker: string };

export function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1))}…`;
}

const FONT = "Pretendard";

function text(content: string, style: Record<string, string | number>): SatoriNode {
  return { type: "div", props: { style: { fontFamily: FONT, ...style }, children: content } };
}

export function ogElement(input: OgInput): SatoriNode {
  return {
    type: "div",
    props: {
      style: {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#0f172a",
        color: "#f8fafc",
      },
      children: [
        text(input.kicker, { fontSize: 28, fontWeight: 400, opacity: 0.8 }),
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column", gap: 20 },
            children: [
              text(truncate(input.title, 40), { fontSize: 72, fontWeight: 700, lineHeight: 1.15 }),
              text(truncate(input.subtitle, 90), {
                fontSize: 34,
                fontWeight: 400,
                opacity: 0.85,
                lineHeight: 1.35,
              }),
            ],
          },
        },
        text(
          input.locale === "ko" ? "hello-iam-doik.vercel.app" : "hello-iam-doik.vercel.app · EN",
          {
            fontSize: 24,
            fontWeight: 400,
            opacity: 0.7,
          },
        ),
      ],
    },
  };
}
