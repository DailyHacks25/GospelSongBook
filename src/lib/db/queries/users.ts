/**
 * Typed user queries over better-sqlite3 (email + password accounts).
 */

import { randomUUID } from "node:crypto";
import type { Db } from "@/lib/db/index";
import { nowIso } from "@/lib/db/queries/common";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { Role, User } from "@/lib/types";

interface UserRow {
  id: string;
  google_id: string;
  email: string;
  name: string;
  image: string | null;
  role: Role;
  password_hash: string | null;
  created_at: string;
  updated_at: string;
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    googleId: row.google_id,
    email: row.email,
    name: row.name,
    image: row.image,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getUserById(db: Db, id: string): User | null {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export function getUserByEmail(db: Db, email: string): User | null {
  const row = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.trim().toLowerCase()) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export interface CreateUserInput {
  email: string;
  name?: string;
  password: string;
  role?: Role;
}

/**
 * Create an email + password account. The legacy `google_id` column is kept
 * (unique, not-null) and filled with a synthetic `local:` identifier — there
 * is no Google OAuth in this deployment.
 */
export function createUserWithPassword(db: Db, input: CreateUserInput): User {
  const email = input.email.trim().toLowerCase();
  const id = randomUUID();
  const now = nowIso();
  db.prepare(
    /* sql */ `
      INSERT INTO users (id, google_id, email, name, image, role, password_hash, created_at, updated_at)
      VALUES (@id, @googleId, @email, @name, NULL, @role, @passwordHash, @now, @now)
    `,
  ).run({
    id,
    googleId: `local:${id}`,
    email,
    name: input.name?.trim() || email,
    role: input.role ?? "user",
    passwordHash: hashPassword(input.password),
    now,
  });
  return getUserById(db, id)!;
}

/**
 * Verify an email + password pair. Returns the user on success, null on any
 * failure (unknown email or wrong password). Timing is equalized by the
 * caller (see authenticateUser) via the dummy hash.
 */
export function verifyUserPassword(db: Db, email: string, password: string): User | null {
  const user = getUserByEmail(db, email);
  if (!user) return null;
  const row = db
    .prepare("SELECT password_hash FROM users WHERE id = ?")
    .get(user.id) as { password_hash: string | null } | undefined;
  if (!row?.password_hash) return null;
  if (!verifyPassword(password, row.password_hash)) return null;
  return user;
}

export function setUserPassword(db: Db, email: string, password: string): User | null {
  const user = getUserByEmail(db, email);
  if (!user) return null;
  db.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").run(
    hashPassword(password),
    nowIso(),
    user.id,
  );
  return user;
}

/**
 * Create an account if the email is unknown; otherwise update name/role and
 * (when a password is given) rotate the password. Used by the admin seed and
 * the management scripts.
 */
export function upsertUserWithPassword(
  db: Db,
  input: CreateUserInput & { role: Role },
): { user: User; created: boolean } {
  const existing = getUserByEmail(db, input.email);
  if (!existing) {
    return { user: createUserWithPassword(db, input), created: true };
  }
  const now = nowIso();
  db.prepare(
    "UPDATE users SET name = COALESCE(NULLIF(@name, ''), name), role = @role, updated_at = @now WHERE id = @id",
  ).run({ id: existing.id, name: input.name ?? "", role: input.role, now });
  if (input.password) setUserPassword(db, input.email, input.password);
  return { user: getUserById(db, existing.id)!, created: false };
}

/** Promote or demote an existing account. */
export function setUserRole(db: Db, email: string, role: Role): User | null {
  const normalized = email.trim().toLowerCase();
  const existing = getUserByEmail(db, normalized);
  if (!existing) return null;
  db.prepare("UPDATE users SET role = ?, updated_at = ? WHERE id = ?").run(role, nowIso(), existing.id);
  return getUserById(db, existing.id);
}
