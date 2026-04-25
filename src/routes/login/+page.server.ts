/**
 * PURPOSE: Handle Slice 0 email/password sign-in using BetterAuth server APIs.
 * CONNECTIONS: Uses the BetterAuth server instance and the sveltekitCookies plugin for cookie persistence.
 * LAYER: Routes / Controller
 * SSOT REFERENCES: Part 23.1, Part 29
 * CONSTRAINTS ENFORCED: Minimal login flow only; no signup/reset/profile features in Slice 0.
 */
import { fail, redirect } from "@sveltejs/kit";
import { auth } from "$lib/server/auth";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.session) {
    throw redirect(302, "/app");
  }

  return {};
};

export const actions: Actions = {
  default: async (event) => {
    const formData = await event.request.formData();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      return fail(400, {
        message: "Email and password are required.",
        values: { email }
      });
    }

    try {
      await auth.api.signInEmail({
        body: {
          email,
          password
        },
        headers: event.request.headers
      });
    } catch {
      return fail(401, {
        message: "Invalid credentials.",
        values: { email }
      });
    }

    throw redirect(303, "/app");
  }
};
