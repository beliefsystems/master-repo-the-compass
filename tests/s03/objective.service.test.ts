import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(async (callback) => callback({})),
  findEmployeeById: vi.fn(),
  findEmployeeByUserId: vi.fn(),
  createObjective: vi.fn(),
  findObjectiveById: vi.fn(),
  listObjectivesByEmployeeMonth: vi.fn(),
  objectiveHasExecutionData: vi.fn(),
  softDeleteObjective: vi.fn(),
  sumEmployeeMonthWeightage: vi.fn(),
  updateObjective: vi.fn()
}));

vi.mock("$lib/server/db/client", () => ({
  db: { transaction: mocks.transaction }
}));

vi.mock("$lib/server/repositories/employee.repository.js", () => ({
  findEmployeeById: mocks.findEmployeeById,
  findEmployeeByUserId: mocks.findEmployeeByUserId
}));

vi.mock("$lib/server/repositories/objective.repository.js", () => ({
  createObjective: mocks.createObjective,
  findObjectiveById: mocks.findObjectiveById,
  listObjectivesByEmployeeMonth: mocks.listObjectivesByEmployeeMonth,
  objectiveHasExecutionData: mocks.objectiveHasExecutionData,
  softDeleteObjective: mocks.softDeleteObjective,
  sumEmployeeMonthWeightage: mocks.sumEmployeeMonthWeightage,
  updateObjective: mocks.updateObjective
}));

const admin = {
  id: "admin-user",
  email: "admin@example.com",
  username: "admin",
  fullName: "Admin",
  role: "ADMIN" as const,
  executiveLabel: false,
  status: "ACTIVE" as const
};

describe("S03 objective service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback) => callback({}));
    mocks.findEmployeeById.mockResolvedValue({ id: "employee-1", userId: "employee-user", managerId: "manager-employee" });
    mocks.listObjectivesByEmployeeMonth.mockResolvedValue([]);
    mocks.sumEmployeeMonthWeightage.mockResolvedValue(0);
  });

  it("rejects save totals below 100.00", async () => {
    const { createObjective } = await import("../../src/lib/server/services/objective.service.js");
    mocks.sumEmployeeMonthWeightage.mockResolvedValueOnce(0);

    await expect(
      createObjective(admin, {
        employeeId: "employee-1",
        title: "Revenue",
        month: 4,
        fiscalYear: 2026,
        weightage: 99.99
      })
    ).rejects.toMatchObject({ code: "WEIGHTAGE_SUM_INVALID" });
  });

  it("rejects save totals above 100.00", async () => {
    const { updateObjective } = await import("../../src/lib/server/services/objective.service.js");
    mocks.findObjectiveById.mockResolvedValueOnce({
      id: "objective-1",
      employeeId: "employee-1",
      month: 4,
      fiscalYear: 2026,
      version: 1
    });
    mocks.sumEmployeeMonthWeightage.mockResolvedValueOnce(50);

    await expect(updateObjective(admin, "objective-1", { weightage: 50.01, version: 1 })).rejects.toMatchObject({
      code: "WEIGHTAGE_SUM_INVALID"
    });
  });

  it("returns exact auto-split weights", async () => {
    const { autoSplitObjectives } = await import("../../src/lib/server/services/objective.service.js");
    await expect(autoSplitObjectives(admin, { count: 3 })).resolves.toEqual({
      weightages: [33.33, 33.33, 33.34]
    });
  });

  it("blocks manager edits for non-direct reports", async () => {
    const { updateObjective } = await import("../../src/lib/server/services/objective.service.js");
    mocks.findObjectiveById.mockResolvedValueOnce({
      id: "objective-1",
      employeeId: "employee-1",
      month: 4,
      fiscalYear: 2026,
      version: 1
    });
    mocks.findEmployeeByUserId.mockResolvedValueOnce({ id: "other-manager-employee", userId: "manager-user" });
    mocks.findEmployeeById.mockResolvedValueOnce({ id: "employee-1", userId: "employee-user", managerId: "manager-employee" });

    await expect(
      updateObjective(
        {
          ...admin,
          id: "manager-user",
          role: "MANAGER"
        },
        "objective-1",
        { title: "Blocked", version: 1 }
      )
    ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
  });

  it("blocks delete when execution data exists", async () => {
    const { deleteObjective } = await import("../../src/lib/server/services/objective.service.js");
    mocks.findObjectiveById.mockResolvedValueOnce({ id: "objective-1", employeeId: "employee-1", version: 1 });
    mocks.objectiveHasExecutionData.mockResolvedValueOnce(true);

    await expect(deleteObjective(admin, "objective-1", { version: 1 })).rejects.toMatchObject({
      code: "OBJECTIVE_HAS_EXECUTION_DATA"
    });
  });

  it("blocks duplicate objective title for the same employee month and fiscal year", async () => {
    const { createObjective } = await import("../../src/lib/server/services/objective.service.js");
    mocks.listObjectivesByEmployeeMonth.mockResolvedValueOnce([
      { id: "objective-existing", title: "Revenue Contribution" }
    ]);

    await expect(
      createObjective(admin, {
        employeeId: "employee-1",
        title: " revenue   contribution ",
        month: 4,
        fiscalYear: 2026,
        weightage: 100
      })
    ).rejects.toMatchObject({ code: "OBJECTIVE_DUPLICATION_BLOCKED" });
  });

  it("allows custom Others text when it is unique", async () => {
    const { createObjective } = await import("../../src/lib/server/services/objective.service.js");
    mocks.listObjectivesByEmployeeMonth.mockResolvedValueOnce([]);
    mocks.sumEmployeeMonthWeightage.mockResolvedValueOnce(0);
    mocks.createObjective.mockResolvedValueOnce({
      id: "objective-1",
      title: "Strategic Initiative",
      weightage: 100
    });

    await expect(
      createObjective(admin, {
        employeeId: "employee-1",
        title: "Strategic Initiative",
        month: 4,
        fiscalYear: 2026,
        weightage: 100
      })
    ).resolves.toMatchObject({ title: "Strategic Initiative" });
  });
});
