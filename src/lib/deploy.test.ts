import { expect, test } from "vitest";
import { deployInfoFrom } from "./deploy";

const repo = "https://github.com/LeeDoik/hello-iam-doik";
const now = new Date("2026-09-02T10:00:00Z");

test("uses VERCEL_GIT_COMMIT_SHA when present", () => {
  const i = deployInfoFrom({ VERCEL_GIT_COMMIT_SHA: "abcdef1234567" }, () => "zzz", now, repo);
  expect(i).toEqual({
    sha: "abcdef1234567",
    shortSha: "abcdef1",
    date: "2026-09-02",
    commitUrl: `${repo}/commit/abcdef1234567`,
  });
});

test("falls back to the provided git sha", () => {
  expect(deployInfoFrom({}, () => "1234567890", now, repo).shortSha).toBe("1234567");
});

test("unknown when nothing is available", () => {
  const i = deployInfoFrom(
    {},
    () => {
      throw new Error("no git");
    },
    now,
    repo,
  );
  expect(i.sha).toBe("unknown");
  expect(i.commitUrl).toBe(repo);
});
