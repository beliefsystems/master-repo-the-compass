import { db } from "$lib/server/db/client";
import { createAppError, ValidationAppError } from "$lib/server/utils/errors.js";
import { findUserById, updateUser as updateUserRow } from "$lib/server/repositories/user.repository.js";
import {
  createEmployee as insertEmployee,
  findEmployeeByCode,
  findEmployeeById,
  findEmployeeByIdForRestore,
  findEmployeeByUserId,
  listEmployees,
  listEmployeesForOrgChart,
  restoreEmployee as restoreEmployeeRow,
  softDeleteEmployee,
  updateEmployee as updateEmployeeRow
} from "$lib/server/repositories/employee.repository.js";
import { recordSystemEvent } from "./audit.service.js";
import type { AuthenticatedActor } from "./auth.service.js";

export interface EmployeeTreeNode {
  id: string;
  userId: string;
  managerId: string | null;
  fullName: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  children: EmployeeTreeNode[];
}

function assertAdminWritable(actor: AuthenticatedActor) {
  if (actor.role !== "ADMIN") {
    throw createAppError("PERMISSION_DENIED");
  }
  if (actor.executiveLabel) {
    throw createAppError("BOD_WRITE_FORBIDDEN");
  }
}

async function assertManagerChainIsAcyclic(employeeId: string | null, managerId: string | null | undefined) {
  if (!managerId || !employeeId) return;
  if (managerId === employeeId) {
    throw new ValidationAppError([{ field: "managerId", message: "Manager chain cannot be circular." }]);
  }

  const visited = new Set<string>([employeeId]);
  let currentManagerId: string | null = managerId;

  while (currentManagerId) {
    if (visited.has(currentManagerId)) {
      throw new ValidationAppError([{ field: "managerId", message: "Manager chain cannot be circular." }]);
    }
    visited.add(currentManagerId);
    const manager = await findEmployeeById(currentManagerId);
    if (!manager) {
      throw new ValidationAppError([{ field: "managerId", message: "Manager does not exist." }]);
    }
    currentManagerId = manager.managerId;
  }
}

export async function getEmployees(actor: AuthenticatedActor, filters: Parameters<typeof listEmployees>[0] = {}) {
  if (actor.role !== "ADMIN") {
    throw createAppError("PERMISSION_DENIED");
  }

  return listEmployees(filters);
}

export async function createEmployee(
  actor: AuthenticatedActor,
  input: {
    userId: string;
    managerId?: string | null;
    employeeCode: string;
    fullName: string;
    department?: string;
    division?: string;
    businessUnit?: string;
    location?: string;
    designation?: string;
  }
) {
  assertAdminWritable(actor);

  const user = await findUserById(input.userId);
  if (!user) {
    throw createAppError("USER_NOT_FOUND");
  }
  if (await findEmployeeByUserId(input.userId)) {
    throw createAppError("USER_ALREADY_EXISTS", {
      fields: [{ field: "userId", message: "User already has an employee profile." }]
    });
  }
  if (await findEmployeeByCode(input.employeeCode)) {
    throw createAppError("USER_ALREADY_EXISTS", {
      fields: [{ field: "employeeCode", message: "Employee code already exists." }]
    });
  }
  if (input.managerId) {
    const manager = await findEmployeeById(input.managerId);
    if (!manager) {
      throw new ValidationAppError([{ field: "managerId", message: "Manager does not exist." }]);
    }
  }

  return db.transaction(async (tx) => {
    const employee = await insertEmployee(
      {
        userId: input.userId,
        managerId: input.managerId ?? null,
        employeeCode: input.employeeCode,
        fullName: input.fullName,
        department: input.department,
        division: input.division,
        businessUnit: input.businessUnit,
        location: input.location,
        designation: input.designation,
        status: "ACTIVE"
      },
      tx
    );
    await recordSystemEvent(
      {
        actorUserId: actor.id,
        eventType: "EMPLOYEE_CREATED",
        entityType: "employee",
        entityId: employee.id,
        metadata: { employeeCode: employee.employeeCode, userId: employee.userId }
      },
      tx
    );
    return employee;
  });
}

export async function updateEmployee(
  actor: AuthenticatedActor,
  employeeId: string,
  input: {
    managerId?: string | null;
    fullName?: string;
    department?: string | null;
    division?: string | null;
    businessUnit?: string | null;
    location?: string | null;
    designation?: string | null;
    status?: "ACTIVE" | "DEACTIVATED";
    version: number;
  }
) {
  assertAdminWritable(actor);

  const current = await findEmployeeById(employeeId);
  if (!current) {
    throw createAppError("EMPLOYEE_NOT_FOUND");
  }

  await assertManagerChainIsAcyclic(employeeId, input.managerId);

  const updated = await db.transaction(async (tx) => {
    if (input.status === "DEACTIVATED" && current.status !== "DEACTIVATED") {
      const employee = await softDeleteEmployee(employeeId, input.version, tx);
      if (!employee) return null;
      const user = await findUserById(employee.userId);
      if (user) {
        const linkedUser = await updateUserRow(employee.userId, { status: "DEACTIVATED" }, user.version, tx);
        if (!linkedUser) return null;
      }
      await recordSystemEvent(
        {
          actorUserId: actor.id,
          eventType: "EMPLOYEE_DEACTIVATED",
          entityType: "employee",
          entityId: employee.id
        },
        tx
      );
      return employee;
    }

    const employee = await updateEmployeeRow(
      employeeId,
      {
        managerId: input.managerId,
        fullName: input.fullName,
        department: input.department,
        division: input.division,
        businessUnit: input.businessUnit,
        location: input.location,
        designation: input.designation,
        status: input.status
      },
      input.version,
      tx
    );
    if (!employee) return null;
    await recordSystemEvent(
      {
        actorUserId: actor.id,
        eventType: "EMPLOYEE_UPDATED",
        entityType: "employee",
        entityId: employee.id,
        metadata: { managerId: employee.managerId, status: employee.status }
      },
      tx
    );
    return employee;
  });

  if (!updated) {
    throw createAppError("CONCURRENT_MODIFICATION");
  }

  return updated;
}

export async function restoreEmployee(actor: AuthenticatedActor, employeeId: string, input: { version: number }) {
  assertAdminWritable(actor);

  const current = await findEmployeeByIdForRestore(employeeId);
  if (current && current.status === "ACTIVE") {
    throw createAppError("INVALID_STATE_TRANSITION");
  }
  if (current) {
    const user = await findUserById(current.userId);
    if (!user || user.status !== "ACTIVE") {
      throw createAppError("INVALID_STATE_TRANSITION");
    }
  }

  const restored = await db.transaction(async (tx) => {
    const employee = await restoreEmployeeRow(employeeId, input.version, tx);
    if (!employee) return null;
    await recordSystemEvent(
      {
        actorUserId: actor.id,
        eventType: "EMPLOYEE_RESTORED",
        entityType: "employee",
        entityId: employee.id
      },
      tx
    );
    return employee;
  });

  if (!restored) {
    throw createAppError("CONCURRENT_MODIFICATION");
  }

  return restored;
}

export async function getOrgChart(_actor: AuthenticatedActor): Promise<EmployeeTreeNode[]> {
  const rows = await listEmployeesForOrgChart();
  const nodes = new Map<string, EmployeeTreeNode>();

  for (const row of rows) {
    nodes.set(row.id, { ...row, children: [] });
  }

  const roots: EmployeeTreeNode[] = [];
  for (const node of nodes.values()) {
    if (node.managerId && nodes.has(node.managerId)) {
      nodes.get(node.managerId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
