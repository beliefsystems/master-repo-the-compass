/**
 * PURPOSE: Provide the standard className merge helper for shadcn-svelte-compatible components.
 * CONNECTIONS: Used by current and future UI primitives without introducing component-library coupling.
 * LAYER: UI Utility
 * SSOT REFERENCES: docs/#Design.md framework/tooling constraints
 * CONSTRAINTS ENFORCED: Utility-only; no visual policy embedded here.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
