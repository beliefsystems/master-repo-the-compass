/**
 * PURPOSE: Provide the BetterAuth Svelte client for login, logout, and session reads in the Slice 0 shell.
 * CONNECTIONS: Used by login and protected shell components.
 * LAYER: UI/Auth Client
 * SSOT REFERENCES: Part 23.1, Part 29
 * CONSTRAINTS ENFORCED: Same-origin auth client only; no feature plugins beyond session handling.
 */
import { createAuthClient } from "better-auth/svelte";

export const authClient = createAuthClient();
