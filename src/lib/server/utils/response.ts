import { json } from "@sveltejs/kit";
import { AppError, createAppError } from "./errors.js";

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    return json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.fields ? { fields: error.fields } : {}),
          ...(error.requestId ? { request_id: error.requestId } : {})
        }
      },
      { status: error.httpStatus }
    );
  }

  const fallback = createAppError("INTERNAL_SERVER_ERROR");
  return json(
    {
      error: {
        code: fallback.code,
        message: fallback.message
      }
    },
    { status: fallback.httpStatus }
  );
}

export function requireAuth(locals: App.Locals) {
  if (!locals.session || !locals.user) {
    throw createAppError("SESSION_EXPIRED");
  }

  return locals.user;
}

export function requireAdmin(locals: App.Locals) {
  const user = requireAuth(locals);
  if (user.role !== "ADMIN") {
    throw createAppError("PERMISSION_DENIED");
  }
  if (user.executiveLabel) {
    throw createAppError("BOD_WRITE_FORBIDDEN");
  }
  return user;
}
