import { execSync } from "node:child_process";

export type DeployInfo = { sha: string; shortSha: string; date: string; commitUrl: string };

export function deployInfoFrom(
  env: Record<string, string | undefined>,
  fallbackSha: () => string,
  now: Date,
  repoUrl: string,
): DeployInfo {
  let sha = env.VERCEL_GIT_COMMIT_SHA ?? "";
  if (!sha) {
    try {
      sha = fallbackSha().trim();
    } catch {
      sha = "";
    }
  }
  if (!sha)
    return {
      sha: "unknown",
      shortSha: "unknown",
      date: now.toISOString().slice(0, 10),
      commitUrl: repoUrl,
    };
  return {
    sha,
    shortSha: sha.slice(0, 7),
    date: now.toISOString().slice(0, 10),
    commitUrl: `${repoUrl}/commit/${sha}`,
  };
}

export function getDeployInfo(repoUrl: string): DeployInfo {
  return deployInfoFrom(
    process.env,
    () => execSync("git rev-parse HEAD", { encoding: "utf8" }),
    new Date(),
    repoUrl,
  );
}
