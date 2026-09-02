import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { adrFileName, nextAdrNumber } from "../src/lib/adr";

const title = process.argv.slice(2).join(" ").trim();
if (!title) {
  console.error('usage: pnpm adr "Decision title"');
  process.exit(1);
}
const dir = join(process.cwd(), "docs", "adr");
mkdirSync(dir, { recursive: true });
const n = nextAdrNumber(readdirSync(dir));
const file = join(dir, adrFileName(n, title));
if (existsSync(file)) throw new Error(`exists: ${file}`);
const date = new Date().toISOString().slice(0, 10);
writeFileSync(
  file,
  `---
title: ${title}
status: proposed
date: ${date}
---

# ${title}

## Context and Problem Statement

## Considered Options
-

## Decision Outcome
선택:

### Consequences
- 좋은 점:
- 나쁜 점 / 감수한 것:
- 되돌리는 조건(deletion trigger):

## Try it (5분 실험)

## What I learned

`,
);
console.log(`created ${file}`);
