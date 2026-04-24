/**
 * PURPOSE: Expose the pre-wired backend core entrypoint for future repositories and services.
 * CONNECTIONS: Re-exports db schema, constants, state machines, calculations, fiscal helpers, validation, and errors.
 * LAYER: Composition / Public API
 * SSOT REFERENCES: Part 23, Part 24, Part 25, Part 26, Part 28.6
 * CONSTRAINTS ENFORCED: No UI logic; exports only backend core primitives and types.
 */
export * from "./db/schema/index.js";
export * from "./core/constants.js";
export * from "./core/errors.js";
export * from "./core/state-machines.js";
export * from "./core/fiscal.js";
export * from "./core/calc.js";
export * from "./core/validation/index.js";
