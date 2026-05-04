import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../src/lib/server/core/errors.js";

const mocks = vi.hoisted(() => ({
  tx: {},
  dbTransaction: vi.fn(),
  findOrganisation: vi.fn(),
  findOrganisationConfig: vi.fn(),
  getCurrentOrganisationRecord: vi.fn(),
  updateOrganisationRow: vi.fn(),
  updateOrganisationConfigRow: vi.fn(),
  recordSystemEvent: vi.fn()
}));

vi.mock("$lib/server/db/client", () => ({
  db: {
    transaction: mocks.dbTransaction
  }
}));

vi.mock("$lib/server/repositories/organisation.repository", () => ({
  findOrganisation: mocks.findOrganisation,
  findOrganisationConfig: mocks.findOrganisationConfig,
  getCurrentOrganisationRecord: mocks.getCurrentOrganisationRecord,
  updateOrganisation: mocks.updateOrganisationRow,
  updateOrganisationConfig: mocks.updateOrganisationConfigRow
}));

vi.mock("../../src/lib/server/services/audit.service.js", () => ({
  recordSystemEvent: mocks.recordSystemEvent
}));

const admin = {
  id: "admin-1",
  email: "admin@example.com",
  username: "admin",
  fullName: "Admin",
  role: "ADMIN",
  executiveLabel: false,
  status: "ACTIVE"
} as const;

const employee = {
  ...admin,
  id: "employee-1",
  role: "EMPLOYEE"
} as const;

const bodAdmin = {
  ...admin,
  id: "bod-1",
  executiveLabel: true
} as const;

const organisation = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "THE COMPASS",
  fiscalYearStart: "APRIL",
  timezone: "Asia/Kolkata",
  status: "ACTIVE",
  createdAt: new Date(),
  updatedAt: new Date(),
  version: 1
};

const config = {
  id: "22222222-2222-4222-8222-222222222222",
  organisationId: organisation.id,
  maxImportFileSizeMb: 10,
  pmsCadencesEnabled: ["QUARTERLY", "HALF_YEARLY", "ANNUAL"],
  kpiStatusBands: {
    at_risk: { min: 0, max: 59, label: "At Risk", color: "#EF4444" },
    off_track: { min: 60, max: 79, label: "Off Track", color: "#F59E0B" },
    on_track: { min: 80, max: 99, label: "On Track", color: "#84CC16" },
    achieved: { min: 100, max: null, label: "Achieved", color: "#22C55E" }
  },
  pmsRatingBands: [{ min: 100, max: null, label: "Exceeds Expectations" }],
  createdAt: new Date(),
  updatedAt: new Date(),
  version: 1
};

describe("S01 organisation service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.dbTransaction.mockImplementation(async (callback) => callback(mocks.tx));
    mocks.findOrganisation.mockResolvedValue(organisation);
    mocks.findOrganisationConfig.mockResolvedValue(config);
    mocks.updateOrganisationRow.mockResolvedValue({ ...organisation, name: "Compass HQ", version: 2 });
    mocks.updateOrganisationConfigRow.mockResolvedValue({ ...config, maxImportFileSizeMb: 20, version: 2 });
  });

  it("allows authenticated employees to read organisation and config", async () => {
    const { getOrganisation, getOrganisationConfig } = await import("../../src/lib/server/services/organisation.service.js");

    await expect(getOrganisation(employee)).resolves.toEqual(organisation);
    await expect(getOrganisationConfig(employee)).resolves.toEqual(config);
  });

  it("updates organisation as admin and records an audit event in the transaction", async () => {
    const { updateOrganisation } = await import("../../src/lib/server/services/organisation.service.js");

    await expect(updateOrganisation(admin, { name: "Compass HQ", timezone: "Asia/Kolkata", version: 1 })).resolves.toMatchObject({
      name: "Compass HQ",
      version: 2
    });

    expect(mocks.updateOrganisationRow).toHaveBeenCalledWith({ name: "Compass HQ", timezone: "Asia/Kolkata" }, 1, mocks.tx);
    expect(mocks.recordSystemEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: "ORG_UPDATED" }), mocks.tx);
  });

  it("updates config as admin and records an audit event in the transaction", async () => {
    const { updateOrganisationConfig } = await import("../../src/lib/server/services/organisation.service.js");

    await expect(updateOrganisationConfig(admin, { maxImportFileSizeMb: 20, version: 1 })).resolves.toMatchObject({
      maxImportFileSizeMb: 20,
      version: 2
    });

    expect(mocks.updateOrganisationConfigRow).toHaveBeenCalledWith(
      {
        maxImportFileSizeMb: 20,
        pmsCadencesEnabled: undefined,
        kpiStatusBands: undefined,
        pmsRatingBands: undefined
      },
      1,
      mocks.tx
    );
    expect(mocks.recordSystemEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: "CONFIG_UPDATED" }), mocks.tx);
  });

  it("maps stale versions to CONCURRENT_MODIFICATION", async () => {
    const { updateOrganisationConfig } = await import("../../src/lib/server/services/organisation.service.js");
    mocks.updateOrganisationConfigRow.mockResolvedValueOnce(null);

    await expect(updateOrganisationConfig(admin, { maxImportFileSizeMb: 20, version: 1 })).rejects.toMatchObject({
      code: "CONCURRENT_MODIFICATION"
    });
  });

  it("blocks non-admin and BoD admin writes", async () => {
    const { updateOrganisation } = await import("../../src/lib/server/services/organisation.service.js");

    await expect(updateOrganisation(employee, { name: "Denied", version: 1 })).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
    await expect(updateOrganisation(bodAdmin, { name: "Denied", version: 1 })).rejects.toMatchObject({ code: "BOD_WRITE_FORBIDDEN" });
  });

  it("rejects invalid timezone values", async () => {
    const { updateOrganisation } = await import("../../src/lib/server/services/organisation.service.js");

    await expect(updateOrganisation(admin, { timezone: "Mars/Olympus", version: 1 })).rejects.toBeInstanceOf(AppError);
    await expect(updateOrganisation(admin, { timezone: "Mars/Olympus", version: 1 })).rejects.toMatchObject({
      code: "VALIDATION_FAILED"
    });
  });
});
