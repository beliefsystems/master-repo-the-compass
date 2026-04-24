/**
 * PURPOSE: Expose shared non-UI type contracts for the iron core.
 * CONNECTIONS: Re-exported by backend modules and tests to prevent duplicated type hierarchies.
 * LAYER: Shared Types
 * SSOT REFERENCES: Part 24 JSON payload fields, Part 26 calculation inputs/outputs, Part 28 response error fields
 * CONSTRAINTS ENFORCED: Type-only shared contracts; no runtime business logic.
 */
export * from "./types/index.js";
