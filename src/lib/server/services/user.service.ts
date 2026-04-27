import { auth } from "$lib/server/auth";
import { createAppError } from "$lib/server/utils/errors.js";
import { findUserByEmail, findUserById, findUserByUsername, listUsers, createUser as insertUser, restoreUser as restoreUserRow, softDeleteUser, updateUser as updateUserRow } from "$lib/server/repositories/user.repository.js";
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

export async function getUsers(actor: AuthenticatedActor) {
  if (actor.role !== "ADMIN") {
    if (actor.executiveLabel) {
      return listUsers();
    }
    throw createAppError("PERMISSION_DENIED");
  }

  return listUsers();
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

  await auth.api.signUpEmail({
    body: {
      email: input.email,
      password: input.password,
      name: input.fullName
    },
    headers: new Headers()
  });

  const user = await insertUser({
    fullName: input.fullName,
    email: input.email,
    username: input.username,
    passwordHash: "managed-by-better-auth",
    role: input.role,
    executiveLabel: input.executiveLabel ?? false,
    status: "ACTIVE"
  });

  await recordSystemEvent({
    actorUserId: actor.id,
    eventType: "USER_CREATED",
    entityType: "user",
    entityId: user.id,
    metadata: {
      email: user.email,
      role: user.role
    }
  });

  return user;
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
    updated = await softDeleteUser(userId, input.version);
  } else {
    updated = await updateUserRow(
      userId,
      {
        fullName: input.fullName,
        email: input.email,
        username: input.username,
        role: input.role,
        status: input.status,
        executiveLabel: input.executiveLabel
      },
      input.version
    );
  }

  if (!updated) {
    throw createAppError("CONCURRENT_MODIFICATION");
  }

  await recordSystemEvent({
    actorUserId: actor.id,
    eventType: updated.status === "DEACTIVATED" ? "USER_DEACTIVATED" : "USER_UPDATED",
    entityType: "user",
    entityId: updated.id,
    metadata: {
      status: updated.status
    }
  });

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

  const restored = await restoreUserRow(userId, input.version);
  if (!restored) {
    throw createAppError("CONCURRENT_MODIFICATION");
  }

  await recordSystemEvent({
    actorUserId: actor.id,
    eventType: "USER_RESTORED",
    entityType: "user",
    entityId: restored.id
  });

  return restored;
}
