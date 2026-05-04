import { db } from "$lib/server/db/client";
import { findEmployeeById, findEmployeeByUserId, listEmployees } from "$lib/server/repositories/employee.repository.js";
import {
  createObjective as insertObjective,
  findObjectiveById,
  listObjectivesByEmployeeMonth,
  objectiveHasExecutionData,
  softDeleteObjective,
  sumEmployeeMonthWeightage,
  updateObjective as updateObjectiveRow
} from "$lib/server/repositories/objective.repository.js";
import { autoSplitWeightage } from "$lib/server/utils/calculation-engine.js";
import { createAppError } from "$lib/server/utils/errors.js";
import type { AuthenticatedActor } from "./auth.service.js";

type ObjectiveStatus = "LAUNCHED" | "ONGOING" | "COMPLETED";

async function getActorEmployee(actor: AuthenticatedActor) {
  return findEmployeeByUserId(actor.id);
}

async function assertCanReadEmployeeObjectives(actor: AuthenticatedActor, employeeId: string) {
  if (actor.role === "ADMIN") {
    return;
  }

  const [actorEmployee, targetEmployee] = await Promise.all([getActorEmployee(actor), findEmployeeById(employeeId)]);
  if (!actorEmployee || !targetEmployee) {
    throw createAppError("PERMISSION_DENIED");
  }

  if (actor.role === "MANAGER" && targetEmployee.managerId === actorEmployee.id) {
    return;
  }

  if (actor.role === "EMPLOYEE" && targetEmployee.userId === actor.id) {
    return;
  }

  throw createAppError("PERMISSION_DENIED");
}

async function assertCanWriteEmployeeObjectives(actor: AuthenticatedActor, employeeId: string) {
  if (actor.executiveLabel) {
    throw createAppError("BOD_WRITE_FORBIDDEN");
  }
  if (actor.role === "ADMIN") {
    return;
  }
  if (actor.role !== "MANAGER") {
    throw createAppError("PERMISSION_DENIED");
  }

  const [actorEmployee, targetEmployee] = await Promise.all([getActorEmployee(actor), findEmployeeById(employeeId)]);
  if (!actorEmployee || !targetEmployee || targetEmployee.managerId !== actorEmployee.id) {
    throw createAppError("PERMISSION_DENIED");
  }
}

function assertWeightageTotal(total: number) {
  if (Number(total.toFixed(2)) !== 100) {
    throw createAppError("WEIGHTAGE_SUM_INVALID", {
      fields: [{ field: "weightage", message: "Employee-month objective weightage must total exactly 100.00." }]
    });
  }
}

