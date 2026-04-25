/**
 * PURPOSE: Provide a lightweight health endpoint for local runtime verification.
 * CONNECTIONS: Used to confirm the app server is up independently of auth and database reads.
 * LAYER: Routes / Controller
 * SSOT REFERENCES: Slice 0 runtime verification only
 * CONSTRAINTS ENFORCED: No business logic; no protected data exposure.
 */
import { json } from "@sveltejs/kit";

export const GET = async () => {
  return json({
    status: "ok"
  });
};
