import { and, asc, eq, isNull, ne, sum } from "drizzle-orm";
import { db } from "$lib/server/db/client";
import { objectives, type NewObjective } from "$lib/server/db/foundation-schema";
import { ORG_ID_CONSTANT, type DatabaseExecutor } from "./base.js";

export async function findObjectiveById(objectiveId: string) {
  const [record] = await db
    .select()
    .from(objectives)
    .where(and(eq(objectives.id, objectiveId), eq(objectives.organisationId, ORG_ID_CONSTANT), isNull(objectives.deletedAt)))
    .limit(1);

  return record ?? null;
}

export async function listObjectivesByEmployeeMonth(input: {
  employeeId: string;
  month: number;
  fiscalYear: number;
}) {
  return db
    .select()
    .from(objectives)
    .where(
      and(
        eq(objectives.organisationId, ORG_ID_CONSTANT),
        isNull(objectives.deletedAt),
        eq(objectives.employeeId, input.employeeId),
        eq(objectives.month, input.month),
        eq(objectives.fiscalYear, input.fiscalYear)
      )
    )
    .orderBy(asc(objectives.createdAt), asc(objectives.id));
}

export async function createObjective(input: Omit<NewObjective, "organisationId">, client: DatabaseExecutor = db) {
  const [record] = await client
    .insert(objectives)
    .values({
      ...input,
      organisationId: ORG_ID_CONSTANT
    })
    .returning();

  return record;
}

export async function updateObjective(
  objectiveId: string,
  patch: Partial<Pick<NewObjective, "title" | "description" | "weightage" | "status">>,
  expectedVersion: number,
  client: DatabaseExecutor = db
) {
  const [record] = await client
    .update(objectives)
    .set({
      ...patch,
      updatedAt: new Date(),
      version: expectedVersion + 1
    })
    .where(
      and(
        eq(objectives.id, objectiveId),
        eq(objectives.organisationId, ORG_ID_CONSTANT),
        isNull(objectives.deletedAt),
        eq(objectives.version, expectedVersion)
      )
    )
    .returning();

  return record ?? null;
}

export async function softDeleteObjective(objectiveId: string, expectedVersion: number, client: DatabaseExecutor = db) {
  const [record] = await client
    .update(objectives)
    .set({
      status: "DELETED",
      deletedAt: new Date(),
      updatedAt: new Date(),
      version: expectedVersion + 1
    })
    .where(
      and(
        eq(objectives.id, objectiveId),
        eq(objectives.organisationId, ORG_ID_CONSTANT),
        isNull(objectives.deletedAt),
        eq(objectives.version, expectedVersion)
      )
    )
    .returning();

  return record ?? null;
}

export async function sumEmployeeMonthWeightage(input: {
  employeeId: string;
  month: number;
  fiscalYear: number;
  excludeObjectiveId?: string;
}, client: DatabaseExecutor = db) {
  const conditions = [
    eq(objectives.organisationId, ORG_ID_CONSTANT),
    isNull(objectives.deletedAt),
    eq(objectives.employeeId, input.employeeId),
    eq(objectives.month, input.month),
    eq(objectives.fiscalYear, input.fiscalYear)
  ];
  if (input.excludeObjectiveId) {
    conditions.push(ne(objectives.id, input.excludeObjectiveId));
  }

  const [record] = await client
    .select({
      total: sum(objectives.weightage)
    })
    .from(objectives)
    .where(and(...conditions));

  return Number(record?.total ?? 0);
}

export async function objectiveHasExecutionData(_objectiveId: string) {
  // S03 ships before KPI execution tables exist; later slices replace this with real execution-data checks.
  return false;
}
