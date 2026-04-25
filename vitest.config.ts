/**
 * PURPOSE: Provide a minimal Vitest configuration for iron-core unit and contract tests.
 * CONNECTIONS: Consumed by package.json scripts and all test files under src/.
 * LAYER: Test Infrastructure
 * SSOT REFERENCES: Part 31 testing checklist references within docs/SSoT_Compass_V1.1_FINAL.md
 * CONSTRAINTS ENFORCED: Non-UI unit tests only; Node environment for pure core modules.
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"]
  }
});
