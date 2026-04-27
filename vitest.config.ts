/**
 * PURPOSE: Provide a minimal Vitest configuration for iron-core unit and contract tests.
 * CONNECTIONS: Consumed by package.json scripts and all test files under src/.
 * LAYER: Test Infrastructure
 * SSOT REFERENCES: Part 31 testing checklist references within docs/SSoT_Compass_V1.1_FINAL.md
 * CONSTRAINTS ENFORCED: Non-UI unit tests only; Node environment for pure core modules.
 */
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      $lib: fileURLToPath(new URL("./src/lib", import.meta.url))
    }
  },
  test: {
    environment: "node",
    include: ["tests/s00/**/*.test.ts"]
  }
});
