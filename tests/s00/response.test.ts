import { describe, expect, it } from "vitest";
import { createAppError } from "../../src/lib/server/utils/errors.js";
import { handleError, requireAdmin, requireAuth } from "../../src/lib/server/utils/response.js";

describe("S00 response helpers", () => {
  it("maps AppError instances into the structured error contract", async () => {
    const response = handleError(createAppError("SESSION_EXPIRED"));
    expect(response.status).toBe(401);
    const payload = await response.json();
    expect(payload.error.code).toBe("SESSION_EXPIRED");
  });

  it("requires authenticated locals", () => {
    expect(() => requireAuth({ session: null, user: null } as App.Locals)).toThrow();
  });

  it("blocks BoD admin writes through the admin guard", () => {
    expect(() =>
      requireAdmin({
        session: {
          id: "session-1",
          userId: "user-1",
          token: "token",
          expiresAt: new Date()
        },
        user: {
          id: "user-1",
          email: "admin@example.com",
          username: "admin",
          fullName: "Admin",
          role: "ADMIN",
          executiveLabel: true,
          status: "ACTIVE"
        }
      } as App.Locals)
    ).toThrow();
  });
});
