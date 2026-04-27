import { auth } from "$lib/server/auth";
import { createAppError } from "$lib/server/utils/errors.js";
import { findUserByEmail, findUserByUsernameOrEmail } from "$lib/server/repositories/user.repository.js";
import { findActiveSessionByToken, revokeSessionByToken, touchSession, upsertSession } from "$lib/server/repositories/session.repository.js";
import { recordSystemEvent } from "./audit.service.js";

export interface AuthenticatedActor {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  executiveLabel: boolean;
  status: "ACTIVE" | "DEACTIVATED";
}

export const APP_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export async function loginWithPassword(input: {
  usernameOrEmail: string;
  password: string;
  headers: Headers;
}) {
  const appUser = await findUserByUsernameOrEmail(input.usernameOrEmail);
  if (!appUser || appUser.status !== "ACTIVE") {
    throw createAppError("INVALID_CREDENTIALS");
  }

  const signInResult = await auth.api.signInEmail({
    body: {
      email: appUser.email,
      password: input.password
    },
    headers: input.headers
  });

  const expiresAt = new Date(Date.now() + APP_SESSION_TTL_SECONDS * 1000);
  const session = await upsertSession({
    userId: appUser.id,
    sessionToken: signInResult.token,
    expiresAt
  });

  return {
    user: {
      id: appUser.id,
      fullName: appUser.fullName,
      email: appUser.email,
      username: appUser.username,
      role: appUser.role,
      executiveLabel: appUser.executiveLabel,
      status: appUser.status
    },
    session: {
      id: session.id,
      expiresAt: session.expiresAt
    }
  };
}

export async function logout(headers: Headers) {
  const authSession = await auth.api.getSession({
    headers
  });

  if (!authSession?.session) {
    throw createAppError("SESSION_EXPIRED");
  }

  await auth.api.signOut({
    headers
  });

  const appUser = await findUserByEmail(authSession.user.email);
  await revokeSessionByToken(authSession.session.token);

  if (appUser) {
    await recordSystemEvent({
      actorUserId: appUser.id,
      eventType: "SESSION_REVOKED",
      entityType: "session",
      metadata: {
        token: authSession.session.token
      }
    });
  }
}

export async function resolveLocals(headers: Headers) {
  const authSession = await auth.api.getSession({
    headers
  });

  if (!authSession?.session) {
    return {
      session: null,
      user: null
    };
  }

  const appUser = await findUserByEmail(authSession.user.email);
  if (!appUser || appUser.status !== "ACTIVE") {
    return {
      session: null,
      user: null
    };
  }

  let appSession = await findActiveSessionByToken(authSession.session.token);

  if (!appSession) {
    appSession = await upsertSession({
      userId: appUser.id,
      sessionToken: authSession.session.token,
      expiresAt: authSession.session.expiresAt
    });
  } else {
    await touchSession(authSession.session.token);
  }

  return {
    session: {
      id: appSession.id,
      userId: appUser.id,
      token: authSession.session.token,
      expiresAt: appSession.expiresAt
    },
    user: {
      id: appUser.id,
      email: appUser.email,
      username: appUser.username,
      fullName: appUser.fullName,
      role: appUser.role,
      executiveLabel: appUser.executiveLabel,
      status: appUser.status
    }
  };
}