function normalizeObjectiveTitle(title: string) {
  return title.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

async function assertObjectiveTitleNotDuplicated(input: {
  employeeId: string;
  month: number;
  fiscalYear: number;
  title: string;
  excludeObjectiveId?: string;
}) {
  const existing = await listObjectivesByEmployeeMonth(input);
  const normalized = normalizeObjectiveTitle(input.title);
  const duplicate = existing.find(
    (objective) =>
      objective.id !== input.excludeObjectiveId &&
      normalizeObjectiveTitle(objective.title) === normalized
  );

  if (duplicate) {
    throw createAppError("OBJECTIVE_DUPLICATION_BLOCKED", {
      fields: [{ field: "title", message: "Objective title already exists for this employee, month, and fiscal year." }]
    });
  }
}

export async function getObjectives(
  actor: AuthenticatedActor,
  input: {
    employeeId: string;
    month: number;
    fiscalYear: number;
  }
) {
  await assertCanReadEmployeeObjectives(actor, input.employeeId);
  return listObjectivesByEmployeeMonth(input);
}

export async function getObjectiveEmployeeOptions(actor: AuthenticatedActor) {
  if (actor.role === "ADMIN") {
    return listEmployees({ status: "ACTIVE", limit: 200 });
  }

  const actorEmployee = await getActorEmployee(actor);
  if (!actorEmployee) {
    return [];
  }

  if (actor.role === "MANAGER") {
    const employees = await listEmployees({ status: "ACTIVE", limit: 200 });
    return employees.filter((employee) => employee.managerId === actorEmployee.id);
  }

  return [actorEmployee];
}

export async function createObjective(
  actor: AuthenticatedActor,
  input: {
    employeeId: string;
    title: string;
    description?: string | null;
    month: number;
    fiscalYear: number;
    weightage: number;
  }
) {
  await assertCanWriteEmployeeObjectives(actor, input.employeeId);

  const employee = await findEmployeeById(input.employeeId);
  if (!employee) {
    throw createAppError("EMPLOYEE_NOT_FOUND");
  }

  await assertObjectiveTitleNotDuplicated(input);

  return db.transaction(async (tx) => {
    const existingTotal = await sumEmployeeMonthWeightage(
      {
        employeeId: input.employeeId,
        month: input.month,
        fiscalYear: input.fiscalYear
      },
      tx
    );
    assertWeightageTotal(existingTotal + input.weightage);

    return insertObjective(
      {
        employeeId: input.employeeId,
        title: input.title,
        description: input.description ?? null,
        month: input.month,
        fiscalYear: input.fiscalYear,
        weightage: Number(input.weightage.toFixed(2)),
        status: "LAUNCHED"
      },
      tx
    );
  });
}

export async function updateObjective(
  actor: AuthenticatedActor,
  objectiveId: string,
  input: {
    title?: string;
    description?: string | null;
    weightage?: number;
    status?: ObjectiveStatus;
    version: number;
  }
) {
  const current = await findObjectiveById(objectiveId);
  if (!current) {
    throw createAppError("OBJECTIVE_NOT_FOUND");
  }

  await assertCanWriteEmployeeObjectives(actor, current.employeeId);

  if (input.title !== undefined) {
    await assertObjectiveTitleNotDuplicated({
      employeeId: current.employeeId,
      month: current.month,
      fiscalYear: current.fiscalYear,
      title: input.title,
      excludeObjectiveId: current.id
    });
  }

  return db.transaction(async (tx) => {
    if (input.weightage !== undefined) {
      const existingTotal = await sumEmployeeMonthWeightage(
        {
          employeeId: current.employeeId,
          month: current.month,
          fiscalYear: current.fiscalYear,
          excludeObjectiveId: current.id
        },
        tx
      );
      assertWeightageTotal(existingTotal + input.weightage);
    }

    const updated = await updateObjectiveRow(
      objectiveId,
      {
        title: input.title,
        description: input.description,
        weightage: input.weightage === undefined ? undefined : Number(input.weightage.toFixed(2)),
        status: input.status
      },
      input.version,
      tx
    );

    if (!updated) {
      throw createAppError("CONCURRENT_MODIFICATION");
    }

    return updated;
  });
}

export async function deleteObjective(actor: AuthenticatedActor, objectiveId: string, input: { version: number }) {
  if (actor.role !== "ADMIN") {
    throw createAppError(actor.executiveLabel ? "BOD_WRITE_FORBIDDEN" : "PERMISSION_DENIED");
  }
  if (actor.executiveLabel) {
    throw createAppError("BOD_WRITE_FORBIDDEN");
  }

  const current = await findObjectiveById(objectiveId);
  if (!current) {
    throw createAppError("OBJECTIVE_NOT_FOUND");
  }
  if (await objectiveHasExecutionData(objectiveId)) {
    throw createAppError("OBJECTIVE_HAS_EXECUTION_DATA");
  }

  return db.transaction(async (tx) => {
    const deleted = await softDeleteObjective(objectiveId, input.version, tx);
    if (!deleted) {
      throw createAppError("CONCURRENT_MODIFICATION");
    }

    return deleted;
  });
}

export async function autoSplitObjectives(actor: AuthenticatedActor, input: { count: number }) {
  if (actor.executiveLabel) {
    throw createAppError("BOD_WRITE_FORBIDDEN");
  }
  if (actor.role !== "ADMIN" && actor.role !== "MANAGER") {
    throw createAppError("PERMISSION_DENIED");
  }

  const weightages = autoSplitWeightage(input.count);
  assertWeightageTotal(weightages.reduce((sum, value) => sum + value, 0));
  return { weightages };
}
