import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db/client";
import { createAppError } from "$lib/server/utils/errors.js";
import {
  countActiveWritableAdmins,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  listUsers,
  createUser as insertUser,
  restoreUser as restoreUserRow,
  softDeleteUser,
  updateUser as updateUserRow
} from "$lib/server/repositories/user.repository.js";
import { recordSystemEvent } from "./audit.service.js";
import type { AuthenticatedActor } from "./auth.service.js";

function assertAdminWritable(actor: AuthenticatedActor) {
  if (actor.role !== "ADMIN") {
    throw createAppError("PERMISSION_DENIED");
  }
  if (actor.executiveLabel) {
    throw createAppError("BOD_WRITE_FORBIDDEN");
  }
}

async function signUpAuthUser(input: { fullName: string; email: string; password: string }) {
  try {
    return await auth.api.signUpEmail({
      body: {
        email: input.email,
        password: input.password,
        name: input.fullName
      },
      headers: new Headers()
    });
  } catch (error) {
    console.error("BetterAuth signUpEmail failed during app user creation", {
      email: input.email,
      error
    });
    throw createAppError("PRECONDITION_FAILED", {
      fields: [{ field: "email", message: "Authentication account could not be created. Check whether the email already exists in auth." }]
    });
  }
}

async function assertNotLastWritableAdminChange(current: Awaited<ReturnType<typeof findUserById>>, input: {
  role?: "ADMIN" | "MANAGER" | "EMPLOYEE";
  status?: "ACTIVE" | "DEACTIVATED";
  executiveLabel?: boolean;
}) {
  if (!current) return;
  const currentlyWritableAdmin = current.role === "ADMIN" && current.status === "ACTIVE" && !current.executiveLabel;
  if (!currentlyWritableAdmin) return;

  const remainsWritableAdmin =
    (input.role ?? current.role) === "ADMIN" &&
    (input.status ?? current.status) === "ACTIVE" &&
    (input.executiveLabel ?? current.executiveLabel) === false;

  if (remainsWritableAdmin) return;

  if ((await countActiveWritableAdmins()) <= 1) {
    throw createAppError("PRECONDITION_FAILED", {
      fields: [{ field: "status", message: "At least one active writable ADMIN must remain." }]
    });
  }
}

export async function getUsers(actor: AuthenticatedActor, filters: Parameters<typeof listUsers>[0] = {}) {
  if (actor.role !== "ADMIN") {
    if (actor.executiveLabel) {
      return listUsers(filters);
    }
    throw createAppError("PERMISSION_DENIED");
  }

  return listUsers(filters);
}

export async function createUser(
  actor: AuthenticatedActor,
  input: {
    fullName: string;
    email: string;
    username: string;
    password: string;
    role: "ADMIN" | "MANAGER" | "EMPLOYEE";
    executiveLabel?: boolean;
  }
) {
  assertAdminWritable(actor);

  if (await findUserByEmail(input.email)) {
    throw createAppError("USER_ALREADY_EXISTS", {
      fields: [{ field: "email", message: "Email already exists." }]
    });
  }
  if (await findUserByUsername(input.username)) {
    throw createAppError("USER_ALREADY_EXISTS", {
      fields: [{ field: "username", message: "Username already exists." }]
    });
  }

  await signUpAuthUser(input);

  return db.transaction(async (tx) => {
    const user = await insertUser({
      fullName: input.fullName,
      email: input.email,
      username: input.username,
      passwordHash: "managed-by-better-auth",
      role: input.role,
      executiveLabel: input.executiveLabel ?? false,
      status: "ACTIVE"
    }, tx);

    await recordSystemEvent({
      actorUserId: actor.id,
      eventType: "USER_CREATED",
      entityType: "user",
      entityId: user.id,
      metadata: {
        email: user.email,
        role: user.role
      }
    }, tx);

    return user;
  });
}

export async function updateUser(
  actor: AuthenticatedActor,
  userId: string,
  input: {
    fullName?: string;
    email?: string;
    username?: string;
    role?: "ADMIN" | "MANAGER" | "EMPLOYEE";
    status?: "ACTIVE" | "DEACTIVATED";
    executiveLabel?: boolean;
    version: number;
  }
) {
  assertAdminWritable(actor);

  const current = await findUserById(userId);
  if (!current) {
    throw createAppError("USER_NOT_FOUND");
  }

  await assertNotLastWritableAdminChange(current, input);

  if (input.email && input.email !== current.email) {
    const duplicate = await findUserByEmail(input.email);
    if (duplicate && duplicate.id !== current.id) {
      throw createAppError("USER_ALREADY_EXISTS", {
        fields: [{ field: "email", message: "Email already exists." }]
      });
    }
  }

  if (input.username && input.username !== current.username) {
    const duplicate = await findUserByUsername(input.username);
    if (duplicate && duplicate.id !== current.id) {
      throw createAppError("USER_ALREADY_EXISTS", {
        fields: [{ field: "username", message: "Username already exists." }]
      });
    }
  }

  let updated;

  if (input.status === "DEACTIVATED" && current.status !== "DEACTIVATED") {
    updated = await db.transaction(async (tx) => {
      const user = await softDeleteUser(userId, input.version, tx);
      if (!user) return null;
      await recordSystemEvent({
        actorUserId: actor.id,
        eventType: "USER_DEACTIVATED",
        entityType: "user",
        entityId: user.id,
        metadata: {
          status: user.status
        }
      }, tx);
      return user;
    });
  } else {
    updated = await db.transaction(async (tx) => {
      const user = await updateUserRow(
        userId,
        {
          fullName: input.fullName,
          email: input.email,
          username: input.username,
          role: input.role,
          status: input.status,
          executiveLabel: input.executiveLabel
        },
        input.version,
        tx
      );
      if (!user) return null;
      await recordSystemEvent({
        actorUserId: actor.id,
        eventType: "USER_UPDATED",
        entityType: "user",
        entityId: user.id,
        metadata: {
          status: user.status
        }
      }, tx);
      return user;
    });
  }

  if (!updated) {
    throw createAppError("CONCURRENT_MODIFICATION");
  }

  return updated;
}

export async function restoreUser(
  actor: AuthenticatedActor,
  userId: string,
  input: {
    version: number;
  }
) {
  assertAdminWritable(actor);

  const current = await findUserById(userId);
  if (current && current.status === "ACTIVE") {
    throw createAppError("INVALID_STATE_TRANSITION");
  }

  const restored = await db.transaction(async (tx) => {
    const user = await restoreUserRow(userId, input.version, tx);
    if (!user) return null;
    await recordSystemEvent({
      actorUserId: actor.id,
      eventType: "USER_RESTORED",
      entityType: "user",
      entityId: user.id
    }, tx);
    return user;
  });
  if (!restored) {
    throw createAppError("CONCURRENT_MODIFICATION");
  }

  return restored;
}
