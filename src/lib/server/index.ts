/**
 * PURPOSE: Expose the pre-wired backend core entrypoint for future repositories and services.
 * CONNECTIONS: Re-exports db schema, constants, state machines, calculations, fiscal helpers, validation, and errors.
 * LAYER: Composition / Public API
 * SSOT REFERENCES: Part 23, Part 24, Part 25, Part 26, Part 28.6
 * CONSTRAINTS ENFORCED: No UI logic; exports only backend core primitives and types.
 */
export * from "./db/foundation-schema.js";
export * from "./utils/errors.js";
export * from "./utils/response.js";
export * from "./validation/foundation.js";
