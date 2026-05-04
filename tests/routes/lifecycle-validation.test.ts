import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  restoreUser: vi.fn(),
  createEmployee: vi.fn(),
  getReusableResponse: vi.fn(),
  persistResponse: vi.fn()
}));

vi.mock("$lib/server/services/user.service.js", () => ({
  restoreUser: mocks.restoreUser
}));

vi.mock("$lib/server/services/employee.service.js", () => ({
  createEmployee: mocks.createEmployee,
  getEmployees: vi.fn()
}));

vi.mock("$lib/server/services/idempotency.service.js", () => ({
  getReusableResponse: mocks.getReusableResponse,
  persistResponse: mocks.persistResponse
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

describe("lifecycle route registration and validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getReusableResponse.mockResolvedValue(null);
  });

  it("supports POST /api/v1/users/:id/restore", async () => {
    const { POST } = await import("../../src/routes/api/v1/users/[id]/restore/+server.js");
    mocks.restoreUser.mockResolvedValueOnce({
      id: "user-2",
      fullName: "Restored",
      email: "restored@example.com",
      username: "restored",
      role: "EMPLOYEE",
      executiveLabel: false,
      status: "ACTIVE",
      version: 3
    });

    const response = await POST({
      request: new Request("http://localhost/api/v1/users/user-2/restore", {
        method: "POST",
        body: JSON.stringify({ version: 2 })
      }),
      locals,
      params: { id: "user-2" },
      url: new URL("http://localhost/api/v1/users/user-2/restore")
    } as never);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "ACTIVE", version: 3 });
    expect(mocks.restoreUser).toHaveBeenCalledTimes(1);
  });

  it("accepts S02 employee create payload fields", async () => {
    const { POST } = await import("../../src/routes/api/v1/employees/+server.js");
    mocks.createEmployee.mockResolvedValueOnce({
      id: "employee-1",
      userId: "11111111-1111-4111-8111-111111111111",
      managerId: null,
      employeeCode: "EMP-001",
      fullName: "Employee One",
      department: "QA",
      division: null,
      businessUnit: null,
      location: null,
      designation: "Tester",
      status: "ACTIVE",
      version: 1
    });

    const response = await POST({
      request: new Request("http://localhost/api/v1/employees", {
        method: "POST",
        body: JSON.stringify({
          userId: "11111111-1111-4111-8111-111111111111",
          employeeCode: "EMP-001",
          fullName: "Employee One",
          department: "QA",
          designation: "Tester"
        })
      }),
      locals,
      url: new URL("http://localhost/api/v1/employees")
    } as never);

    expect(response.status).toBe(201);
    expect(mocks.createEmployee).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ employeeCode: "EMP-001" }));
  });

  it("rejects user-only payload for employee creation", async () => {
    const { POST } = await import("../../src/routes/api/v1/employees/+server.js");
    const response = await POST({
      request: new Request("http://localhost/api/v1/employees", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Wrong",
          email: "wrong@example.com",
          username: "wrong",
          password: "Password123",
          role: "EMPLOYEE"
        })
      }),
      locals,
      url: new URL("http://localhost/api/v1/employees")
    } as never);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "VALIDATION_FAILED" } });
  });
});
