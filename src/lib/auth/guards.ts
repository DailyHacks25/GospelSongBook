/**
 * Route-handler auth guards. Every mutation boundary calls one of these.
 * Roles are read fresh from the database (never trusted from the JWT alone)
 * so demotions apply immediately.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getDb } from "@/lib/db/index";
import { getUserById } from "@/lib/db/queries/users";
import { AppError, toAppError } from "@/lib/errors";
import type { SessionUser } from "@/lib/types";

/** Return the current user (with a fresh role) or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  try {
    const user = getUserById(getDb(), id);
    if (!user) return null;
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AppError("unauthorized", "Sign in to continue.");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new AppError("forbidden", "Administrator access is required.");
  }
  return user;
}

/** JSON error envelope used by every API route. */
export function apiSuccess<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, data }, init);
}

export function apiError(error: unknown): NextResponse {
  const appError = toAppError(error);
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: appError.code,
        message: appError.message,
        ...(appError.fields ? { fields: appError.fields } : {}),
      },
    },
    { status: appError.status },
  );
}

/**
 * Basic same-origin check for mutating requests. Browsers always send an
 * Origin header on cross-site POSTs; we reject mismatches (CSRF defence in
 * depth on top of the SameSite=Lax session cookie).
 */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return; // non-browser client; session cookie is SameSite=Lax anyway
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new AppError("bad_request", "Invalid Origin header.");
  }
  if (originHost !== host) {
    throw new AppError("forbidden", "Cross-origin request rejected.");
  }
}

/** Parse a JSON body safely, returning {} for empty bodies. */
export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    const text = await request.text();
    if (!text.trim()) return {};
    return JSON.parse(text);
  } catch {
    throw new AppError("bad_request", "Request body must be valid JSON.");
  }
}
