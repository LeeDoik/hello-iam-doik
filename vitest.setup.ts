import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// RTL's own auto-cleanup only registers when `afterEach` exists as a global (vitest `globals: true`).
// This project runs vitest without globals, so wire cleanup explicitly for any test file that
// renders more than once (e.g. QualityToggle.test.tsx cycles the same component across tests).
afterEach(() => {
  cleanup();
});
