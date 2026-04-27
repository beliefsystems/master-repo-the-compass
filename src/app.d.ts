/**
 * PURPOSE: Declare the SvelteKit app-local session types for BetterAuth-backed server locals.
 * CONNECTIONS: Used by hooks, server routes, and server loads throughout the runtime.
 * LAYER: Runtime Types
 * SSOT REFERENCES: Part 23.1, Part 29 session handling
 * CONSTRAINTS ENFORCED: Minimal auth/session typing only for Slice 0.
 */
declare global {
  namespace App {
    interface Locals {
      session: {
        id: string;
        userId: string;
        token: string;
        expiresAt: Date;
      } | null;
      user: {
        id: string;
        email: string;
        username: string;
        fullName: string;
        role: "ADMIN" | "MANAGER" | "EMPLOYEE";
        executiveLabel: boolean;
        status: "ACTIVE" | "DEACTIVATED";
      } | null;
    }
    interface PageData {
      session: App.Locals["session"];
      user: App.Locals["user"];
    }
  }
}

export {};
