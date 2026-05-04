/**
 * PURPOSE: Re-export the active foundation schema through S01.
 * CONNECTIONS: Kept as a compatibility entrypoint for tests or future imports that expect db/schema.
 * LAYER: Schema / Models
 * SSOT REFERENCES: S00 Foundation, S01 Organisation & Config
 * CONSTRAINTS ENFORCED: No future-slice tables are active before their slice is implemented.
 */
export * from "./foundation-schema.js";
