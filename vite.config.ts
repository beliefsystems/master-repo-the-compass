/**
 * PURPOSE: Configure Vite for SvelteKit and Tailwind CSS.
 * CONNECTIONS: Loaded by `vite`, `svelte-kit`, and Tailwind during local development and builds.
 * LAYER: Runtime Infrastructure
 * SSOT REFERENCES: Part 23.1, docs/#Design.md Tailwind requirement
 * CONSTRAINTS ENFORCED: Fast dev server, minimal plugin surface, Tailwind integration for Slice 0 shell.
 */
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    port: 5173,
    strictPort: true
  }
});
