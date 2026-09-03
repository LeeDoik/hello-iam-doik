import { execSync, spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, devices as pwDevices } from "@playwright/test";
import { parse } from "yaml";
import { captureSchema } from "../src/content/capture-schema";
import {
  metaYamlSnippet,
  planShots,
  type Sidecar,
  sidecarPath,
  staleReport,
  VIEWPORTS,
} from "../src/lib/capture";
import { projectDir, readYaml } from "../src/lib/content-files";

const [slug, ...flags] = process.argv.slice(2);
if (!slug) {
  console.error("usage: pnpm capture <slug> [--stale <days>] [--video]");
  process.exit(1);
}
const dir = projectDir(slug);
const staleIdx = flags.indexOf("--stale");
const today = new Date().toISOString().slice(0, 10);

if (staleIdx >= 0) {
  const days = Number(flags[staleIdx + 1] ?? "90");
  const meta = readYaml<{ screens: { src: string; capturedAt: string }[] }>(join(dir, "meta.yaml"));
  const report = staleReport(
    meta.screens.map((s) => ({ file: s.src, capturedAt: s.capturedAt })),
    today,
    days,
  );
  console.log(report.length ? report.join("\n") : `no screenshots older than ${days} days`);
  process.exit(report.length ? 2 : 0);
}

const config = captureSchema.parse(parse(readFileSync(join(dir, "capture.yaml"), "utf8")));
const pwVersion = (
  JSON.parse(
    readFileSync(join(process.cwd(), "node_modules/@playwright/test/package.json"), "utf8"),
  ) as { version: string }
).version;

let server: ReturnType<typeof spawn> | undefined;
let baseUrl = config.base ?? "";
let sourceCommit: string | undefined;
if (config.local) {
  const { cwd, command, port } = config.local;
  sourceCommit = execSync("git rev-parse --short HEAD", { cwd, encoding: "utf8" }).trim();
  server = spawn(command, { cwd, shell: true, stdio: "inherit" });
  baseUrl = `http://localhost:${port}`;
  await waitForServer(baseUrl);
}

const browser = await chromium.launch({ args: ["--font-render-hinting=none"] });
try {
  const shots = planShots(config, baseUrl);
  for (const shot of shots) {
    const vp = VIEWPORTS[shot.device];
    const context = await browser.newContext({
      ...(shot.device === "mobile" ? pwDevices["iPhone 15"] : {}),
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.deviceScaleFactor,
      locale: "ko-KR",
      reducedMotion: "reduce",
      ...(flags.includes("--video") ? { recordVideo: { dir: join(dir, "video") } } : {}),
    });
    const page = await context.newPage();
    if (config.login) {
      await page.goto(`${baseUrl}${config.login.path}`);
      for (const step of config.login.steps) {
        if (step.fill && step.value !== undefined) await page.fill(step.fill, step.value);
        if (step.click) await page.click(step.click);
      }
    }
    await page.goto(shot.url, { waitUntil: "networkidle" });
    if (shot.waitFor) await page.waitForSelector(shot.waitFor);
    const out = join(dir, shot.file);
    await page.screenshot({
      path: out,
      animations: "disabled",
      caret: "hide",
      scale: "device",
      fullPage: false,
    });
    const sidecar: Sidecar = {
      capturedAt: today,
      sourceCommit,
      url: shot.url,
      viewport: { width: vp.width, height: vp.height, deviceScaleFactor: vp.deviceScaleFactor },
      playwright: pwVersion,
    };
    writeFileSync(join(dir, sidecarPath(shot.file)), `${JSON.stringify(sidecar, null, 2)}\n`);
    console.log(`captured ${shot.file}`);
    await context.close();
  }
  console.log("\n# meta.yaml screens: 아래를 붙여 넣고 alt를 채우세요\nscreens:");
  console.log(metaYamlSnippet(shots, today, sourceCommit));
} finally {
  await browser.close();
  stopServer(server);
}

function stopServer(child: ReturnType<typeof spawn> | undefined): void {
  if (!child?.pid) return;
  if (process.platform === "win32") {
    // shell:true → cmd.exe가 자식, 실제 서버는 손자. /T로 트리 전체를 끝낸다.
    execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: "ignore" });
  } else {
    child.kill();
  }
}

async function waitForServer(url: string): Promise<void> {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`server at ${url} did not start`);
}
