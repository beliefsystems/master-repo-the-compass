/**
 * PURPOSE: Configure SvelteKit preprocessing, adapter selection, and path aliases for THE COMPASS.
 * CONNECTIONS: Used by Vite, SvelteKit routing, and shared `$lib` imports across the runtime.
 * LAYER: Runtime Infrastructure
 * SSOT REFERENCES: Part 23.1, docs/#Design.md framework constraints
 * CONSTRAINTS ENFORCED: SvelteKit 2 runtime, TypeScript-compatible aliases, no dark-mode-specific behavior.
 */
import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      $server: "src/lib/server",
      $shared: "src/lib/shared"
    }
  }
};

export default config;
