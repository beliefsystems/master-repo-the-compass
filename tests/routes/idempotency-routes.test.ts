import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getReusableResponse: vi.fn(),
  persistResponse: vi.fn(),
  updateOrganisation: vi.fn(),
  createUser: vi.fn(),
  createObjective: vi.fn(),
  getOrganisation: vi.fn()
}));

vi.mock("$lib/server/services/idempotency.service.js", () => ({
  getReusableResponse: mocks.getReusableResponse,
  persistResponse: mocks.persistResponse
}));

vi.mock("$lib/server/services/organisation.service", () => ({
  getOrganisation: mocks.getOrganisation,
  updateOrganisation: mocks.updateOrganisation
}));

vi.mock("$lib/server/services/user.service.js", () => ({
  createUser: mocks.createUser,
  getUsers: vi.fn()
}));

vi.mock("$lib/server/services/objective.service.js", () => ({
  createObjective: mocks.createObjective,
  getObjectives: vi.fn()
}));

const locals = {
  session: { id: "session-1", userId: "user-1", token: "token", expiresAt: new Date() },
  user: {
    id: "user-1",
    email: "admin@example.com",
    username: "admin",
    fullName: "Admin",
    role: "ADMIN" as const,
    executiveLabel: false,
    status: "ACTIVE" as const
  }
};

describe("route idempotency replay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getReusableResponse.mockResolvedValue({
      responseStatus: 200,
      responseBody: { replayed: true }
    });
  });

  it("short-circuits PATCH /api/v1/org before service execution", async () => {
    const { PATCH } = await import("../../src/routes/api/v1/org/+server.js");
    const response = await PATCH({
      request: new Request("http://localhost/api/v1/org", {
        method: "PATCH",
        headers: { "Idempotency-Key": "11111111-1111-4111-8111-111111111111" },
        body: "{not-json"
      }),
      locals,
      url: new URL("http://localhost/api/v1/org")
    } as never);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ replayed: true });
    expect(mocks.updateOrganisation).not.toHaveBeenCalled();
  });

  it("short-circuits POST /api/v1/users before service execution", async () => {
    const { POST } = await import("../../src/routes/api/v1/users/+server.js");
    const response = await POST({
      request: new Request("http://localhost/api/v1/users", {
        method: "POST",
        headers: { "Idempotency-Key": "22222222-2222-4222-8222-222222222222" },
        body: "{not-json"
      }),
      locals,
      url: new URL("http://localhost/api/v1/users")
    } as never);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ replayed: true });
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("short-circuits POST /api/v1/objectives before service execution", async () => {
    const { POST } = await import("../../src/routes/api/v1/objectives/+server.js");
    const response = await POST({
      request: new Request("http://localhost/api/v1/objectives", {
        method: "POST",
        headers: { "Idempotency-Key": "33333333-3333-4333-8333-333333333333" },
        body: "{not-json"
      }),
      locals,
      url: new URL("http://localhost/api/v1/objectives")
    } as never);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ replayed: true });
    expect(mocks.createObjective).not.toHaveBeenCalled();
  });
});
