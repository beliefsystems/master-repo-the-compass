import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(async (callback) => callback({})),
  findUserById: vi.fn(),
  updateUserRow: vi.fn(),
  findEmployeeByCode: vi.fn(),
  findEmployeeById: vi.fn(),
  findEmployeeByIdForRestore: vi.fn(),
  findEmployeeByUserId: vi.fn(),
  listEmployees: vi.fn(),
  listEmployeesForOrgChart: vi.fn(),
  insertEmployee: vi.fn(),
  updateEmployeeRow: vi.fn(),
  softDeleteEmployee: vi.fn(),
  restoreEmployeeRow: vi.fn(),
  recordSystemEvent: vi.fn()
}));

vi.mock("$lib/server/db/client", () => ({
  db: { transaction: mocks.transaction }
}));

vi.mock("$lib/server/repositories/user.repository.js", () => ({
  findUserById: mocks.findUserById,
  updateUser: mocks.updateUserRow
}));

vi.mock("$lib/server/repositories/employee.repository.js", () => ({
  findEmployeeByCode: mocks.findEmployeeByCode,
  findEmployeeById: mocks.findEmployeeById,
  findEmployeeByIdForRestore: mocks.findEmployeeByIdForRestore,
  findEmployeeByUserId: mocks.findEmployeeByUserId,
  listEmployees: mocks.listEmployees,
  listEmployeesForOrgChart: mocks.listEmployeesForOrgChart,
  createEmployee: mocks.insertEmployee,
  updateEmployee: mocks.updateEmployeeRow,
  softDeleteEmployee: mocks.softDeleteEmployee,
  restoreEmployee: mocks.restoreEmployeeRow
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

describe("S02 employee service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback) => callback({}));
  });

  it("blocks circular manager chains", async () => {
    const { updateEmployee } = await import("../../src/lib/server/services/employee.service.js");
    mocks.findEmployeeById
      .mockResolvedValueOnce({ id: "employee-1", userId: "user-1", managerId: null, status: "ACTIVE", version: 1 })
      .mockResolvedValueOnce({ id: "manager-1", managerId: "employee-1" });

    await expect(
      updateEmployee(admin, "employee-1", {
        managerId: "manager-1",
        version: 1
      })
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
  });

  it("deactivates the linked user in the same workflow", async () => {
    const { updateEmployee } = await import("../../src/lib/server/services/employee.service.js");
    mocks.findEmployeeById.mockResolvedValueOnce({ id: "employee-1", userId: "user-1", status: "ACTIVE", version: 3 });
    mocks.softDeleteEmployee.mockResolvedValueOnce({ id: "employee-1", userId: "user-1", status: "DEACTIVATED", version: 4 });
    mocks.findUserById.mockResolvedValueOnce({ id: "user-1", version: 7 });
    mocks.updateUserRow.mockResolvedValueOnce({ id: "user-1", status: "DEACTIVATED", version: 8 });

    await expect(updateEmployee(admin, "employee-1", { status: "DEACTIVATED", version: 3 })).resolves.toMatchObject({
      id: "employee-1",
      status: "DEACTIVATED"
    });

    expect(mocks.updateUserRow).toHaveBeenCalledWith("user-1", { status: "DEACTIVATED" }, 7, {});
  });

  it("blocks employee restore when the linked user is not active", async () => {
    const { restoreEmployee } = await import("../../src/lib/server/services/employee.service.js");
    mocks.findEmployeeByIdForRestore.mockResolvedValueOnce({ id: "employee-1", userId: "user-1", status: "DEACTIVATED" });
    mocks.findUserById.mockResolvedValueOnce(null);

    await expect(restoreEmployee(admin, "employee-1", { version: 4 })).rejects.toMatchObject({
      code: "INVALID_STATE_TRANSITION"
    });
  });

  it("builds an org chart tree for any authenticated actor", async () => {
    const { getOrgChart } = await import("../../src/lib/server/services/employee.service.js");
    mocks.listEmployeesForOrgChart.mockResolvedValueOnce([
      { id: "manager-1", userId: "user-1", managerId: null, fullName: "Manager", role: "MANAGER" },
      { id: "employee-1", userId: "user-2", managerId: "manager-1", fullName: "Employee", role: "EMPLOYEE" }
    ]);

    await expect(getOrgChart({ ...admin, role: "EMPLOYEE" })).resolves.toEqual([
      {
        id: "manager-1",
        userId: "user-1",
        managerId: null,
        fullName: "Manager",
        role: "MANAGER",
        children: [
          {
            id: "employee-1",
            userId: "user-2",
            managerId: "manager-1",
            fullName: "Employee",
            role: "EMPLOYEE",
            children: []
          }
        ]
      }
    ]);
  });
});
