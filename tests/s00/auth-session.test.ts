import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  findUserByEmail: vi.fn(),
  findActiveSessionByToken: vi.fn(),
  touchSession: vi.fn(),
  upsertSession: vi.fn()
}));

vi.mock("$lib/server/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession
    }
  }
}));

vi.mock("$lib/server/repositories/user.repository.js", () => ({
  findUserByEmail: mocks.findUserByEmail
}));

vi.mock("$lib/server/repositories/session.repository.js", () => ({
  findActiveSessionByToken: mocks.findActiveSessionByToken,
  revokeSessionByToken: vi.fn(),
  touchSession: mocks.touchSession,
  upsertSession: mocks.upsertSession
}));

describe("session touch debounce", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      user: { email: "admin@example.com" },
      session: { token: "token-1", expiresAt: new Date(Date.now() + 60_000) }
    });
    mocks.findUserByEmail.mockResolvedValue({
      id: "user-1",
      email: "admin@example.com",
      username: "admin",
      fullName: "Admin",
      role: "ADMIN",
      executiveLabel: false,
      status: "ACTIVE"
    });
  });

  it("does not touch a fresh session", async () => {
    const { resolveLocals } = await import("../../src/lib/server/services/auth.service.js");
    mocks.findActiveSessionByToken.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      sessionToken: "token-1",
      expiresAt: new Date(Date.now() + 60_000),
      lastSeenAt: new Date()
    });

    await resolveLocals(new Headers());

    expect(mocks.touchSession).not.toHaveBeenCalled();
  });

  it("touches a stale session once", async () => {
    const { resolveLocals } = await import("../../src/lib/server/services/auth.service.js");
    mocks.findActiveSessionByToken.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      sessionToken: "token-1",
      expiresAt: new Date(Date.now() + 60_000),
      lastSeenAt: new Date(Date.now() - 6 * 60_000)
    });

    await resolveLocals(new Headers());

    expect(mocks.touchSession).toHaveBeenCalledTimes(1);
  });
});
