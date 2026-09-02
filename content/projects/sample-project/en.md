## Problem
We needed an example that proves the content model is validated at build time.

## Approach
Schemas are functions so the same rules run in Vitest and in Astro.

## Result
A missing field or image fails the build.

## What I learned
A schema is documentation, type source and test in one place.
