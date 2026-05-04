import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signUpEmail: vi.fn(),
  transaction: vi.fn(async (callback) => callback({})),
  countActiveWritableAdmins: vi.fn(),
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  findUserByUsername: vi.fn(),
  listUsers: vi.fn(),
  insertUser: vi.fn(),
  restoreUserRow: vi.fn(),
  softDeleteUser: vi.fn(),
  updateUserRow: vi.fn(),
  recordSystemEvent: vi.fn()
}));

vi.mock("$lib/server/auth", () => ({
  auth: {
    api: {
      signUpEmail: mocks.signUpEmail
    }
  }
}));

vi.mock("$lib/server/db/client", () => ({
  db: { transaction: mocks.transaction }
}));

vi.mock("$lib/server/repositories/user.repository.js", () => ({
  countActiveWritableAdmins: mocks.countActiveWritableAdmins,
  findUserByEmail: mocks.findUserByEmail,
  findUserById: mocks.findUserById,
  findUserByUsername: mocks.findUserByUsername,
  listUsers: mocks.listUsers,
  createUser: mocks.insertUser,
  restoreUser: mocks.restoreUserRow,
  softDeleteUser: mocks.softDeleteUser,
  updateUser: mocks.updateUserRow
}));

vi.mock("../../src/lib/server/services/audit.service.js", () => ({
  recordSystemEvent: mocks.recordSystemEvent
}));

const admin = {
  id: "admin-1",
  email: "admin@example.com",
  username: "admin",
  fullName: "Admin",
  role: "ADMIN" as const,
  executiveLabel: false,
  status: "ACTIVE" as const
};

describe("S02 user service hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback) => callback({}));
  });

  it("creates auth user, app user, and audit event", async () => {
    const { createUser } = await import("../../src/lib/server/services/user.service.js");
    mocks.findUserByEmail.mockResolvedValueOnce(null);
    mocks.findUserByUsername.mockResolvedValueOnce(null);
    mocks.signUpEmail.mockResolvedValueOnce({ user: { id: "auth-user-1" } });
    mocks.insertUser.mockResolvedValueOnce({
      id: "app-user-1",
      fullName: "New User",
      email: "new@example.com",
      username: "new",
      role: "EMPLOYEE",
      executiveLabel: false,
      status: "ACTIVE",
      version: 1
    });

    await expect(
      createUser(admin, {
        fullName: "New User",
        email: "new@example.com",
        username: "new",
        password: "Password123",
        role: "EMPLOYEE"
      })
    ).resolves.toMatchObject({ id: "app-user-1" });

    expect(mocks.signUpEmail).toHaveBeenCalledTimes(1);
    expect(mocks.insertUser).toHaveBeenCalledTimes(1);
    expect(mocks.recordSystemEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: "USER_CREATED" }), {});
  });

  it("maps auth signup failures to structured non-500 app errors", async () => {
    const { createUser } = await import("../../src/lib/server/services/user.service.js");
    mocks.findUserByEmail.mockResolvedValueOnce(null);
    mocks.findUserByUsername.mockResolvedValueOnce(null);
    mocks.signUpEmail.mockRejectedValueOnce(new Error("auth duplicate"));

    await expect(
      createUser(admin, {
        fullName: "New User",
        email: "new@example.com",
        username: "new",
        password: "Password123",
        role: "EMPLOYEE"
      })
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("blocks deactivating the last active writable admin", async () => {
    const { updateUser } = await import("../../src/lib/server/services/user.service.js");
    mocks.findUserById.mockResolvedValueOnce({
      id: "admin-1",
      role: "ADMIN",
      status: "ACTIVE",
      executiveLabel: false,
      email: "admin@example.com",
      username: "admin"
    });
    mocks.countActiveWritableAdmins.mockResolvedValueOnce(1);

    await expect(updateUser(admin, "admin-1", { status: "DEACTIVATED", version: 1 })).rejects.toMatchObject({
      code: "PRECONDITION_FAILED"
    });
  });
});
